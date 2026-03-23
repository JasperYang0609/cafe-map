import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Cafe } from '../types/cafe';

export interface HistoryEntry {
  cafe: Cafe;
  viewed_at: string;
}

interface HistoryContextType {
  history: HistoryEntry[];
  addToHistory: (cafe: Cafe) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType>({
  history: [],
  addToHistory: () => {},
  clearHistory: () => {},
});

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const addToHistory = useCallback((cafe: Cafe) => {
    setHistory((prev) => {
      // Remove duplicate
      const filtered = prev.filter((h) => h.cafe.place_id !== cafe.place_id);
      // Add new at beginning
      return [{ cafe, viewed_at: new Date().toISOString() }, ...filtered].slice(0, 100);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
