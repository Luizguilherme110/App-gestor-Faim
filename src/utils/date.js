// Formatação de datas em pt-BR, sem depender de Intl.

const pad = (n) => String(n).padStart(2, '0');

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Recebe um ISO string (ou timestamp) e devolve "dd/mm/aaaa".
export const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Data de um lançamento, tolerante a registros antigos.
//
// Versões anteriores do app gravavam `data` como texto pt-BR ("03/09/2026")
// em vez de `createdAt` em ISO. Sem esse fallback, todo lançamento antigo
// ficaria fora da separação por mês.
export const dataDoLancamento = (t) => {
  if (t?.createdAt) {
    const d = new Date(t.createdAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const legado = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(t?.data || '').trim());
  if (legado) {
    const [, dia, mes, ano] = legado;
    const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

// Chave ordenável de mês: "2026-09". Ordenar essas strings em ordem
// alfabética já dá a ordem cronológica, o que evita comparar objetos Date.
export const chaveMes = (t) => {
  const d = dataDoLancamento(t);
  if (!d) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const rotuloMes = (chave) => {
  const [ano, mes] = String(chave).split('-');
  const nome = MESES[Number(mes) - 1];
  return nome ? `${nome} de ${ano}` : String(chave);
};

// Meses que têm ao menos um lançamento, do mais recente para o mais antigo.
// Devolve `{ chave, rotulo, total }` para a UI montar o seletor sem precisar
// recontar nada.
export const mesesDisponiveis = (transactions) => {
  const contagem = new Map();
  for (const t of transactions) {
    const chave = chaveMes(t);
    if (!chave) continue;
    contagem.set(chave, (contagem.get(chave) || 0) + 1);
  }
  return [...contagem.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([chave, total]) => ({ chave, rotulo: rotuloMes(chave), total }));
};

// Filtra lançamentos de um mês. Sem chave, devolve a lista inteira.
export const filtrarPorMes = (transactions, chave) => {
  if (!chave) return transactions;
  return transactions.filter((t) => chaveMes(t) === chave);
};

export const PERIODOS = {
  TUDO: 'tudo',
  ESTE_MES: 'esteMes',
  MES_PASSADO: 'mesPassado',
  ULTIMOS_3_MESES: 'ultimos3Meses',
};

// Devolve [inicio, fim) do período nomeado, ou null para "tudo" (sem filtro).
export const periodoParaIntervalo = (periodo) => {
  if (periodo === PERIODOS.TUDO || !periodo) return null;

  const agora = new Date();
  const inicioMes = (offset) => new Date(agora.getFullYear(), agora.getMonth() + offset, 1);

  switch (periodo) {
    case PERIODOS.ESTE_MES:
      return [inicioMes(0), inicioMes(1)];
    case PERIODOS.MES_PASSADO:
      return [inicioMes(-1), inicioMes(0)];
    case PERIODOS.ULTIMOS_3_MESES:
      return [inicioMes(-2), inicioMes(1)];
    default:
      return null;
  }
};

// Filtra uma lista de lançamentos (com `createdAt`) pelo período nomeado.
export const filtrarPorPeriodo = (transactions, periodo) => {
  const intervalo = periodoParaIntervalo(periodo);
  if (!intervalo) return transactions;
  const [inicio, fim] = intervalo;
  return transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return !Number.isNaN(d.getTime()) && d >= inicio && d < fim;
  });
};
