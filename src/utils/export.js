import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { formatBRL } from './currency';
import { formatDate } from './date';

/**
 * Cria um arquivo CSV (compatível com Excel)
 * Mais simples e confiável que XLSX no Expo
 */
const createCSV = (obras, transactions) => {
  let csv = 'RELATÓRIO DE OBRAS\n';
  csv += `Data de Exportação: ${new Date().toLocaleString('pt-BR')}\n\n`;

  obras.forEach((obra) => {
    const obraTransactions = transactions.filter((t) => t.categoria === obra.nome);

    // Cabeçalho da obra
    csv += `\nOBRA: ${obra.nome}\n`;
    csv += `Criada em: ${formatDate(obra.criadoEm)}\n`;
    csv += `${'='.repeat(80)}\n`;

    // Cabeçalho da tabela
    csv += 'Data,Tipo,Valor,Observação\n';

    // Dados
    if (obraTransactions.length > 0) {
      obraTransactions.forEach((t) => {
        csv += `"${formatDate(t.createdAt)}","${t.tipo}","${formatBRL(t.valor)}","${t.observacao || '-'}"\n`;
      });
    } else {
      csv += 'Nenhuma transação nesta obra\n';
    }

    // Resumo
    let totalGastos = 0;
    let totalReceitas = 0;
    obraTransactions.forEach((t) => {
      const v = Number(t.valor) || 0;
      if (t.tipo === 'GASTO') totalGastos += v;
      else totalReceitas += v;
    });

    csv += '\n--- RESUMO ---\n';
    csv += `Total de Gastos,${formatBRL(totalGastos)}\n`;
    csv += `Total de Receitas,${formatBRL(totalReceitas)}\n`;
    csv += `Saldo,${formatBRL(totalReceitas - totalGastos)}\n`;
    csv += `Total de Transações,${obraTransactions.length}\n`;
  });

  // Resumo geral
  csv += `\n\n${'='.repeat(80)}\n`;
  csv += 'RESUMO GERAL\n';
  csv += `${'='.repeat(80)}\n`;
  csv += 'Obra,Total Gastos,Total Receitas,Saldo,Total Transações\n';

  obras.forEach((obra) => {
    const obraTransactions = transactions.filter((t) => t.categoria === obra.nome);
    let totalGastos = 0;
    let totalReceitas = 0;
    obraTransactions.forEach((t) => {
      const v = Number(t.valor) || 0;
      if (t.tipo === 'GASTO') totalGastos += v;
      else totalReceitas += v;
    });

    csv += `"${obra.nome}","${formatBRL(totalGastos)}","${formatBRL(totalReceitas)}","${formatBRL(totalReceitas - totalGastos)}",${obraTransactions.length}\n`;
  });

  return csv;
};

/**
 * Exporta dados para um arquivo (CSV ou texto)
 * Funciona melhor que XLSX no Expo/React Native
 * @param {Array} obras - Lista de obras
 * @param {Array} transactions - Lista de todas as transações
 * @returns {Promise<void>}
 */
export const exportarParaExcel = async (obras, transactions) => {
  try {
    if (obras.length === 0) {
      throw new Error('Nenhuma obra para exportar.');
    }

    // Gera o conteúdo
    const conteudo = createCSV(obras, transactions);

    // Nome do arquivo
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Gestao_Obras_${timestamp}.txt`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Salva o arquivo
    await FileSystem.writeAsStringAsync(filePath, conteudo, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Compartilha
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/plain',
        dialogTitle: 'Exportar Relatório',
        UTI: 'public.plain-text',
      });
    } else {
      throw new Error('Compartilhamento não disponível no seu dispositivo.');
    }
  } catch (error) {
    console.error('Erro ao exportar:', error);
    throw new Error(error.message || 'Erro ao exportar relatório. Tente novamente.');
  }
};
