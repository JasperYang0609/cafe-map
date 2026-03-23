import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { useI18n } from '../context/I18nContext';

export interface FilterOptions {
  maxDistance: number; // km
  minRating: number;
  openNow: boolean;
}

const DEFAULT_FILTERS: FilterOptions = {
  maxDistance: 5,
  minRating: 0,
  openNow: false,
};

const DISTANCE_OPTIONS = [1, 2, 3, 5, 10];
const RATING_OPTIONS = [0, 3.5, 4.0, 4.5];

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export default function FilterSheet({
  visible,
  onClose,
  onApply,
  currentFilters,
}: FilterSheetProps) {
  const { t } = useI18n();
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>{t("filter.reset")}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t("filter.title")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Distance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("filter.distance")}</Text>
              <View style={styles.optionRow}>
                {DISTANCE_OPTIONS.map((km) => (
                  <TouchableOpacity
                    key={km}
                    style={[
                      styles.chip,
                      filters.maxDistance === km && styles.chipActive,
                    ]}
                    onPress={() => setFilters({ ...filters, maxDistance: km })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.maxDistance === km && styles.chipTextActive,
                      ]}
                    >
                      {km}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("filter.min_rating")}</Text>
              <View style={styles.optionRow}>
                {RATING_OPTIONS.map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.chip,
                      filters.minRating === rating && styles.chipActive,
                    ]}
                    onPress={() => setFilters({ ...filters, minRating: rating })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.minRating === rating && styles.chipTextActive,
                      ]}
                    >
                      {rating === 0 ? t('filter.no_limit') : `${rating}⭐ ${t('filter.above')}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Open Now */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setFilters({ ...filters, openNow: !filters.openNow })}
              >
                <Text style={styles.sectionTitle}>{t("filter.open_now")}</Text>
                <View style={[styles.toggle, filters.openNow && styles.toggleActive]}>
                  <View style={[styles.toggleDot, filters.openNow && styles.toggleDotActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Apply button */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyText}>{t("filter.apply")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export { DEFAULT_FILTERS };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  resetText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  applyText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
