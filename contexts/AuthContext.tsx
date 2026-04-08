import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getDbKey, createDbKey, hasDbKey } from '../utils/db-key';
import { initDatabase, closeDatabase } from '../utils/database';

interface AuthContextValue {
  isAuthenticated: boolean;
  isFirstLaunch: boolean;
  authenticate: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const appState = useRef(AppState.currentState);
  const isAuthenticating = useRef(false);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (isAuthenticating.current) return false;
    isAuthenticating.current = true;
    try {
      console.log('[Auth] Starting authentication...');
      const keyExists = await hasDbKey();
      console.log('[Auth] Key exists:', keyExists);

      if (!keyExists) {
        setIsFirstLaunch(true);
        console.log('[Auth] First launch, creating key...');
        const key = await createDbKey();
        console.log('[Auth] Key created, initializing DB...');
        initDatabase(key);
        setIsAuthenticated(true);
        setIsFirstLaunch(false);
        console.log('[Auth] Authenticated!');
        return true;
      }

      console.log('[Auth] Retrieving key...');
      const key = await getDbKey();
      if (!key) {
        console.log('[Auth] Key retrieval returned null');
        return false;
      }

      console.log('[Auth] Key retrieved, initializing DB...');
      initDatabase(key);
      setIsAuthenticated(true);
      console.log('[Auth] Authenticated!');
      return true;
    } catch (e) {
      console.error('[Auth] Error:', e);
      return false;
    } finally {
      isAuthenticating.current = false;
    }
  }, []);

  // Re-lock when app returns from background
  // Skip re-lock if a biometric prompt is currently showing (inactive→active from system dialog)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active' &&
        isAuthenticated &&
        !isAuthenticating.current
      ) {
        // Only re-lock if the app was actually in background (not just inactive from a system dialog)
        if (appState.current === 'background') {
          closeDatabase();
          setIsAuthenticated(false);
        }
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isFirstLaunch, authenticate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
