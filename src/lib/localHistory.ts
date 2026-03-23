import * as FileSystem from 'expo-file-system';
import { Cafe } from '../types/cafe';

const HISTORY_FILE = `${FileSystem.documentDirectory}search_history.json`;
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

    const entry: HistoryEntry = {
      cafe,
      viewed_at: new Date().toISOString(),
    };

    // Remove duplicate if exists
    const filtered = history.filter((h) => h.cafe.place_id !== cafe.place_id);
    filtered.unshift(entry);

    // Keep max entries
    const trimmed = filtered.slice(0, MAX_HISTORY);

    await FileSystem.writeAsStringAsync(HISTORY_FILE, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[LocalHistory] Record error:', error);
  }
}

/**
 * Get local search history
 */
export async function getLocalHistory(): Promise<HistoryEntry[]> {
  try {
    const info = await FileSystem.getInfoAsync(HISTORY_FILE);
    if (!info.exists) return [];

    const data = await FileSystem.readAsStringAsync(HISTORY_FILE);
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
    const info = await FileSystem.getInfoAsync(HISTORY_FILE);
    if (info.exists) {
      await FileSystem.deleteAsync(HISTORY_FILE);
    }
  } catch (error) {
    console.error('[LocalHistory] Clear error:', error);
  }
}
