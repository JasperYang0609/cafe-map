import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useI18n } from '../../src/context/I18nContext';

export default function PrivacyScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEn = locale.startsWith('en');
  const isJa = locale.startsWith('ja');
  const isKo = locale.startsWith('ko');
  const isTh = locale.startsWith('th');

  const content = isEn ? CONTENT_EN
    : isJa ? CONTENT_JA
    : isKo ? CONTENT_KO
    : isTh ? CONTENT_TH
    : CONTENT_ZH;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>{content.updated}</Text>

        {content.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <Text style={styles.contact}>{content.contact}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const CONTENT_ZH = {
  title: '隱私權政策',
  updated: '最後更新：2026 年 3 月',
  contact: 'ansai（安賽）開發並營運BeanGo 跑咖 App。使用本服務即表示您同意本政策。\n\n如有任何問題，請聯繫：support@ansai.tw',
  sections: [
    {
      title: '1. 資料蒐集',
      body: '我們蒐集以下資料以提供服務：\n\n• 位置資訊：用於顯示附近咖啡廳，僅在使用 App 時存取\n• 帳號資訊：Email 和密碼（加密儲存）\n• 使用紀錄：搜尋紀錄和收藏清單\n• 裝置資訊：作業系統版本和裝置類型（用於改善體驗）',
    },
    {
      title: '2. 資料使用',
      body: '• 位置資訊僅用於搜尋附近咖啡廳，不會用於追蹤\n• 搜尋紀錄和收藏儲存在您的帳號中，方便跨裝置使用\n• 我們不會將個人資料出售給第三方\n• 匿名統計資料可能用於改善服務品質',
    },
    {
      title: '3. 第三方服務',
      body: '本 App 使用以下第三方服務：\n\n• Google Maps Platform：地圖顯示和咖啡廳資訊\n• Supabase：帳號驗證和資料儲存\n• Google AdMob：免費版廣告（訂閱用戶無廣告）\n• Apple/Google：訂閱付款處理\n\n這些服務各有其隱私權政策，建議您參閱。',
    },
    {
      title: '4. 資料保護',
      body: '• 所有資料透過 HTTPS 加密傳輸\n• 密碼使用業界標準加密儲存\n• 我們定期審查安全措施',
    },
    {
      title: '5. 您的權利',
      body: '您可以隨時：\n\n• 刪除搜尋紀錄\n• 取消收藏\n• 刪除帳號和所有相關資料\n• 撤銷位置權限（在裝置設定中）',
    },
    {
      title: '6. 兒童隱私',
      body: '本服務不針對 13 歲以下兒童。我們不會故意蒐集兒童的個人資訊。如果您是家長或監護人，發現您的孩子提供了個人資訊，請聯繫我們以便刪除。',
    },
    {
      title: '7. 資料保留',
      body: '我們僅在提供服務所需期間保留您的資料。如果您刪除帳號，所有相關資料將被永久刪除。匿名使用統計資料可能以彙總形式保留，用於分析目的。',
    },
    {
      title: '8. 政策變更',
      body: '我們可能不時更新本隱私權政策。重大變更將透過更新頁面頂部的「最後更新」日期通知您。建議您定期檢閱本政策。',
    },
  ],
};

const CONTENT_EN = {
  title: 'Privacy Policy',
  updated: 'Last updated: March 2026',
  contact: 'ansai built and operates the BeanGo app. By using our service, you agree to this policy.\n\nQuestions? Contact: support@ansai.tw',
  sections: [
    {
      title: '1. Data Collection',
      body: 'We collect the following data to provide our service:\n\n• Location: To show nearby cafes, accessed only while using the app\n• Account info: Email and password (encrypted)\n• Usage data: Search history and favorites\n• Device info: OS version and device type (to improve experience)',
    },
    {
      title: '2. Data Usage',
      body: '• Location is only used to search nearby cafes, not for tracking\n• History and favorites are stored in your account for cross-device access\n• We do not sell personal data to third parties\n• Anonymous statistics may be used to improve service quality',
    },
    {
      title: '3. Third-Party Services',
      body: 'This app uses:\n\n• Google Maps Platform: Map display and cafe information\n• Supabase: Authentication and data storage\n• Google AdMob: Ads for free users (subscribers are ad-free)\n• Apple/Google: Subscription payment processing\n\nEach service has its own privacy policy.',
    },
    {
      title: '4. Data Protection',
      body: '• All data transmitted via HTTPS encryption\n• Passwords stored with industry-standard encryption\n• We regularly review security measures',
    },
    {
      title: '5. Your Rights',
      body: 'You can at any time:\n\n• Delete search history\n• Remove favorites\n• Delete your account and all associated data\n• Revoke location permissions (in device settings)',
    },
    {
      title: '6. Children\'s Privacy',
      body: 'This service is not directed at children under 13. We do not knowingly collect personal information from children. If you are a parent and believe your child has provided personal information, please contact us.',
    },
    {
      title: '7. Data Retention',
      body: 'We retain your data only as long as necessary to provide our services. If you delete your account, all associated data will be permanently removed. Anonymized usage data may be retained in aggregate form for analytical purposes.',
    },
    {
      title: '8. Changes to This Policy',
      body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date. We encourage you to review this policy periodically.',
    },
  ],
};

const CONTENT_JA = {
  title: 'プライバシーポリシー',
  updated: '最終更新：2026年3月',
  contact: 'ansai（安賽）がBeanGo アプリを開発・運営しています。本サービスの利用により、このポリシーに同意したものとみなされます。\n\nご質問は：support@ansai.tw',
  sections: [
    {
      title: '1. データ収集',
      body: 'サービス提供のために以下のデータを収集します：\n\n• 位置情報：近くのカフェを表示するため（アプリ使用中のみ）\n• アカウント情報：メールアドレスとパスワード（暗号化保存）\n• 利用データ：検索履歴とお気に入り\n• デバイス情報：OS版とデバイスの種類',
    },
    {
      title: '2. データの使用',
      body: '• 位置情報はカフェ検索のみに使用し、追跡には使用しません\n• 履歴とお気に入りはアカウントに保存されます\n• 個人データを第三者に販売することはありません\n• 匿名統計はサービス改善に使用される場合があります',
    },
    {
      title: '3. サードパーティサービス',
      body: '本アプリは以下を使用しています：\n\n• Google Maps Platform\n• Supabase\n• Google AdMob\n• Apple/Google（定期購読の決済）',
    },
    {
      title: '4. データ保護',
      body: '• すべてのデータはHTTPS暗号化で転送\n• パスワードは業界標準の暗号化で保存\n• セキュリティ対策を定期的に見直しています',
    },
    {
      title: '5. お客様の権利',
      body: 'いつでも以下が可能です：\n\n• 検索履歴の削除\n• お気に入りの解除\n• アカウントと関連データの削除\n• 位置情報の権限取消（デバイス設定から）',
    },
    {
      title: '6. 子供のプライバシー',
      body: '本サービスは13歳未満のお子様を対象としていません。お子様が個人情報を提供したことに気づかれた場合は、ご連絡ください。',
    },
    {
      title: '7. データ保持',
      body: 'サービスの提供に必要な期間のみデータを保持します。アカウントを削除すると、関連するすべてのデータが完全に削除されます。匿名の利用統計は分析目的で集計形式で保持される場合があります。',
    },
    {
      title: '8. ポリシーの変更',
      body: '本プライバシーポリシーは随時更新される場合があります。重要な変更がある場合は、ページ上部の「最終更新」日を更新してお知らせします。',
    },
  ],
};

const CONTENT_KO = {
  title: '개인정보 처리방침',
  updated: '최종 업데이트: 2026년 3월',
  contact: 'ansai（안사이）가 BeanGo 앱을 개발 및 운영합니다. 서비스를 이용함으로써 본 정책에 동의하는 것으로 간주됩니다.\n\n문의: support@ansai.tw',
  sections: [
    {
      title: '1. 수집 정보',
      body: '서비스 제공을 위해 다음 정보를 수집합니다:\n\n• 위치 정보: 근처 카페 표시용 (앱 사용 중에만)\n• 계정 정보: 이메일과 비밀번호 (암호화 저장)\n• 이용 데이터: 검색 기록과 즐겨찾기\n• 기기 정보: OS 버전과 기기 유형',
    },
    {
      title: '2. 정보 사용',
      body: '• 위치 정보는 카페 검색에만 사용되며 추적에 사용되지 않습니다\n• 기록과 즐겨찾기는 계정에 저장됩니다\n• 개인 정보를 제3자에게 판매하지 않습니다\n• 익명 통계는 서비스 개선에 사용될 수 있습니다',
    },
    {
      title: '3. 제3자 서비스',
      body: '본 앱은 다음을 사용합니다:\n\n• Google Maps Platform\n• Supabase\n• Google AdMob\n• Apple/Google (구독 결제)',
    },
    {
      title: '4. 데이터 보호',
      body: '• 모든 데이터는 HTTPS 암호화로 전송\n• 비밀번호는 업계 표준 암호화로 저장\n• 정기적으로 보안 조치를 검토합니다',
    },
    {
      title: '5. 귀하의 권리',
      body: '언제든지 다음이 가능합니다:\n\n• 검색 기록 삭제\n• 즐겨찾기 해제\n• 계정 및 관련 데이터 삭제\n• 위치 권한 취소 (기기 설정에서)',
    },
    {
      title: '6. 아동 개인정보',
      body: '본 서비스는 만 13세 미만 아동을 대상으로 하지 않습니다. 자녀가 개인 정보를 제공한 것을 알게 된 경우 연락해 주세요.',
    },
    {
      title: '7. 데이터 보관',
      body: '서비스 제공에 필요한 기간 동안만 데이터를 보관합니다. 계정을 삭제하면 관련 모든 데이터가 영구 삭제됩니다. 익명 사용 통계는 분석 목적으로 집계 형태로 보관될 수 있습니다.',
    },
    {
      title: '8. 정책 변경',
      body: '본 개인정보 처리방침은 수시로 업데이트될 수 있습니다. 중요한 변경 사항이 있을 경우 페이지 상단의 「최종 업데이트」 날짜를 업데이트하여 알려드립니다.',
    },
  ],
};

const CONTENT_TH = {
  title: 'นโยบายความเป็นส่วนตัว',
  updated: 'อัปเดตล่าสุด: มีนาคม 2026',
  contact: 'ansai พัฒนาและดำเนินการแอป BeanGo การใช้บริการของเราถือว่าคุณยอมรับนโยบายนี้\n\nสอบถาม: support@ansai.tw',
  sections: [
    {
      title: '1. การเก็บข้อมูล',
      body: 'เราเก็บข้อมูลต่อไปนี้เพื่อให้บริการ:\n\n• ตำแหน่ง: แสดงร้านกาแฟใกล้เคียง (เฉพาะขณะใช้แอป)\n• ข้อมูลบัญชี: อีเมลและรหัสผ่าน (เข้ารหัส)\n• ข้อมูลการใช้งาน: ประวัติการค้นหาและรายการโปรด\n• ข้อมูลอุปกรณ์: เวอร์ชัน OS และประเภทอุปกรณ์',
    },
    {
      title: '2. การใช้ข้อมูล',
      body: '• ตำแหน่งใช้สำหรับค้นหาร้านกาแฟเท่านั้น ไม่ใช้ติดตาม\n• ประวัติและรายการโปรดจัดเก็บในบัญชีของคุณ\n• เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลที่สาม\n• สถิติที่ไม่ระบุตัวตนอาจใช้ปรับปรุงบริการ',
    },
    {
      title: '3. บริการของบุคคลที่สาม',
      body: 'แอปนี้ใช้:\n\n• Google Maps Platform\n• Supabase\n• Google AdMob\n• Apple/Google (การชำระเงินสมัครสมาชิก)',
    },
    {
      title: '4. การปกป้องข้อมูล',
      body: '• ข้อมูลทั้งหมดส่งผ่านการเข้ารหัส HTTPS\n• รหัสผ่านเก็บด้วยการเข้ารหัสมาตรฐานอุตสาหกรรม\n• เราตรวจสอบมาตรการรักษาความปลอดภัยเป็นประจำ',
    },
    {
      title: '5. สิทธิ์ของคุณ',
      body: 'คุณสามารถ:\n\n• ลบประวัติการค้นหา\n• ยกเลิกรายการโปรด\n• ลบบัญชีและข้อมูลทั้งหมด\n• เพิกถอนสิทธิ์ตำแหน่ง (ในการตั้งค่าอุปกรณ์)',
    },
    {
      title: '6. ความเป็นส่วนตัวของเด็ก',
      body: 'บริการนี้ไม่ได้มุ่งเป้าไปที่เด็กอายุต่ำกว่า 13 ปี หากคุณเป็นผู้ปกครองและพบว่าบุตรของคุณให้ข้อมูลส่วนบุคคล กรุณาติดต่อเรา',
    },
    {
      title: '7. การเก็บรักษาข้อมูล',
      body: 'เราเก็บข้อมูลของคุณเฉพาะในช่วงเวลาที่จำเป็นสำหรับการให้บริการ หากคุณลบบัญชี ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบอย่างถาวร ข้อมูลการใช้งานที่ไม่ระบุตัวตนอาจถูกเก็บในรูปแบบรวมเพื่อวัตถุประสงค์ในการวิเคราะห์',
    },
    {
      title: '8. การเปลี่ยนแปลงนโยบาย',
      body: 'เราอาจอัปเดตนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว เราจะแจ้งให้คุณทราบเกี่ยวกับการเปลี่ยนแปลงที่สำคัญโดยอัปเดตวันที่ "อัปเดตล่าสุด" ที่ด้านบนของหน้า',
    },
  ],
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  scroll: { flex: 1, padding: Spacing.lg },
  updated: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  sectionBody: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 22 },
  contact: {
    fontSize: FontSize.sm, color: Colors.primary, textAlign: 'center',
    paddingVertical: Spacing.xl, marginBottom: Spacing.xl,
  },
});
