import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Cafe } from '../types/cafe';

interface MapCalloutProps {
  cafe: Cafe;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

export default function MapCallout({ cafe, onFavorite, isFavorited = false }: MapCalloutProps) {
  const handleNavigate = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(cafe.name)}@${cafe.latitude},${cafe.longitude}`,
      android: `geo:0,0?q=${cafe.latitude},${cafe.longitude}(${encodeURIComponent(cafe.name)})`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <Callout tooltip onPress={() => {}}>
      <View style={styles.callout}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>{cafe.name}</Text>

        {/* Address */}
        {cafe.address ? (
          <Text style={styles.address} numberOfLines={1}>{cafe.address}</Text>
        ) : null}

        {/* Rating + Status */}
        <View style={styles.infoRow}>
          <Ionicons name="star" size={14} color={Colors.star} />
          <Text style={styles.rating}>
            {cafe.rating > 0 ? cafe.rating.toFixed(1) : '-'}
          </Text>
          <Text style={styles.reviews}>({cafe.total_ratings})</Text>

          {cafe.distance !== undefined && (
            <Text style={styles.distance}>
              · {cafe.distance < 1000
                ? `${Math.round(cafe.distance)}m`
                : `${(cafe.distance / 1000).toFixed(1)}km`}
            </Text>
          )}

          {cafe.is_open !== null && cafe.is_open !== undefined && (
            <View style={[styles.statusBadge, !cafe.is_open && styles.closedBadge]}>
              <Text style={[styles.statusText, !cafe.is_open && styles.closedText]}>
                {cafe.is_open ? '營業中' : '休息中'}
              </Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.navButton} onPress={handleNavigate}>
            <Ionicons name="navigate" size={16} color={Colors.surface} />
            <Text style={styles.navText}>導航</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.favButton, isFavorited && styles.favButtonActive]}
            onPress={onFavorite}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={16}
              color={isFavorited ? Colors.error : Colors.primary}
            />
            <Text style={[styles.favText, isFavorited && styles.favTextActive]}>
              {isFavorited ? '已收藏' : '收藏'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Callout>
  );
}

const styles = StyleSheet.create({
  callout: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  address: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  rating: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  reviews: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  distance: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  closedBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  closedText: {
    color: '#C62828',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  navText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  favButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  favButtonActive: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  favText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  favTextActive: {
    color: Colors.error,
  },
});
