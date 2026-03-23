import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

type AuthMode = 'login' | 'register';

export default function ProfileScreen() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('請填寫完整', '請輸入 Email 和密碼');
      return;
    }
    if (password.length < 6) {
      Alert.alert('密碼太短', '密碼至少 6 個字元');
      return;
    }

    setLoading(true);
    const result = authMode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);

    if (result.error) {
      Alert.alert('錯誤', result.error);
    } else {
      if (authMode === 'register') {
        Alert.alert('註冊成功 ☕', '請查看 Email 確認信件後登入');
      }
      setAuthMode(null);
      setEmail('');
      setPassword('');
    }
  };

  const handleSignOut = () => {
    Alert.alert('登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '登出', style: 'destructive', onPress: signOut },
    ]);
  };

  // Auth form
  if (authMode) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.authContainer}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setAuthMode(null)}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.authTitle}>
            {authMode === 'login' ? '歡迎回來 ☕' : '建立帳號 ☕'}
          </Text>
          <Text style={styles.authSubtitle}>
            {authMode === 'login'
              ? '登入後可以保存搜尋紀錄'
              : '註冊帳號，開始探索咖啡廳'}
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="密碼"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? '處理中...' : authMode === 'login' ? '登入' : '註冊'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          >
            <Text style={styles.switchText}>
              {authMode === 'login' ? '還沒有帳號？' : '已有帳號？'}
              <Text style={styles.switchLink}>
                {authMode === 'login' ? ' 立即註冊' : ' 立即登入'}
              </Text>
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Logged in profile
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.title}>我的</Text>
            <TouchableOpacity style={styles.langButton}>
              <Text style={styles.langFlag}>🇹🇼</Text>
              <Text style={styles.langText}>中文</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.guestCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.guestTitle}>{user.email}</Text>
            <Text style={styles.guestText}>歡迎回來 ☕</Text>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="star-outline" size={22} color={Colors.primary} />
              <Text style={styles.menuText}>訂閱方案</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text} />
              <Text style={styles.menuText}>隱私權政策</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
              <Text style={[styles.menuText, { color: Colors.error }]}>登出</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>v0.1.0</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Guest profile
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>我的</Text>
          <TouchableOpacity style={styles.langButton}>
            <Text style={styles.langFlag}>🇹🇼</Text>
            <Text style={styles.langText}>中文</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guestCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={Colors.textSecondary} />
          </View>
          <Text style={styles.guestTitle}>尚未登入</Text>
          <Text style={styles.guestText}>登入後可以跨裝置保存搜尋紀錄</Text>

          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => setAuthMode('login')}
            >
              <Text style={styles.loginBtnText}>登入</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => setAuthMode('register')}
            >
              <Text style={styles.registerBtnText}>註冊</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="star-outline" size={22} color={Colors.primary} />
            <Text style={styles.menuText}>訂閱方案</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text} />
            <Text style={styles.menuText}>隱私權政策</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 20,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  langButton: {
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
  langFlag: {
    fontSize: 16,
  },
  langText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    paddingVertical: Spacing.lg,
  },
  // Guest/User card
  guestCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  guestTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  guestText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  loginBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  loginBtnText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  registerBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  registerBtnText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  // Section
  section: {
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  menuValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  // Auth form
  authContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    zIndex: 1,
  },
  authTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  authSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  authButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  switchMode: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  switchLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
