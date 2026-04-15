/**
 * Garden emoji image map
 * Pre-rendered iOS-style emoji PNGs for consistent cross-platform display
 * and better performance (no bitmap conversion needed)
 */
import { ImageSourcePropType } from 'react-native';

const GARDEN_EMOJI_IMAGES: Record<string, ImageSourcePropType> = {
  '🌱': require('../assets/images/garden-emoji/sprout.png'),
  '🍄': require('../assets/images/garden-emoji/mushroom.png'),
  '🌳': require('../assets/images/garden-emoji/tree.png'),
  '🌻': require('../assets/images/garden-emoji/sunflower.png'),
  '🌸': require('../assets/images/garden-emoji/sakura.png'),
  '🦋': require('../assets/images/garden-emoji/butterfly.png'),
  '🦊': require('../assets/images/garden-emoji/fox.png'),
  '🦄': require('../assets/images/garden-emoji/unicorn.png'),
};

export function getGardenEmojiImage(emoji: string): ImageSourcePropType | null {
  return GARDEN_EMOJI_IMAGES[emoji] || null;
}
