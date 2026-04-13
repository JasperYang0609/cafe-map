import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

function extractRecoverySession(url?: string | null) {
  if (!url) return null;

  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const hash = url.includes('#') ? url.split('#')[1] : '';
  const params = new URLSearchParams([query, hash].filter(Boolean).join('&'));

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');

  if (!accessToken || !refreshToken || type !== 'recovery') {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('正在驗證重設連結⋯');

  useEffect(() => {
    let mounted = true;

    const hydrateRecoverySession = async (url?: string | null) => {
      const recoverySession = extractRecoverySession(url);

      if (!recoverySession) {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setReady(!!data.session);
          setMessage(data.session ? '' : '請從重設密碼 Email 中開啟連結。');
          setLoading(false);
        }
        return;
      }

      const { error } = await supabase.auth.setSession(recoverySession);

      if (!mounted) return;

      if (error) {
        setReady(false);
        setMessage('這個重設連結可能已失效，請重新寄送忘記密碼 Email。');
      } else {
        setReady(true);
        setMessage('');
      }
      setLoading(false);
    };

    Linking.getInitialURL().then(hydrateRecoverySession);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      setLoading(true);
      hydrateRecoverySession(url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const handleSave = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('請填寫完整', '請輸入新密碼並再次確認。');
      return;
    }

    if (password.length < 6) {
      Alert.alert('密碼太短', '密碼至少需要 6 個字元。');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('密碼不一致', '兩次輸入的密碼不同，請重新確認。');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      Alert.alert('更新失敗', error.message);
      return;
    }

    Alert.alert('密碼已更新', '現在可以用新密碼登入 BeanGo。', [
      {
        text: 'OK',
        onPress: () => router.replace('/(tabs)/profile'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>重設密碼</Text>
          <Text style={styles.subtitle}>設定新的 BeanGo 密碼後，就可以重新登入。</Text>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.helperText}>{message}</Text>
            </View>
          ) : !ready ? (
            <View style={styles.centerBox}>
              <Ionicons name="mail-open-outline" size={36} color={Colors.primary} />
              <Text style={styles.helperText}>{message}</Text>
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="新密碼"
                    placeholderTextColor={Colors.textSecondary}
                    secureTextEntry
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="再次輸入新密碼"
                    placeholderTextColor={Colors.textSecondary}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>更新密碼</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.lg,
    zIndex: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  centerBox: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  helperText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputGroup: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
