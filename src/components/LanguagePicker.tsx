import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { useI18n, SUPPORTED_LANGUAGES } from '../context/I18nContext';

export default function LanguagePicker() {
  const { currentLang, setLocale } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)}>
        <Text style={styles.flag}>{currentLang.flag}</Text>
        <Text style={styles.label}>{currentLang.label}</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.picker}>
            <Text style={styles.title}>🌐 Language</Text>
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langRow,
                    currentLang.code === item.code && styles.langRowActive,
                  ]}
                  onPress={() => {
                    setLocale(item.code);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text style={styles.langLabel}>{item.label}</Text>
                  {currentLang.code === item.code && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flag: {
    fontSize: 16,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  picker: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  langRowActive: {
    backgroundColor: Colors.background,
  },
  langFlag: {
    fontSize: 24,
  },
  langLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
});
