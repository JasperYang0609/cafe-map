/**
 * Garden Collection System
 * Each favorite gets a random garden item based on rarity
 */

export interface GardenItem {
  id: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stars: number;
  weight: number; // probability weight
}

export const GARDEN_ITEMS: GardenItem[] = [
  { id: 'sprout',     emoji: '🌱', rarity: 'common',    stars: 1, weight: 25 },
  { id: 'leaf',       emoji: '🌿', rarity: 'common',    stars: 1, weight: 25 },
  { id: 'tree',       emoji: '🌳', rarity: 'uncommon',  stars: 2, weight: 18 },
  { id: 'sunflower',  emoji: '🌻', rarity: 'uncommon',  stars: 2, weight: 12 },
  { id: 'sakura',     emoji: '🌸', rarity: 'rare',      stars: 3, weight: 8 },
  { id: 'butterfly',  emoji: '🦋', rarity: 'rare',      stars: 3, weight: 6 },
  { id: 'fox',        emoji: '🦊', rarity: 'epic',      stars: 4, weight: 4 },
  { id: 'unicorn',    emoji: '🦄', rarity: 'legendary', stars: 5, weight: 2 },
];

const TOTAL_WEIGHT = GARDEN_ITEMS.reduce((sum, item) => sum + item.weight, 0);

/**
 * Roll a random garden item based on weighted probability
 */
export function rollGardenItem(): GardenItem {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const item of GARDEN_ITEMS) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return GARDEN_ITEMS[0]; // fallback
}

/**
 * Get rarity color for display
 */
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common':    return '#8C8C8C';
    case 'uncommon':  return '#2D5A27';
    case 'rare':      return '#1976D2';
    case 'epic':      return '#9C27B0';
    case 'legendary': return '#FF6F00';
    default:          return '#8C8C8C';
  }
}

/**
 * Get rarity label for display
 */
export function getRarityLabel(rarity: string): string {
  switch (rarity) {
    case 'common':    return '★';
    case 'uncommon':  return '★★';
    case 'rare':      return '★★★';
    case 'epic':      return '★★★★';
    case 'legendary': return '★★★★★';
    default:          return '★';
  }
}
