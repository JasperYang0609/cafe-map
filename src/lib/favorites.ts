import { supabase } from './supabase';
import { Cafe, FavoriteCafe } from '../types/cafe';

/**
 * Check if user is subscribed (has access to favorites)
 */
export async function isSubscribed(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_subscribed, subscription_expires_at')
      .eq('id', userId)
      .single();

    if (error || !data) return false;

    // Check if subscription is still valid
    if (data.is_subscribed && data.subscription_expires_at) {
      return new Date(data.subscription_expires_at) > new Date();
    }

    return data.is_subscribed || false;
  } catch {
    return false;
  }
}

/**
 * Add a cafe to favorites (requires subscription)
 */
export async function addFavorite(userId: string, cafe: Cafe): Promise<{ success: boolean; error?: string }> {
  // Check subscription first
  const subscribed = await isSubscribed(userId);
  if (!subscribed) {
    return { success: false, error: 'SUBSCRIPTION_REQUIRED' };
  }

  try {
    // Ensure cafe exists
    await supabase
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

    // Add to favorites
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, cafe_id: cafe.id });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'ALREADY_FAVORITED' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove a cafe from favorites
 */
export async function removeFavorite(userId: string, cafeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('cafe_id', cafeId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Get all favorites for a user
 */
export async function getFavorites(userId: string): Promise<FavoriteCafe[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id, created_at,
        cafes (
          id, place_id, name, address, latitude, longitude,
          rating, total_ratings, photo_reference, price_level
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      id: item.id,
      user_id: userId,
      cafe_id: item.cafes.id,
      created_at: item.created_at,
      cafe: item.cafes,
    }));
  } catch {
    return [];
  }
}

/**
 * Check if a specific cafe is favorited
 */
export async function isFavorited(userId: string, cafeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('cafe_id', cafeId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}
