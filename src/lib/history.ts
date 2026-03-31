// History management utilities for ClearContract
import type { AnalysisResult, HistoryEntry } from '@/types';
import type { TranslationKey } from '@/lib/i18n/translations';

const STORAGE_KEY = 'clearcontract_history';
const MAX_HISTORY_ENTRIES = 10;

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all history entries
export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Sort by createdAt descending (most recent first)
    return parsed.sort((a: HistoryEntry, b: HistoryEntry) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

// Add a new entry to history
export function addToHistory(
  fileName: string,
  analysis: AnalysisResult,
  language: 'en' | 'id'
): HistoryEntry {
  const entry: HistoryEntry = {
    id: generateId(),
    fileName,
    analysis,
    createdAt: Date.now(),
    language,
  };

  const history = getHistory();
  
  // Add new entry at the beginning
  history.unshift(entry);
  
  // Keep only the most recent entries
  const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch {
    // Storage might be full, try removing oldest entries
    const minimalHistory = trimmedHistory.slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalHistory));
  }

  return entry;
}

// Remove an entry from history
export function removeFromHistory(id: string): void {
  const history = getHistory();
  const filtered = history.filter((entry) => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Clear all history
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Get a single entry by ID
export function getHistoryEntry(id: string): HistoryEntry | null {
  const history = getHistory();
  return history.find((entry) => entry.id === id) || null;
}

// Format relative time
export function formatRelativeTime(timestamp: number, t: (key: TranslationKey) => string): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return t('justNow');
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? t('minute') : t('minutes')} ${t('ago')}`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? t('hour') : t('hours')} ${t('ago')}`;
  } else {
    return `${days} ${days === 1 ? t('day') : t('days')} ${t('ago')}`;
  }
}
