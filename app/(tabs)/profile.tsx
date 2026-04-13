import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/context/I18nContext';
import LanguagePicker from '../../src/components/LanguagePicker';
import { signInWithApple, isAppleAuthAvailable } from '../../src/lib/appleAuth';
import { signInWithGoogle, isGoogleAuthAvailable } from '../../src/lib/googleAuth';

type AuthMode = 'login' | 'register';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signIn, signUp, resetPassword, signOut, deleteAccount, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (result.error && result.error !== 'CANCELLED') {
      Alert.alert(t('profile.error'), result.error);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const result = await signInWithApple();
    setAppleLoading(false);
    if (result.error && result.error !== 'CANCELLED') {
      Alert.alert(t('profile.error'), result.error);
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState<number>(0);
  const showAuthOverlay = appleLoading || googleLoading || (authLoading && !user);
  const beanGoAvatar = require('../../assets/beango-character.png');

  useEffect(() => {
    if (user && authMode) {
      setAuthMode(null);
      setEmail('');
      setPassword('');
    }
  }, [user, authMode]);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setTimeout(() => setResetCooldown((prev: number) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetCooldown]);

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
        setAuthMode(null);
      }
      setEmail('');
      setPassword('');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(t('profile.error'), t('profile.enter_email_for_reset') || '請先輸入 Email');
      return;
    }

    const result = await resetPassword(email);
    if (result.error) {
      Alert.alert(t('profile.error'), result.error);
      return;
    }

    setResetCooldown(60);
    Alert.alert(
      t('profile.reset_sent') || '重設信已寄出',
      t('profile.reset_sent_msg') || '請到你的 Email 收信，依指示重設密碼。'
    );
  };

  const handleSignOut = () => {
    Alert.alert(t('profile.logout'), t('profile.logout_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.delete_account') || '刪除帳號',
      t('profile.delete_confirm') || '確定要刪除帳號嗎？此操作無法復原，所有資料（收藏、搜尋紀錄、訂閱）將永久刪除。',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.delete_account') || '刪除帳號',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (result.error) {
              Alert.alert(t('profile.error'), result.error);
            } else {
              Alert.alert(
                t('profile.delete_success') || '帳號已刪除',
                t('profile.delete_success_msg') || '您的帳號和所有相關資料已永久刪除。'
              );
            }
          },
        },
      ]
    );
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
          {authMode === 'login' && (
            <TouchableOpacity style={styles.forgotPasswordBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('profile.forgot_password') || '忘記密碼？'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.switchMode} onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchText}>
              {authMode === 'login' ? t('profile.no_account') : t('profile.has_account')}
              <Text style={styles.switchLink}>
                {authMode === 'login' ? t('profile.register_now') : t('profile.login_now')}
              </Text>
            </Text>
          </TouchableOpacity>

          {showAuthOverlay && (
            <View style={styles.authOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.authOverlayText}>{t('profile.processing')}</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.title')}</Text>
            <LanguagePicker />
          </View>
          <View style={styles.guestCard}>
            <View style={styles.avatarCircle}>
              <Image source={beanGoAvatar} style={styles.avatarImage} />
            </View>
            <Text style={styles.guestTitle}>{user.email}</Text>
            <Text style={styles.guestText}>{t('profile.welcome')}</Text>
          </View>
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/pages/subscribe')}>
              <Ionicons name="star-outline" size={22} color={Colors.primary} />
              <Text style={styles.menuText}>{t('profile.subscription')}</Text>
              {user.isSubscribed && <Text style={styles.proBadge}>Pro</Text>}
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/pages/privacy')}>
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text} />
              <Text style={styles.menuText}>{t('profile.privacy')}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/pages/terms')}>
              <Ionicons name="document-text-outline" size={22} color={Colors.text} />
              <Text style={styles.menuText}>{t('profile.terms')}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
              <Text style={[styles.menuText, { color: Colors.error }]}>{t('profile.logout')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={22} color={Colors.error} />
              <Text style={[styles.menuText, { color: Colors.error }]}>{t('profile.delete_account')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.versionText}>v0.1.0</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <LanguagePicker />
        </View>
        <View style={styles.guestCard}>
          <View style={styles.avatarCircle}>
            <Image source={beanGoAvatar} style={styles.avatarImage} />
          </View>
          <Text style={styles.guestTitle}>{t('profile.not_logged_in')}</Text>
          <Text style={styles.guestText}>{t('profile.guest_text')}</Text>
          {isAppleAuthAvailable() && (
            <TouchableOpacity
              style={styles.appleButton}
              onPress={handleAppleSignIn}
              disabled={appleLoading}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={styles.appleButtonText}>
                {appleLoading ? t('profile.processing') : 'Sign in with Apple'}
              </Text>
            </TouchableOpacity>
          )}

          {isGoogleAuthAvailable() && (
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>
                {googleLoading ? t('profile.processing') : 'Sign in with Google'}
              </Text>
            </TouchableOpacity>
          )}

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
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/pages/subscribe')}>
            <Ionicons name="star-outline" size={22} color={Colors.primary} />
            <Text style={styles.menuText}>{t('profile.subscription')}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/pages/privacy')}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text} />
            <Text style={styles.menuText}>{t('profile.privacy')}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => router.push('/pages/terms')}>
            <Ionicons name="document-text-outline" size={22} color={Colors.text} />
            <Text style={styles.menuText}>{t('profile.terms')}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>v0.1.0</Text>

        {showAuthOverlay && (
          <View style={styles.authOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.authOverlayText}>{t('profile.processing')}</Text>
          </View>
        )}
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
  versionText: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textSecondary, paddingVertical: Spacing.sm },
  guestCard: {
    alignItems: 'center', padding: Spacing.xl, margin: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
  },
  avatarCircle: {
    width: 116, height: 116, borderRadius: 58, backgroundColor: '#F6F0E8',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 94,
    height: 94,
    resizeMode: 'contain',
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
  proBadge: {
    fontSize: FontSize.xs, fontWeight: '700', color: '#fff',
    backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, marginRight: Spacing.sm, overflow: 'hidden',
  },
  appleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#000', paddingVertical: Spacing.md, borderRadius: BorderRadius.full,
    width: '100%', marginBottom: Spacing.md,
  },
  appleButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.full,
    width: '100%', marginBottom: Spacing.md,
  },
  googleButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
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
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  switchMode: { alignItems: 'center' },
  switchText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  switchLink: { color: Colors.primary, fontWeight: '600' },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.md,
  },
  authOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 248, 240, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  authOverlayText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
});
