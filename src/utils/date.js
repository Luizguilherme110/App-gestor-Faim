// Formatação de datas em pt-BR, sem depender de Intl.

const pad = (n) => String(n).padStart(2, '0');

// Recebe um ISO string (ou timestamp) e devolve "dd/mm/aaaa".
export const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
