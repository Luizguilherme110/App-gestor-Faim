import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Design tokens centralizados — evita cores/spacing "mágicos" espalhados pela UI.
//
// Direção visual: neutro grafite puro (sem viés azul) + um único accent laranja
// de canteiro. Dinheiro é o conteúdo principal, então cor entra no número e
// não no fundo — caixas coloridas ficaram só para estado de erro.

// Paleta clara.
export const lightColors = {
  bg: '#fafafa',
  surface: '#ffffff',
  surfaceAlt: '#f4f4f5', // fundo de campo de texto e botão neutro
  border: '#e4e4e7',
  borderStrong: '#d4d4d8',
  inputBg: '#f4f4f5', // alias histórico de surfaceAlt

  textStrong: '#18181b',
  text: '#27272a',
  textMuted: '#71717a',
  textFaint: '#a1a1aa',

  primary: '#c2410c',
  primaryBg: '#fff1e9',
  onPrimary: '#ffffff',

  expense: '#b91c1c',
  expenseBg: '#fef2f2',
  income: '#15803d',
  incomeBg: '#f0fdf4',

  danger: '#b91c1c',
  recording: '#fef2f2',

  overlay: 'rgba(24, 24, 27, 0.45)',
};

// Paleta escura — mesmos papéis, invertidos. O accent clareia para manter
// contraste sobre fundo escuro, e por isso `onPrimary` vira quase-preto.
export const darkColors = {
  bg: '#0c0c0d',
  surface: '#17171a',
  surfaceAlt: '#212124',
  border: '#27272a',
  borderStrong: '#3f3f46',
  inputBg: '#212124',

  textStrong: '#fafafa',
  text: '#e4e4e7',
  textMuted: '#a1a1aa',
  textFaint: '#71717a',

  primary: '#fb7a3c',
  primaryBg: '#2a1710',
  onPrimary: '#18181b',

  expense: '#f87171',
  expenseBg: '#2a1414',
  income: '#4ade80',
  incomeBg: '#0f2417',

  danger: '#f87171',
  recording: '#2a1414',

  overlay: 'rgba(0, 0, 0, 0.65)',
};

// Back-compat: código não migrado que importa `colors` continua pegando o tema claro.
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  full: 999,
};

// Escala tipográfica. Peso 600/700 no lugar de `bold` genérico, e
// letter-spacing negativo no texto grande (senão display fica frouxo).
export const type = {
  display: { fontSize: 30, fontWeight: '700', letterSpacing: -0.8 },
  valor: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  titulo: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  corpo: { fontSize: 15, fontWeight: '500' },
  corpoForte: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, fontWeight: '500' },
  micro: { fontSize: 11, fontWeight: '600' },
};

// Números de dinheiro precisam de largura fixa por dígito, senão a coluna
// de valores "dança" a cada item da lista.
export const tabular = { fontVariant: ['tabular-nums'] };

// Sombra multiplataforma, reservada ao que realmente flutua (bottom sheet,
// modal). Card comum agora usa borda de 1px: quando tudo tem sombra, nada
// parece estar acima de nada.
export const shadowFlutuante = {
  elevation: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.16,
  shadowRadius: 16,
};

// ========== TEMA (claro/escuro) ==========

const TEMA_KEY = '@gestao_obras_tema';

const ThemeContext = createContext({
  mode: 'light',
  colors: lightColors,
  toggle: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  // Carrega a preferência salva na primeira montagem.
  useEffect(() => {
    (async () => {
      try {
        const salvo = await AsyncStorage.getItem(TEMA_KEY);
        if (salvo === 'light' || salvo === 'dark') setMode(salvo);
      } catch (e) {
        // Preferência de tema não é crítica; ignora falha de leitura.
      }
    })();
  }, []);

  const toggle = () => {
    setMode((atual) => {
      const proximo = atual === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(TEMA_KEY, proximo).catch(() => {});
      return proximo;
    });
  };

  const value = useMemo(
    () => ({ mode, colors: mode === 'dark' ? darkColors : lightColors, toggle }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
