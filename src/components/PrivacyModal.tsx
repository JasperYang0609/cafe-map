import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface PrivacyModalProps {
  visible: boolean;
  onAccept: () => void;
}

export default function PrivacyModal({ visible, onAccept }: PrivacyModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>隱私權政策</Text>

          <ScrollView style={styles.content}>
            <Text style={styles.text}>
              歡迎使用咖啡廳地圖 ☕{'\n\n'}
              我們重視您的隱私，在使用本服務前，請閱讀以下說明：{'\n\n'}
              <Text style={styles.bold}>1. 資料蒐集</Text>{'\n'}
              • 我們會蒐集您的位置資訊以顯示附近咖啡廳{'\n'}
              • 搜尋紀錄會儲存在您的帳號中{'\n'}
              • 收藏資料僅供您個人使用{'\n\n'}
              <Text style={styles.bold}>2. 資料使用</Text>{'\n'}
              • 位置資訊僅用於搜尋附近咖啡廳{'\n'}
              • 我們不會將您的個人資料出售給第三方{'\n'}
              • 匿名統計資料可能用於改善服務品質{'\n\n'}
              <Text style={styles.bold}>3. 資料保護</Text>{'\n'}
              • 您的資料透過加密傳輸和儲存{'\n'}
              • 您可以隨時刪除帳號和所有相關資料{'\n\n'}
              <Text style={styles.bold}>4. 第三方服務</Text>{'\n'}
              • 本 App 使用 Google Maps 服務{'\n'}
              • 訂閱付款透過 Apple/Google 處理{'\n'}
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setChecked(!checked)}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              我已閱讀並同意隱私權政策與服務條款
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, !checked && styles.acceptButtonDisabled]}
            onPress={onAccept}
            disabled={!checked}
          >
            <Text style={styles.acceptText}>同意並繼續</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  content: {
    maxHeight: 300,
    marginBottom: Spacing.md,
  },
  text: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.4,
  },
  acceptText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
