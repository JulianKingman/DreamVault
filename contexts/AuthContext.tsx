import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getDbKey, createDbKey, hasDbKey, setKeyProtection } from '../utils/db-key';
import { initDatabase, closeDatabase } from '../utils/database';
import { storage } from '../utils/storage';

const AUTH_ENABLED_KEY = 'auth_enabled';

export type AuthResult =
  | { ok: true }
  | { ok: false; reason: 'in-progress' | 'no-key' | 'init-failed'; error?: unknown };

interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  isFirstLaunch: boolean;
  /**
   * True while the app is inactive or backgrounded. Consumers should render a
   * privacy overlay over sensitive content so iOS's launch-image snapshot
   * doesn't leak dream content.
   */
  isObscured: boolean;
  /**
   * Returns true on success. Toggling on prompts for biometric verification;
   * toggling off prompts to read the auth-protected key and re-store it
   * without protection. Returns false if the prompt was cancelled or no
   * biometric is enrolled.
   */
  setAuthEnabled: (enabled: boolean) => Promise<boolean>;
  authenticate: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthEnabled, setIsAuthEnabledState] = useState(() =>
    storage.getBoolean(AUTH_ENABLED_KEY) ?? false
  );
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [isObscured, setIsObscured] = useState(false);
  const appState = useRef(AppState.currentState);
  const isAuthenticating = useRef(false);
  // Tracks whether we've passed through `background` since last `active`.
  // We can't rely on `appState.current === 'background'` when receiving the
  // `active` event because iOS always routes background→inactive→active, so
  // the prev state at that moment is 'inactive', not 'background'.
  const wasBackgroundedRef = useRef(false);

  // Read the preference through a ref so authenticate() doesn't need to be
  // recreated (and re-fire its consumers' useEffect) whenever isAuthEnabled
  // toggles in settings.
  const isAuthEnabledRef = useRef(isAuthEnabled);
  useEffect(() => {
    isAuthEnabledRef.current = isAuthEnabled;
  }, [isAuthEnabled]);

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    if (isAuthenticating.current) {
      console.log('[Auth] Already authenticating, ignoring');
      return { ok: false, reason: 'in-progress' };
    }
    isAuthenticating.current = true;
    try {
      const authRequired = isAuthEnabledRef.current;
      console.log('[Auth] Starting authentication...', { authRequired });
      const keyExists = await hasDbKey();
      console.log('[Auth] Key exists:', keyExists);

      if (!keyExists) {
        setIsFirstLaunch(true);
        console.log('[Auth] First launch, creating key...');
        try {
          const key = await createDbKey(authRequired);
          console.log('[Auth] Key created, initializing DB...');
          initDatabase(key);
          setIsAuthenticated(true);
          setIsFirstLaunch(false);
          console.log('[Auth] Authenticated!');
          return { ok: true };
        } catch (e) {
          console.error('[Auth] Key creation / init failed:', e);
          return { ok: false, reason: 'init-failed', error: e };
        }
      }

      console.log('[Auth] Retrieving key...');
      const key = await getDbKey(authRequired);
      if (!key) {
        console.warn('[Auth] Key retrieval returned null');
        return { ok: false, reason: 'no-key' };
      }

      try {
        console.log('[Auth] Key retrieved, initializing DB...');
        initDatabase(key);
        setIsAuthenticated(true);
        console.log('[Auth] Authenticated!');
        return { ok: true };
      } catch (e) {
        console.error('[Auth] DB init failed:', e);
        return { ok: false, reason: 'init-failed', error: e };
      }
    } finally {
      isAuthenticating.current = false;
    }
  }, []);

  const setAuthEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (enabled) {
      // Verify with biometric before enabling, so we know it actually works.
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Face ID',
      });
      if (!result.success) return false;
    }
    const ok = await setKeyProtection(enabled);
    if (!ok) return false;
    storage.set(AUTH_ENABLED_KEY, enabled);
    setIsAuthEnabledState(enabled);
    return true;
  }, []);

  // If the user has Face ID disabled but we're not authenticated yet (e.g.
  // cold start, returning from background), authenticate silently in the
  // background so the LockScreen UI never needs to appear.
  useEffect(() => {
    if (!isAuthEnabled && !isAuthenticated && !isAuthenticating.current) {
      authenticate();
    }
  }, [isAuthEnabled, isAuthenticated, authenticate]);

  // Privacy overlay + re-lock when app returns from background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // Obscure on anything that isn't fully active. This covers notification
      // banners, control center, Face ID prompts — all transient — as well as
      // real backgrounding. The overlay disappears as soon as we're active.
      if (nextState === 'inactive' || nextState === 'background') {
        setIsObscured(true);
      } else if (nextState === 'active') {
        setIsObscured(false);
      }

      // Remember background visits so we can re-lock on return to active.
      if (nextState === 'background') {
        wasBackgroundedRef.current = true;
      }

      if (
        nextState === 'active' &&
        wasBackgroundedRef.current &&
        isAuthenticated &&
        !isAuthenticating.current
      ) {
        wasBackgroundedRef.current = false;
        closeDatabase();
        setIsAuthenticated(false);
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isAuthEnabled, isFirstLaunch, isObscured, setAuthEnabled, authenticate }}
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
