import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '../constants/theme';
import { getRarityColor, getRarityLabel } from '../lib/garden';
import { getGardenEmojiImage } from '../lib/gardenImages';

interface Props {
  visible: boolean;
  emoji: string;
  rarity: string;
  onClose: () => void;
}

export default function GardenRollModal({ visible, emoji, rarity, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // No auto close - user must tap OK
    }
  }, [visible]);

  const rarityLabel = getRarityLabel(rarity);
  const rarityColor = getRarityColor(rarity);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {getGardenEmojiImage(emoji) ? (
            <Image source={getGardenEmojiImage(emoji)!} style={styles.emojiImage} />
          ) : (
            <Text style={styles.emoji}>{emoji}</Text>
          )}
          {rarityLabel ? (
            <Animated.Text style={[styles.rarity, { color: rarityColor, opacity: bounceAnim }]}>
              {rarityLabel}
            </Animated.Text>
          ) : null}
          <TouchableOpacity style={styles.okButton} onPress={onClose}>
            <Text style={styles.okText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  emoji: {
    fontSize: 72,
  },
  emojiImage: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  rarity: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    marginTop: Spacing.sm,
    letterSpacing: 2,
  },
  okButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
  },
  okText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
