// Formata milissegundos como "m:ss" (ex.: 65000 -> "1:05").
export const formatDuration = (millis) => {
  const totalSec = Math.max(0, Math.round((Number(millis) || 0) / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
};
