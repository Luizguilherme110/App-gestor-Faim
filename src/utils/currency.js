// Manipulação de moeda em BRL.
//
// Estratégia: o input trabalha sempre com a string de dígitos "crua" (centavos),
// nunca com float parcial. Isso elimina os bugs clássicos de parseFloat com
// separadores (ex.: "1.000,50") e de aritmética de ponto flutuante.

// Formata um número (em reais) como "R$ 1.234,56" — implementação manual e
// determinística, sem depender de Intl (que tem suporte parcial no Hermes).
export const formatBRL = (value) => {
  const n = Number.isFinite(value) ? value : 0;
  const negative = n < 0;
  const cents = Math.round(Math.abs(n) * 100);

  const intPart = Math.floor(cents / 100).toString();
  const decPart = (cents % 100).toString().padStart(2, '0');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negative ? '-' : ''}R$ ${withThousands},${decPart}`;
};

// Converte a string de dígitos do input (centavos) em número de reais.
export const digitsToNumber = (digits) => {
  const onlyDigits = String(digits ?? '').replace(/\D/g, '');
  if (!onlyDigits) return 0;
  return parseInt(onlyDigits, 10) / 100;
};

// Formata a string de dígitos para exibição no campo enquanto o usuário digita.
export const formatDigitsAsCurrency = (digits) => {
  const onlyDigits = String(digits ?? '').replace(/\D/g, '');
  if (!onlyDigits) return '';
  return formatBRL(digitsToNumber(onlyDigits));
};

// Extrai apenas os dígitos de qualquer texto (usado no onChangeText do campo).
export const extractDigits = (text) => String(text ?? '').replace(/\D/g, '');
