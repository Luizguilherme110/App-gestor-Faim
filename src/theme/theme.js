// Design tokens centralizados — evita cores/spacing "mágicos" espalhados pela UI.
export const colors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  inputBg: '#f1f5f9',

  textStrong: '#0f172a',
  text: '#1e293b',
  textMuted: '#64748b',
  textFaint: '#94a3b8',

  primary: '#2563eb',

  expense: '#dc2626',
  expenseBg: '#fee2e2',
  income: '#16a34a',
  incomeBg: '#dcfce7',

  danger: '#dc2626',
  recording: '#fca5a5',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const radius = {
  sm: 8,
  md: 12,
};

// Sombra multiplataforma (Android usa elevation, iOS usa shadow*).
export const shadow = {
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.12,
  shadowRadius: 2,
};
