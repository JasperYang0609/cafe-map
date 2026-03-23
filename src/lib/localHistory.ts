import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cafe } from '../types/cafe';

const HISTORY_KEY = 'cafe_search_history';
const MAX_HISTORY = 100;

export interface HistoryEntry {
  cafe: Cafe;
  viewed_at: string;
}

/**
 * Record a cafe view to local storage
 */
export async function recordLocalView(cafe: Cafe): Promise<void> {
  try {
    const history = await getLocalHistory();

    // Add new entry at the beginning
    const entry: HistoryEntry = {
      cafe,
      viewed_at: new Date().toISOString(),
    };

    // Remove duplicate if exists
    const filtered = history.filter((h) => h.cafe.place_id !== cafe.place_id);
    filtered.unshift(entry);

    // Keep max entries
    const trimmed = filtered.slice(0, MAX_HISTORY);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[LocalHistory] Record error:', error);
  }
}

/**
 * Get local search history
 */
export async function getLocalHistory(): Promise<HistoryEntry[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data) as HistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * Clear local search history
 */
export async function clearLocalHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('[LocalHistory] Clear error:', error);
  }
}
