import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { getPhotoUrl } from '../../src/lib/places';

const { width } = Dimensions.get('window');

export default function CafeDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Parse cafe data from params
  const cafe = {
    place_id: params.place_id as string,
    name: params.name as string,
    address: params.address as string,
    latitude: parseFloat(params.latitude as string),
    longitude: parseFloat(params.longitude as string),
    rating: parseFloat(params.rating as string) || 0,
    total_ratings: parseInt(params.total_ratings as string) || 0,
    photo_references: params.photo_references
      ? JSON.parse(params.photo_references as string)
      : [],
    is_open: params.is_open === 'true' ? true : params.is_open === 'false' ? false : null,
    distance: params.distance ? parseFloat(params.distance as string) : undefined,
  };

  // Try multiple photos first, fallback to single photo_reference
  const photoRefs = cafe.photo_references.length > 0
    ? cafe.photo_references
    : params.photo_reference
    ? [params.photo_reference as string]
    : [];
  const photos = photoRefs.map((ref: string) => getPhotoUrl(ref, 600));

  const handleNavigate = async () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}&destination_place_id=${cafe.place_id}`;
    const canOpenGoogle = await Linking.canOpenURL('comgooglemaps://');
    if (canOpenGoogle) {
      Linking.openURL(`comgooglemaps://?daddr=${cafe.latitude},${cafe.longitude}&directionsmode=driving`);
    } else {
      Linking.openURL(googleMapsUrl);
    }
  };

  const handleFavorite = () => {
    Alert.alert(
      '訂閱後可收藏 ☕',
      '訂閱後即可收藏咖啡廳，收藏的店會在地圖上長成一棵樹 🌳',
      [
        { text: '之後再說', style: 'cancel' },
        { text: '了解訂閱方案', onPress: () => {} },
      ]
    );
  };

  const handleShare = async () => {
    // TODO: Share functionality
    Alert.alert('分享', '分享功能即將推出！');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`f${i}`} name="star" size={18} color={Colors.star} />);
    }
    if (hasHalf) {
      stars.push(<Ionicons key="h" name="star-half" size={18} color={Colors.star} />);
    }
    const remaining = 5 - fullStars - (hasHalf ? 1 : 0);
    for (let i = 0; i < remaining; i++) {
      stars.push(<Ionicons key={`e${i}`} name="star-outline" size={18} color={Colors.star} />);
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        {photos.length > 0 ? (
          <View>
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActivePhotoIndex(index);
              }}
              keyExtractor={(_, i) => `photo-${i}`}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.photo} />
              )}
            />
            {photos.length > 1 && (
              <View style={styles.photoIndicator}>
                {photos.map((_: string, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === activePhotoIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
            <Text style={styles.photoCount}>{activePhotoIndex + 1}/{photos.length}</Text>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="cafe-outline" size={60} color={Colors.textSecondary} />
            <Text style={styles.noPhotoText}>暫無照片</Text>
          </View>
        )}

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{cafe.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.stars}>{renderStars(cafe.rating)}</View>
            <Text style={styles.ratingText}>
              {cafe.rating > 0 ? cafe.rating.toFixed(1) : '-'}
            </Text>
            <Text style={styles.reviewCount}>({cafe.total_ratings} 則評論)</Text>
          </View>

          {/* Status + Distance */}
          <View style={styles.statusRow}>
            {cafe.is_open !== null && (
              <View style={[styles.statusBadge, !cafe.is_open && styles.closedBadge]}>
                <Text style={[styles.statusText, !cafe.is_open && styles.closedText]}>
                  {cafe.is_open ? '營業中' : '休息中'}
                </Text>
              </View>
            )}
            {cafe.distance !== undefined && (
              <Text style={styles.distance}>
                📍 {cafe.distance < 1000
                  ? `${Math.round(cafe.distance)}m`
                  : `${(cafe.distance / 1000).toFixed(1)}km`}
              </Text>
            )}
          </View>

          {/* Address */}
          {cafe.address ? (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{cafe.address}</Text>
            </View>
          ) : null}

          {/* Google Maps link */}
          <TouchableOpacity style={styles.detailRow} onPress={() => {
            Linking.openURL(`https://www.google.com/maps/place/?q=place_id:${cafe.place_id}`);
          }}>
            <Ionicons name="open-outline" size={20} color={Colors.primary} />
            <Text style={[styles.detailText, { color: Colors.primary }]}>在 Google Maps 查看更多</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navButton} onPress={handleNavigate}>
          <Ionicons name="navigate" size={20} color={Colors.surface} />
          <Text style={styles.navText}>導航</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.favButton} onPress={handleFavorite}>
          <Ionicons name="heart-outline" size={20} color={Colors.primary} />
          <Text style={styles.favText}>訂閱後可收藏</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  photo: {
    width: width,
    height: 260,
  },
  photoPlaceholder: {
    width: width,
    height: 200,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  photoIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
  photoCount: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: FontSize.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  infoSection: {
    padding: Spacing.lg,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  closedBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: FontSize.sm,
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
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  navText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  favButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  favText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  shareButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
  },
});
