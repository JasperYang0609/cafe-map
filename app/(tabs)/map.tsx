import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { DEFAULT_REGION } from '../../src/constants/config';
import { useLocation } from '../../src/hooks/useLocation';
import { useCafes } from '../../src/hooks/useCafes';

export default function MapScreen() {
  const location = useLocation();
  const { cafes, loading, fetchCafes } = useCafes();
  const mapRef = useRef<MapView>(null);
  const router = useRouter();

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
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {cafes.map((cafe) => (
          <Marker
            key={cafe.place_id}
            coordinate={{
              latitude: cafe.latitude,
              longitude: cafe.longitude,
            }}
            title={cafe.name}
            description={`⭐ ${cafe.rating > 0 ? cafe.rating.toFixed(1) : '-'} · ${
              cafe.distance
                ? cafe.distance < 1000
                  ? `${Math.round(cafe.distance)}m`
                  : `${(cafe.distance / 1000).toFixed(1)}km`
                : ''
            }`}
          >
            {/* Custom marker - coffee cup */}
            <View style={styles.markerContainer}>
              <Text style={styles.markerEmoji}>☕</Text>
            </View>
          </Marker>
        ))}

        {/* TODO: Add tree markers for favorites (subscription) */}
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
    bottom: 30,
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
