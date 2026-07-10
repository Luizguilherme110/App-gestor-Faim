import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatBRL } from './currency';
import { formatDate } from './date';

// Exportação das movimentações de UMA obra específica.
// Formatos: Excel (CSV) e PDF (pdf-lib — JS puro, sem módulo nativo,
// então funciona via atualização OTA sem reinstalar o app).

const somaTotais = (transactions) => {
  let gastos = 0;
  let ganhos = 0;
  for (const t of transactions) {
    const v = Number(t.valor) || 0;
    if (t.tipo === 'GASTO') gastos += v;
    else ganhos += v;
  }
  return { gastos, ganhos, saldo: ganhos - gastos };
};

// Remove caracteres que atrapalham nome de arquivo.
const nomeArquivo = (obraNome, ext) => {
  const base = String(obraNome || 'obra').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40);
  const timestamp = new Date().toISOString().split('T')[0];
  return `Obra_${base}_${timestamp}.${ext}`;
};

const compartilhar = async (uri, mimeType, uti) => {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento não disponível no seu dispositivo.');
  }
  await Sharing.shareAsync(uri, { mimeType, UTI: uti, dialogTitle: 'Exportar' });
};

// ─── Excel (CSV) ───
// Excel em pt-BR separa colunas por ';' (não ','), e espera BOM UTF-8 para
// mostrar acentos corretamente. Sem isso, tudo cai numa coluna só e os
// acentos viram "Ã§Ã£o".
const SEP = ';';

// Envolve em aspas só quando a célula tem separador, aspas ou quebra de linha.
const celula = (v) => {
  const s = String(v ?? '');
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const linhaCSV = (...celulas) => celulas.map(celula).join(SEP);

export const exportarObraCSV = async (obra, transactions) => {
  const { gastos, ganhos, saldo } = somaTotais(transactions);

  const linhas = [];
  linhas.push(linhaCSV('Obra', obra.nome));
  linhas.push(linhaCSV('Exportado em', new Date().toLocaleString('pt-BR')));
  linhas.push('');
  linhas.push(linhaCSV('Data', 'Tipo', 'Valor', 'Observação'));

  if (transactions.length > 0) {
    transactions.forEach((t) => {
      linhas.push(
        linhaCSV(formatDate(t.createdAt), t.tipo, formatBRL(t.valor), t.observacao || '-'),
      );
    });
  } else {
    linhas.push('Nenhuma movimentação nesta obra');
  }

  linhas.push('');
  linhas.push(linhaCSV('Total de Gastos', formatBRL(gastos)));
  linhas.push(linhaCSV('Total de Receitas', formatBRL(ganhos)));
  linhas.push(linhaCSV('Saldo', formatBRL(saldo)));
  linhas.push(linhaCSV('Total de Movimentações', String(transactions.length)));

  // ﻿ = BOM UTF-8 (faz o Excel reconhecer os acentos).
  const csv = '﻿' + linhas.join('\r\n');

  const fileName = nomeArquivo(obra.nome, 'csv');
  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await compartilhar(filePath, 'text/csv', 'public.comma-separated-values-text');
};

// ─── PDF (pdf-lib) ───
const RED = rgb(0.86, 0.15, 0.15);
const GREEN = rgb(0.09, 0.64, 0.29);
const DARK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.39, 0.45, 0.55);
const LINE = rgb(0.9, 0.93, 0.96);

// Corta um texto pra caber na largura, com reticências.
const truncar = (texto, font, size, maxWidth) => {
  let t = String(texto);
  if (font.widthOfTextAtSize(t, size) <= maxWidth) return t;
  while (t.length > 1 && font.widthOfTextAtSize(t + '…', size) > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '…';
};

export const exportarObraPDF = async (obra, transactions) => {
  const { gastos, ganhos, saldo } = somaTotais(transactions);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595; // A4 em pontos
  const H = 842;
  const M = 40; // margem
  const colData = M;
  const colObs = M + 78;
  const colValorRight = W - M; // valor alinhado à direita
  const obsWidth = colValorRight - 95 - colObs;

  let page = pdf.addPage([W, H]);
  let y = H - M;

  const novaPagina = () => {
    page = pdf.addPage([W, H]);
    y = H - M;
  };

  // Cabeçalho
  page.drawText(truncar(obra.nome, bold, 20, W - 2 * M), { x: M, y: y - 20, size: 20, font: bold, color: DARK });
  y -= 30;
  page.drawText(`Movimentações — gerado em ${new Date().toLocaleString('pt-BR')}`, {
    x: M, y: y - 12, size: 10, font, color: MUTED,
  });
  y -= 34;

  // Resumo
  const resumo = [
    ['Gastos Obra: ', formatBRL(gastos), RED],
    ['Vendas na Planta: ', formatBRL(ganhos), GREEN],
    ['Saldo Disponível: ', formatBRL(saldo), saldo < 0 ? RED : GREEN],
  ];
  resumo.forEach(([rotulo, valor, cor]) => {
    page.drawText(rotulo, { x: M, y: y - 12, size: 12, font: bold, color: DARK });
    const rotW = bold.widthOfTextAtSize(rotulo, 12);
    page.drawText(valor, { x: M + rotW, y: y - 12, size: 12, font: bold, color: cor });
    y -= 20;
  });
  y -= 14;

  // Cabeçalho da tabela
  const drawCabecalhoTabela = () => {
    page.drawText('Data', { x: colData, y: y - 11, size: 10, font: bold, color: MUTED });
    page.drawText('Observação', { x: colObs, y: y - 11, size: 10, font: bold, color: MUTED });
    const vw = bold.widthOfTextAtSize('Valor', 10);
    page.drawText('Valor', { x: colValorRight - vw, y: y - 11, size: 10, font: bold, color: MUTED });
    y -= 18;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE });
    y -= 4;
  };
  drawCabecalhoTabela();

  if (transactions.length === 0) {
    page.drawText('Nenhuma movimentação', { x: M, y: y - 14, size: 11, font, color: MUTED });
  } else {
    for (const t of transactions) {
      if (y < M + 24) {
        novaPagina();
        drawCabecalhoTabela();
      }
      const gasto = t.tipo === 'GASTO';
      const cor = gasto ? RED : GREEN;
      const valorTxt = `${gasto ? '- ' : '+ '}${formatBRL(t.valor)}`;
      const valorW = bold.widthOfTextAtSize(valorTxt, 10);

      page.drawText(formatDate(t.createdAt), { x: colData, y: y - 12, size: 10, font, color: DARK });
      page.drawText(truncar(t.observacao || '-', font, 10, obsWidth), {
        x: colObs, y: y - 12, size: 10, font, color: DARK,
      });
      page.drawText(valorTxt, { x: colValorRight - valorW, y: y - 12, size: 10, font: bold, color: cor });
      y -= 18;
      page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LINE });
      y -= 2;
    }
  }

  const base64 = await pdf.saveAsBase64();
  const filePath = `${FileSystem.documentDirectory}${nomeArquivo(obra.nome, 'pdf')}`;
  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await compartilhar(filePath, 'application/pdf', 'com.adobe.pdf');
};
