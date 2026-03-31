'use client';

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  systemTheme: ResolvedTheme;
}

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'theme';

// Cached server snapshot - MUST be constant reference
const SERVER_SNAPSHOT: ThemeState = { theme: 'system', systemTheme: 'light' };

// Get system preference
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get stored theme
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

// Apply theme to document
function applyTheme(theme: Theme, systemTheme: ResolvedTheme) {
  if (typeof window === 'undefined') return;
  
  const resolved = theme === 'system' ? systemTheme : theme;
  
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Create the store
function createThemeStore() {
  let state: ThemeState = { theme: 'system', systemTheme: 'light' };
  const listeners = new Set<() => void>();
  
  // Initialize on client only
  if (typeof window !== 'undefined') {
    state = {
      theme: getStoredTheme(),
      systemTheme: getSystemTheme(),
    };
    // Apply initial theme
    applyTheme(state.theme, state.systemTheme);
  }
  
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    
    getSnapshot(): ThemeState {
      return state;
    },
    
    getServerSnapshot(): ThemeState {
      // Must return same reference every time
      return SERVER_SNAPSHOT;
    },
    
    setTheme(theme: Theme) {
      state = { ...state, theme };
      applyTheme(theme, state.systemTheme);
      listeners.forEach(l => l());
    },
    
    setSystemTheme(systemTheme: ResolvedTheme) {
      state = { ...state, systemTheme };
      if (state.theme === 'system') {
        applyTheme('system', systemTheme);
      }
      listeners.forEach(l => l());
    }
  };
}

const themeStore = createThemeStore();

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  );
  
  // Compute resolved theme from state (no setState needed)
  const resolvedTheme = useMemo((): ResolvedTheme => {
    return state.theme === 'system' ? state.systemTheme : state.theme;
  }, [state.theme, state.systemTheme]);
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      themeStore.setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    themeStore.setTheme(newTheme);
  }, []);
  
  const contextValue = useMemo(() => ({
    theme: state.theme,
    resolvedTheme,
    setTheme,
  }), [state.theme, resolvedTheme, setTheme]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
