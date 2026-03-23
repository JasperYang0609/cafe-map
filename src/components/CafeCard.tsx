import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Cafe } from '../types/cafe';
import { getPhotoUrl } from '../lib/places';

interface CafeCardProps {
  cafe: Cafe;
  onFavorite?: () => void;
  isFavorited?: boolean;
  showFavoriteButton?: boolean;
}

export default function CafeCard({
  cafe,
  onFavorite,
  isFavorited = false,
  showFavoriteButton = true,
}: CafeCardProps) {
  const router = useRouter();
  const photoUrl = cafe.photo_reference ? getPhotoUrl(cafe.photo_reference) : null;

  const handleCardPress = () => {
    router.push({
      pathname: '/cafe/[id]',
      params: {
        id: cafe.place_id,
        place_id: cafe.place_id,
        name: cafe.name,
        address: cafe.address || '',
        latitude: String(cafe.latitude),
        longitude: String(cafe.longitude),
        rating: String(cafe.rating),
        total_ratings: String(cafe.total_ratings),
        photo_references: JSON.stringify(cafe.photo_references || []),
        is_open: cafe.is_open === null || cafe.is_open === undefined ? '' : String(cafe.is_open),
        distance: cafe.distance !== undefined ? String(cafe.distance) : '',
      },
    });
  };

  const handleNavigate = async () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}&destination_place_id=${cafe.place_id}`;
    const canOpenGoogle = await Linking.canOpenURL('comgooglemaps://');

    if (canOpenGoogle) {
      // Open Google Maps app directly
      Linking.openURL(`comgooglemaps://?daddr=${cafe.latitude},${cafe.longitude}&directionsmode=driving`);
    } else {
      // Fallback to Google Maps web (opens in browser, prompts to open app)
      Linking.openURL(googleMapsUrl);
    }
  };

  const handleCall = () => {
    // TODO: Implement when we have phone data from Place Details
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`full-${i}`} name="star" size={14} color={Colors.star} />
      );
    }
    if (hasHalf) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color={Colors.star} />
      );
    }
    const remaining = 5 - fullStars - (hasHalf ? 1 : 0);
    for (let i = 0; i < remaining; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color={Colors.star} />
      );
    }
    return stars;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.9}>
      {/* Photo */}
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="cafe-outline" size={40} color={Colors.textSecondary} />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {cafe.name}
          </Text>
          {showFavoriteButton && (
            <TouchableOpacity onPress={onFavorite}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorited ? Colors.error : Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.address} numberOfLines={1}>
          {cafe.address}
        </Text>

        <View style={styles.ratingRow}>
          <View style={styles.stars}>{renderStars(cafe.rating)}</View>
          <Text style={styles.ratingText}>
            {cafe.rating > 0 ? cafe.rating.toFixed(1) : '-'}
          </Text>
          <Text style={styles.reviewCount}>
            ({cafe.total_ratings})
          </Text>
          {cafe.is_open !== null && (
            <View style={[styles.openBadge, !cafe.is_open && styles.closedBadge]}>
              <Text style={[styles.openText, !cafe.is_open && styles.closedText]}>
                {cafe.is_open ? '營業中' : '已打烊'}
              </Text>
            </View>
          )}
        </View>

        {cafe.distance !== undefined && (
          <Text style={styles.distance}>
            {cafe.distance < 1000
              ? `${Math.round(cafe.distance)}m`
              : `${(cafe.distance / 1000).toFixed(1)}km`}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleNavigate}>
            <Ionicons name="navigate-outline" size={18} color={Colors.surface} />
            <Text style={styles.actionText}>導航</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  photo: {
    width: '100%',
    height: 160,
  },
  photoPlaceholder: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  address: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  openBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  closedBadge: {
    backgroundColor: '#FFEBEE',
  },
  openText: {
    fontSize: FontSize.xs,
    color: '#2E7D32',
    fontWeight: '600',
  },
  closedText: {
    color: '#C62828',
  },
  distance: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  actionText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
