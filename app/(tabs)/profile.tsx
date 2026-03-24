import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/context/I18nContext';
import LanguagePicker from '../../src/components/LanguagePicker';

type AuthMode = 'login' | 'register';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signIn, signUp, signOut } = useAuth();
  const { t } = useI18n();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert(t('profile.fill_all'), t('profile.fill_all_msg'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('profile.password_short'), t('profile.password_short_msg'));
      return;
    }
    setLoading(true);
    const result = authMode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);
    if (result.error) {
      Alert.alert(t('profile.error'), result.error);
    } else {
      if (authMode === 'register') {
        Alert.alert(t('profile.register_success'), t('profile.register_success_msg'));
      }
      setAuthMode(null);
      setEmail('');
      setPassword('');
    }
  };

  const handleSignOut = () => {
    Alert.alert(t('profile.logout'), t('profile.logout_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: signOut },
    ]);
  };

  if (authMode) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => setAuthMode(null)}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.authTitle}>
            {authMode === 'login' ? t('profile.login_title') : t('profile.register_title')}
          </Text>
          <Text style={styles.authSubtitle}>
            {authMode === 'login' ? t('profile.login_subtitle') : t('profile.register_subtitle')}
          </Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
              <TextInput style={styles.input} placeholder={t('profile.email')} placeholderTextColor={Colors.textSecondary}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
              <TextInput style={styles.input} placeholder={t('profile.password')} placeholderTextColor={Colors.textSecondary}
                value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </View>
          <TouchableOpacity style={[styles.authButton, loading && styles.authButtonDisabled]} onPress={handleAuth} disabled={loading}>
            <Text style={styles.authButtonText}>
              {loading ? t('profile.processing') : authMode === 'login' ? t('profile.login') : t('profile.register')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchMode} onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchText}>
              {authMode === 'login' ? t('profile.no_account') : t('profile.has_account')}
              <Text style={styles.switchLink}>
                {authMode === 'login' ? t('profile.register_now') : t('profile.login_now')}
              </Text>
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.title')}</Text>
            <LanguagePicker />
          </View>
          <View style={styles.guestCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.guestTitle}>{user.email}</Text>
            <Text style={styles.guestText}>{t('profile.welcome')}</Text>
          </View>
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="star-outline" size={22} color={Colors.primary} />
              <Text style={styles.menuText}>{t('profile.subscription')}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/pages/privacy')}>
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text} />
              <Text style={styles.menuText}>{t('profile.privacy')}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
              <Text style={[styles.menuText, { color: Colors.error }]}>{t('profile.logout')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.versionText}>v0.1.0</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <LanguagePicker />
        </View>
        <View style={styles.guestCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={Colors.textSecondary} />
          </View>
          <Text style={styles.guestTitle}>{t('profile.not_logged_in')}</Text>
          <Text style={styles.guestText}>{t('profile.guest_text')}</Text>
          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.loginBtn} onPress={() => setAuthMode('login')}>
              <Text style={styles.loginBtnText}>{t('profile.login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerBtn} onPress={() => setAuthMode('register')}>
              <Text style={styles.registerBtnText}>{t('profile.register')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="star-outline" size={22} color={Colors.primary} />
            <Text style={styles.menuText}>{t('profile.subscription')}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/pages/privacy')}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text} />
            <Text style={styles.menuText}>{t('profile.privacy')}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl + 20, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  versionText: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textSecondary, paddingVertical: Spacing.lg },
  guestCard: {
    alignItems: 'center', padding: Spacing.xl, margin: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  guestTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  guestText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.lg, textAlign: 'center' },
  authButtons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  loginBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full, alignItems: 'center' },
  loginBtnText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '600' },
  registerBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full, alignItems: 'center' },
  registerBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  section: { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logoutItem: { borderBottomWidth: 0 },
  menuText: { flex: 1, fontSize: FontSize.md, color: Colors.text, marginLeft: Spacing.md },
  authContainer: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  backButton: { position: 'absolute', top: Spacing.lg, left: Spacing.lg, zIndex: 1 },
  authTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  authSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  inputGroup: { gap: Spacing.md, marginBottom: Spacing.xl },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.text, paddingVertical: Spacing.sm },
  authButton: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, alignItems: 'center', marginBottom: Spacing.lg },
  authButtonDisabled: { opacity: 0.6 },
  authButtonText: { color: Colors.surface, fontSize: FontSize.md, fontWeight: '700' },
  switchMode: { alignItems: 'center' },
  switchText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  switchLink: { color: Colors.primary, fontWeight: '600' },
});
