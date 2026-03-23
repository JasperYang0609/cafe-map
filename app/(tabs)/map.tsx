import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useLocation } from '../../src/hooks/useLocation';
import { useCafes } from '../../src/hooks/useCafes';
import { getPhotoUrl } from '../../src/lib/places';
import { Cafe } from '../../src/types/cafe';

export default function MapScreen() {
  const location = useLocation();
  const { cafes, loading, fetchCafes } = useCafes();
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);

  const handleOpenDetail = (cafe: Cafe) => {
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
        photo_reference: cafe.photo_reference || '',
        photo_references: JSON.stringify(cafe.photo_references || []),
        is_open: cafe.is_open === null || cafe.is_open === undefined ? '' : String(cafe.is_open),
        distance: cafe.distance !== undefined ? String(cafe.distance) : '',
      },
    });
  };

  useEffect(() => {
    if (!location.loading && !location.error) {
      fetchCafes(location.latitude, location.longitude);
    }
  }, [location.loading, location.error, location.latitude, location.longitude]);

  const handleRecenter = () => {
    if (mapRef.current && !location.loading) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleNavigate = async (cafe: Cafe) => {
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
        { text: '了解訂閱方案', onPress: () => { /* TODO: navigate to subscription */ } },
      ]
    );
  };

  if (location.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>定位中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedCafe(null)}
      >
        {cafes.map((cafe) => (
          <Marker
            key={cafe.place_id}
            coordinate={{
              latitude: cafe.latitude,
              longitude: cafe.longitude,
            }}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedCafe(cafe);
            }}
            tracksViewChanges={false}
            pinColor={selectedCafe?.place_id === cafe.place_id ? '#E53935' : '#6F4E37'}
          />
        ))}
      </MapView>

      {/* Recenter button */}
      <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
        <Ionicons name="locate-outline" size={22} color={Colors.primary} />
      </TouchableOpacity>

      {/* Cafe count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          {loading ? '搜尋中...' : `☕ ${cafes.length} 家`}
        </Text>
      </View>

      {/* Bottom card when marker selected */}
      {selectedCafe && (
        <View style={styles.bottomCard}>
          <TouchableOpacity style={styles.cardRow} onPress={() => handleOpenDetail(selectedCafe)} activeOpacity={0.8}>
          {/* Photo */}
          {selectedCafe.photo_reference ? (
            <Image
              source={{ uri: getPhotoUrl(selectedCafe.photo_reference, 200) }}
              style={styles.cardPhoto}
            />
          ) : (
            <View style={[styles.cardPhoto, styles.cardPhotoPlaceholder]}>
              <Ionicons name="cafe-outline" size={28} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardName} numberOfLines={1}>{selectedCafe.name}</Text>
              {selectedCafe.is_open !== null && selectedCafe.is_open !== undefined && (
                <View style={[styles.statusBadge, !selectedCafe.is_open && styles.closedBadge]}>
                  <Text style={[styles.statusText, !selectedCafe.is_open && styles.closedText]}>
                    {selectedCafe.is_open ? '營業中' : '休息中'}
                  </Text>
                </View>
              )}
            </View>
            {selectedCafe.address ? (
              <Text style={styles.cardAddress} numberOfLines={1}>{selectedCafe.address}</Text>
            ) : null}
            <View style={styles.cardInfoRow}>
              <Ionicons name="star" size={14} color={Colors.star} />
              <Text style={styles.cardRating}>
                {selectedCafe.rating > 0 ? selectedCafe.rating.toFixed(1) : '-'}
              </Text>
              <Text style={styles.cardReviews}>({selectedCafe.total_ratings})</Text>
              {selectedCafe.distance !== undefined && (
                <Text style={styles.cardDistance}>
                  · {selectedCafe.distance < 1000
                    ? `${Math.round(selectedCafe.distance)}m`
                    : `${(selectedCafe.distance / 1000).toFixed(1)}km`}
                </Text>
              )}
            </View>
          </View>
          </TouchableOpacity>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => handleNavigate(selectedCafe)}
            >
              <Ionicons name="navigate" size={18} color={Colors.surface} />
              <Text style={styles.navText}>導航</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.favButton}
              onPress={handleFavorite}
            >
              <Ionicons name="heart-outline" size={18} color={Colors.primary} />
              <Text style={styles.favText}>訂閱後可收藏</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {location.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{location.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  markerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  markerEmoji: {
    fontSize: 18,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 200,
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  countBadge: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  countText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  // Bottom card
  bottomCard: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  cardPhoto: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  cardPhotoPlaceholder: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardName: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  cardAddress: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  cardRating: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  cardReviews: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  cardDistance: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closedBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  closedText: {
    color: '#C62828',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
  },
  navText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  favButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
  },
  favText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  errorBanner: {
    position: 'absolute',
    top: 100,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.error,
    padding: Spacing.md,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
