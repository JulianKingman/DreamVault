import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '../utils/storage';

const AUTH_ENABLED_KEY = 'auth_enabled';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  setAuthEnabled: (enabled: boolean) => void;
  authenticate: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthEnabled, setIsAuthEnabledState] = useState(() =>
    storage.getBoolean(AUTH_ENABLED_KEY) ?? false
  );
  const appState = useRef(AppState.currentState);

  const authenticate = async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Dream Vault',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });
    setIsAuthenticated(result.success);
    return result.success;
  };

  const setAuthEnabled = (enabled: boolean) => {
    storage.set(AUTH_ENABLED_KEY, enabled);
    setIsAuthEnabledState(enabled);
    if (!enabled) {
      setIsAuthenticated(true);
    }
  };

  // Lock when app goes to background, unlock attempt when returning
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        isAuthEnabled &&
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        setIsAuthenticated(false);
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthEnabled]);

  // Auto-authenticate on mount if auth is not enabled
  useEffect(() => {
    if (!isAuthEnabled) {
      setIsAuthenticated(true);
    }
  }, [isAuthEnabled]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isAuthEnabled, setAuthEnabled, authenticate }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
