// ID único para cada lançamento. Combina timestamp + aleatoriedade para
// eliminar o risco de colisão de Math.random() puro (que pode repetir).
export const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
