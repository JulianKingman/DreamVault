import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../utils/storage';

const THEME_KEY = 'theme_preference';

type ThemeMode = 'light' | 'dark' | 'midnight' | 'system';
type ResolvedTheme = 'light' | 'dark' | 'midnight';

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = storage.getString(THEME_KEY);
    return (stored as ThemeMode) ?? 'dark';
  });

  const resolvedTheme: ResolvedTheme =
    themeMode === 'system'
      ? (systemColorScheme ?? 'dark')
      : themeMode;

  const setThemeMode = (mode: ThemeMode) => {
    storage.set(THEME_KEY, mode);
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider
      value={{ themeMode, resolvedTheme, setThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
