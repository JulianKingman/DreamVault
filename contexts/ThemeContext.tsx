import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../utils/storage';

const THEME_KEY = 'theme_preference';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
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

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  return (
    <ThemeContext.Provider
      value={{ themeMode, resolvedTheme, setThemeMode, toggleTheme }}
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
