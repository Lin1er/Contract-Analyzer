'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore, useMemo } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'clearcontract-language';

// Server snapshot must be constant
const SERVER_LANGUAGE: Language = 'en';

function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || '';
  
  // Check if browser language starts with 'id' (covers 'id', 'id-ID', etc.)
  if (browserLang.toLowerCase().startsWith('id')) {
    return 'id';
  }
  
  return 'en';
}

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'id') {
    return stored;
  }
  
  // Auto-detect and store
  const detected = detectBrowserLanguage();
  localStorage.setItem(STORAGE_KEY, detected);
  return detected;
}

// Create language store
function createLanguageStore() {
  let language: Language = 'en';
  const listeners = new Set<() => void>();
  
  // Initialize on client only
  if (typeof window !== 'undefined') {
    language = getStoredLanguage();
  }
  
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    
    getSnapshot(): Language {
      return language;
    },
    
    getServerSnapshot(): Language {
      // Must return same reference every time
      return SERVER_LANGUAGE;
    },
    
    setLanguage(lang: Language) {
      language = lang;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
      }
      listeners.forEach(l => l());
    }
  };
}

const languageStore = createLanguageStore();

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(
    languageStore.subscribe,
    languageStore.getSnapshot,
    languageStore.getServerSnapshot
  );

  const setLanguage = useCallback((lang: Language) => {
    languageStore.setLanguage(lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export { type Language, type TranslationKey };
