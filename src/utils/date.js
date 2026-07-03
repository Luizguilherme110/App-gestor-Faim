// Formatação de datas em pt-BR, sem depender de Intl.

const pad = (n) => String(n).padStart(2, '0');

// Recebe um ISO string (ou timestamp) e devolve "dd/mm/aaaa".
export const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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
