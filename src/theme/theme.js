import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Design tokens centralizados — evita cores/spacing "mágicos" espalhados pela UI.

// Paleta clara (padrão histórico do app).
export const lightColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  inputBg: '#f1f5f9',

  textStrong: '#0f172a',
  text: '#1e293b',
  textMuted: '#64748b',
  textFaint: '#94a3b8',

  primary: '#2563eb',
  primaryBg: '#dbeafe',

  expense: '#dc2626',
  expenseBg: '#fee2e2',
  income: '#16a34a',
  incomeBg: '#dcfce7',

  danger: '#dc2626',
  recording: '#fca5a5',

  overlay: 'rgba(15, 23, 42, 0.5)',
};

// Paleta escura — mesmos papéis, tons invertidos (slate 900/800).
export const darkColors = {
  bg: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  inputBg: '#334155',

  textStrong: '#f8fafc',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textFaint: '#64748b',

  primary: '#3b82f6',
  primaryBg: '#1e3a8a',

  expense: '#f87171',
  expenseBg: '#7f1d1d',
  income: '#4ade80',
  incomeBg: '#14532d',

  danger: '#f87171',
  recording: '#fca5a5',

  overlay: 'rgba(0, 0, 0, 0.6)',
};

// Back-compat: código não migrado que importa `colors` continua pegando o tema claro.
export const colors = lightColors;

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
