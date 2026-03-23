import { supabase } from './supabase';
import { Cafe } from '../types/cafe';

/**
 * Record a cafe view in search history
 * Works for both free and subscribed users
 */
export async function recordCafeView(userId: string, cafe: Cafe): Promise<void> {
  try {
    // First, ensure cafe exists in cafes table
    await upsertCafe(cafe);

    // Then record the view
    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        cafe_id: cafe.id,
        viewed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[History] Record error:', error);
    }
  } catch (error) {
    console.error('[History] Error:', error);
  }
}

/**
 * Get search history for a user
 * Returns cafes ordered by most recent view
 */
export async function getSearchHistory(
  userId: string,
  limit: number = 50
): Promise<(Cafe & { viewed_at: string })[]> {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select(`
        viewed_at,
        cafes (
          id, place_id, name, address, latitude, longitude,
          rating, total_ratings, photo_reference, price_level
        )
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((item: any) => ({
      ...item.cafes,
      viewed_at: item.viewed_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Clear all search history for a user
 */
export async function clearSearchHistory(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Upsert a cafe into the cafes table
 * Used to ensure we have a reference for favorites/history
 */
async function upsertCafe(cafe: Cafe): Promise<void> {
  const { error } = await supabase
    .from('cafes')
    .upsert(
      {
        place_id: cafe.place_id,
        name: cafe.name,
        address: cafe.address,
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        rating: cafe.rating,
        total_ratings: cafe.total_ratings,
        photo_reference: cafe.photo_reference || null,
        price_level: cafe.price_level || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'place_id' }
    );

  if (error) {
    console.error('[Cafe] Upsert error:', error);
  }
}
