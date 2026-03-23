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

type AuthMode = 'login' | 'register';

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
    // TODO: Connect to Supabase Auth
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        authMode === 'login' ? '登入功能開發中' : '註冊功能開發中',
        '帳號系統即將上線！'
      );
    }, 1000);
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
              ? '登入後可以保存搜尋紀錄和收藏'
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

  // Guest profile
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>我的</Text>
        </View>

        {/* Guest card */}
        <View style={styles.guestCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={Colors.textSecondary} />
          </View>
          <Text style={styles.guestTitle}>尚未登入</Text>
          <Text style={styles.guestText}>登入後可以保存紀錄和收藏咖啡廳</Text>

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

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="language-outline" size={22} color={Colors.text} />
            <Text style={styles.menuText}>語言</Text>
            <Text style={styles.menuValue}>繁體中文</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="star-outline" size={22} color={Colors.text} />
            <Text style={styles.menuText}>訂閱方案</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.text} />
            <Text style={styles.menuText}>隱私權政策</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.text} />
            <Text style={styles.menuText}>關於</Text>
            <Text style={styles.menuValue}>v0.1.0</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  // Guest card
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
  },
  authButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  // Settings section
  section: {
    margin: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
