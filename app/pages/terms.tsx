import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { useI18n } from '../../src/context/I18nContext';

export default function TermsScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEn = locale.startsWith('en');
  const isJa = locale.startsWith('ja');
  const isKo = locale.startsWith('ko');
  const isTh = locale.startsWith('th');
  const isCN = locale === 'zh-CN';

  const content = isEn ? CONTENT_EN
    : isJa ? CONTENT_JA
    : isKo ? CONTENT_KO
    : isTh ? CONTENT_TH
    : isCN ? CONTENT_CN
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
  title: '服務條款',
  updated: '最後更新：2026 年 4 月',
  contact: 'ansai（安賽）開發並營運 BeanGo 跑咖 App。\n如有任何問題，請聯繫：support@ansai.tw',
  sections: [
    {
      title: '1. 服務說明',
      body: 'BeanGo 跑咖（以下稱「本服務」）是由 ansai（安賽）提供的咖啡廳探索應用程式。本服務提供咖啡廳搜尋、收藏、評分等功能。使用本服務即表示您同意遵守本條款。',
    },
    {
      title: '2. 帳號與使用',
      body: '• 您必須年滿 13 歲才能使用本服務\n• 您有責任保管帳號安全，不得將帳號借予他人使用\n• 您同意提供真實、準確的註冊資訊\n• 我們保留在違反條款時停用帳號的權利',
    },
    {
      title: '3. 訂閱服務（BeanGo Pro）',
      body: '• BeanGo Pro 為自動續訂的月訂閱服務\n• 訂閱透過 Apple App Store 或 Google Play 處理付款\n• 價格為 NT$30/月（或當地等值貨幣）\n• 訂閱將在每個計費週期結束前 24 小時自動續訂\n• 您可以隨時在裝置設定中取消訂閱\n• 取消後，訂閱將在當前計費週期結束時失效\n• 未使用的免費試用期（如有）將在購買訂閱時失效',
    },
    {
      title: '4. 使用者內容',
      body: '• 您保留對自己內容（評分、收藏）的所有權利\n• 您授權我們在提供服務所需的範圍內使用這些內容\n• 您不得上傳違法、侵權或有害的內容',
    },
    {
      title: '5. 第三方服務',
      body: '• 本服務使用 Google Maps 和 Google Places API\n• 咖啡廳資訊來自 Google，我們不對其準確性負責\n• 營業時間和評分可能與實際情況有所差異\n• 使用地圖功能時，您同時受 Google 服務條款約束',
    },
    {
      title: '6. 免責聲明',
      body: '• 本服務以「現狀」提供，不提供任何明示或暗示的保證\n• 我們不對咖啡廳的服務品質、衛生狀況或營業狀態負責\n• 我們不對因使用本服務而產生的任何直接或間接損失負責\n• 服務可能因維護或不可抗力而暫時中斷',
    },
    {
      title: '7. 帳號刪除',
      body: '• 您可以隨時在個人檔案頁面中刪除帳號\n• 刪除帳號將永久移除所有個人資料，包括收藏和搜尋紀錄\n• 此操作無法復原\n• 刪除帳號不會自動取消訂閱，請先在裝置設定中取消',
    },
    {
      title: '8. 條款修改',
      body: '我們保留隨時修改本條款的權利。重大變更將透過 App 內通知或 Email 告知。繼續使用本服務即表示您同意修改後的條款。',
    },
  ],
};

const CONTENT_CN = {
  title: '服务条款',
  updated: '最后更新：2026 年 4 月',
  contact: 'ansai（安赛）开发并运营 BeanGo 跑咖 App。\n如有任何问题，请联系：support@ansai.tw',
  sections: [
    { title: '1. 服务说明', body: 'BeanGo 跑咖（以下称「本服务」）是由 ansai（安赛）提供的咖啡厅探索应用程序。本服务提供咖啡厅搜索、收藏、评分等功能。使用本服务即表示您同意遵守本条款。' },
    { title: '2. 账号与使用', body: '• 您必须年满 13 岁才能使用本服务\n• 您有责任保管账号安全，不得将账号借予他人使用\n• 您同意提供真实、准确的注册信息\n• 我们保留在违反条款时停用账号的权利' },
    { title: '3. 订阅服务（BeanGo Pro）', body: '• BeanGo Pro 为自动续订的月订阅服务\n• 订阅通过 Apple App Store 或 Google Play 处理付款\n• 价格为 NT$30/月（或当地等值货币）\n• 订阅将在每个计费周期结束前 24 小时自动续订\n• 您可以随时在设备设置中取消订阅\n• 取消后，订阅将在当前计费周期结束时失效\n• 未使用的免费试用期（如有）将在购买订阅时失效' },
    { title: '4. 用户内容', body: '• 您保留对自己内容（评分、收藏）的所有权利\n• 您授权我们在提供服务所需的范围内使用这些内容\n• 您不得上传违法、侵权或有害的内容' },
    { title: '5. 第三方服务', body: '• 本服务使用 Google Maps 和 Google Places API\n• 咖啡厅信息来自 Google，我们不对其准确性负责\n• 营业时间和评分可能与实际情况有所差异\n• 使用地图功能时，您同时受 Google 服务条款约束' },
    { title: '6. 免责声明', body: '• 本服务以「现状」提供，不提供任何明示或暗示的保证\n• 我们不对咖啡厅的服务品质、卫生状况或营业状态负责\n• 我们不对因使用本服务而产生的任何直接或间接损失负责\n• 服务可能因维护或不可抗力而暂时中断' },
    { title: '7. 账号删除', body: '• 您可以随时在个人档案页面中删除账号\n• 删除账号将永久移除所有个人数据，包括收藏和搜索记录\n• 此操作无法恢复\n• 删除账号不会自动取消订阅，请先在设备设置中取消' },
    { title: '8. 条款修改', body: '我们保留随时修改本条款的权利。重大变更将通过 App 内通知或 Email 告知。继续使用本服务即表示您同意修改后的条款。' },
  ],
};

const CONTENT_EN = {
  title: 'Terms of Use',
  updated: 'Last updated: April 2026',
  contact: 'BeanGo is developed and operated by ansai.\nFor questions, contact: support@ansai.tw',
  sections: [
    { title: '1. Service Description', body: 'BeanGo ("the Service") is a cafe discovery app provided by ansai. The Service offers cafe search, favorites, and rating features. By using the Service, you agree to these terms.' },
    { title: '2. Account & Usage', body: '• You must be at least 13 years old to use the Service\n• You are responsible for your account security\n• You agree to provide accurate registration information\n• We reserve the right to suspend accounts that violate these terms' },
    { title: '3. Subscription (BeanGo Pro)', body: '• BeanGo Pro is an auto-renewing monthly subscription\n• Payment is processed through Apple App Store or Google Play\n• Price: NT$30/month (or local equivalent)\n• Subscription auto-renews 24 hours before the end of each billing period\n• You can cancel anytime in your device settings\n• After cancellation, access continues until the end of the current billing period\n• Any unused free trial period is forfeited upon purchasing a subscription' },
    { title: '4. User Content', body: '• You retain all rights to your content (ratings, favorites)\n• You grant us a license to use this content as needed to provide the Service\n• You may not upload illegal, infringing, or harmful content' },
    { title: '5. Third-Party Services', body: '• The Service uses Google Maps and Google Places API\n• Cafe information comes from Google; we are not responsible for its accuracy\n• Business hours and ratings may differ from actual conditions\n• By using map features, you also agree to Google\'s Terms of Service' },
    { title: '6. Disclaimer', body: '• The Service is provided "as is" without any warranties\n• We are not responsible for cafe service quality, hygiene, or business status\n• We are not liable for any direct or indirect damages from using the Service\n• The Service may be temporarily interrupted for maintenance or force majeure' },
    { title: '7. Account Deletion', body: '• You can delete your account anytime from the Profile page\n• Account deletion permanently removes all personal data including favorites and search history\n• This action cannot be undone\n• Deleting your account does not automatically cancel subscriptions; please cancel in device settings first' },
    { title: '8. Changes to Terms', body: 'We reserve the right to modify these terms at any time. Significant changes will be communicated via in-app notification or email. Continued use of the Service constitutes acceptance of the modified terms.' },
  ],
};

const CONTENT_JA = {
  title: '利用規約',
  updated: '最終更新：2026年4月',
  contact: 'BeanGo は ansai が開発・運営しています。\nお問い合わせ：support@ansai.tw',
  sections: [
    { title: '1. サービスの説明', body: 'BeanGo（以下「本サービス」）は、ansai が提供するカフェ探索アプリです。本サービスはカフェ検索、お気に入り、評価機能を提供します。本サービスのご利用により、本規約に同意したものとみなされます。' },
    { title: '2. アカウントと利用', body: '• 本サービスを利用するには13歳以上である必要があります\n• アカウントのセキュリティはお客様の責任です\n• 正確な登録情報を提供することに同意するものとします\n• 規約違反の場合、アカウントを停止する権利を留保します' },
    { title: '3. サブスクリプション（BeanGo Pro）', body: '• BeanGo Pro は自動更新の月額サブスクリプションです\n• 決済は Apple App Store または Google Play を通じて処理されます\n• 価格：月額 NT$30（または現地通貨の同等額）\n• 各請求期間の終了24時間前に自動更新されます\n• デバイス設定からいつでもキャンセルできます\n• キャンセル後も現在の請求期間終了までアクセスが継続されます' },
    { title: '4. ユーザーコンテンツ', body: '• お客様のコンテンツ（評価、お気に入り）の権利はお客様に帰属します\n• サービス提供に必要な範囲でこれらのコンテンツを使用する許可を頂きます\n• 違法、権利侵害、有害なコンテンツをアップロードしてはなりません' },
    { title: '5. 第三者サービス', body: '• 本サービスは Google Maps および Google Places API を使用しています\n• カフェ情報は Google から提供されており、その正確性については責任を負いません\n• 営業時間や評価は実際と異なる場合があります' },
    { title: '6. 免責事項', body: '• 本サービスは「現状のまま」提供され、いかなる保証もありません\n• カフェのサービス品質、衛生状態、営業状態について責任を負いません\n• 本サービスの利用から生じるいかなる損害についても責任を負いません' },
    { title: '7. アカウント削除', body: '• プロフィールページからいつでもアカウントを削除できます\n• アカウント削除によりお気に入りや検索履歴を含むすべての個人データが永久に削除されます\n• この操作は取り消せません\n• アカウント削除によりサブスクリプションは自動キャンセルされません。先にデバイス設定からキャンセルしてください' },
    { title: '8. 規約の変更', body: '本規約はいつでも変更される場合があります。重要な変更はアプリ内通知またはメールでお知らせします。' },
  ],
};

const CONTENT_KO = {
  title: '이용약관',
  updated: '마지막 업데이트: 2026년 4월',
  contact: 'BeanGo는 ansai가 개발 및 운영합니다.\n문의: support@ansai.tw',
  sections: [
    { title: '1. 서비스 설명', body: 'BeanGo(이하 "서비스")는 ansai가 제공하는 카페 탐색 앱입니다. 본 서비스는 카페 검색, 즐겨찾기, 평가 기능을 제공합니다. 서비스를 사용함으로써 본 약관에 동의하는 것으로 간주됩니다.' },
    { title: '2. 계정 및 사용', body: '• 본 서비스를 이용하려면 만 13세 이상이어야 합니다\n• 계정 보안은 사용자의 책임입니다\n• 정확한 등록 정보를 제공하는 것에 동의합니다\n• 약관 위반 시 계정을 정지할 권리를 보유합니다' },
    { title: '3. 구독 서비스 (BeanGo Pro)', body: '• BeanGo Pro는 자동 갱신 월간 구독 서비스입니다\n• 결제는 Apple App Store 또는 Google Play를 통해 처리됩니다\n• 가격: 월 NT$30 (또는 현지 통화 동등액)\n• 각 청구 기간 종료 24시간 전에 자동 갱신됩니다\n• 기기 설정에서 언제든지 취소할 수 있습니다\n• 취소 후에도 현재 청구 기간 종료까지 접근이 유지됩니다' },
    { title: '4. 사용자 콘텐츠', body: '• 사용자 콘텐츠(평가, 즐겨찾기)에 대한 모든 권리는 사용자에게 있습니다\n• 서비스 제공에 필요한 범위 내에서 해당 콘텐츠를 사용할 수 있는 권한을 부여합니다\n• 불법, 침해, 유해한 콘텐츠를 업로드해서는 안 됩니다' },
    { title: '5. 제3자 서비스', body: '• 본 서비스는 Google Maps 및 Google Places API를 사용합니다\n• 카페 정보는 Google에서 제공되며, 정확성에 대해 책임지지 않습니다\n• 영업시간과 평점은 실제와 다를 수 있습니다' },
    { title: '6. 면책조항', body: '• 본 서비스는 "있는 그대로" 제공되며 어떠한 보증도 없습니다\n• 카페의 서비스 품질, 위생 상태, 영업 상태에 대해 책임지지 않습니다\n• 서비스 사용으로 인한 직간접적 손해에 대해 책임지지 않습니다' },
    { title: '7. 계정 삭제', body: '• 프로필 페이지에서 언제든지 계정을 삭제할 수 있습니다\n• 계정 삭제 시 즐겨찾기 및 검색 기록을 포함한 모든 개인 데이터가 영구 삭제됩니다\n• 이 작업은 되돌릴 수 없습니다\n• 계정 삭제로 구독이 자동 취소되지 않습니다. 먼저 기기 설정에서 취소하세요' },
    { title: '8. 약관 변경', body: '본 약관은 언제든지 변경될 수 있습니다. 중요한 변경 사항은 앱 내 알림 또는 이메일로 안내드립니다.' },
  ],
};

const CONTENT_TH = {
  title: 'ข้อกำหนดการใช้งาน',
  updated: 'อัปเดตล่าสุด: เมษายน 2026',
  contact: 'BeanGo พัฒนาและดำเนินการโดย ansai\nติดต่อ: support@ansai.tw',
  sections: [
    { title: '1. คำอธิบายบริการ', body: 'BeanGo ("บริการ") เป็นแอปค้นหาร้านกาแฟที่ให้บริการโดย ansai บริการนี้มีฟีเจอร์ค้นหาร้านกาแฟ รายการโปรด และการให้คะแนน การใช้บริการถือว่าคุณยอมรับข้อกำหนดเหล่านี้' },
    { title: '2. บัญชีและการใช้งาน', body: '• คุณต้องมีอายุอย่างน้อย 13 ปีจึงจะใช้บริการได้\n• คุณรับผิดชอบต่อความปลอดภัยของบัญชีของคุณ\n• คุณตกลงให้ข้อมูลการลงทะเบียนที่ถูกต้อง\n• เราขอสงวนสิทธิ์ในการระงับบัญชีที่ละเมิดข้อกำหนด' },
    { title: '3. สมาชิก (BeanGo Pro)', body: '• BeanGo Pro เป็นสมาชิกรายเดือนต่ออายุอัตโนมัติ\n• การชำระเงินผ่าน Apple App Store หรือ Google Play\n• ราคา: NT$30/เดือน (หรือเทียบเท่าในสกุลเงินท้องถิ่น)\n• ต่ออายุอัตโนมัติ 24 ชั่วโมงก่อนสิ้นสุดรอบการเรียกเก็บเงิน\n• คุณสามารถยกเลิกได้ตลอดเวลาในการตั้งค่าอุปกรณ์' },
    { title: '4. เนื้อหาของผู้ใช้', body: '• คุณมีสิทธิ์ในเนื้อหาของคุณ (คะแนน, รายการโปรด)\n• คุณให้สิทธิ์เราในการใช้เนื้อหาเพื่อให้บริการ\n• ห้ามอัปโหลดเนื้อหาที่ผิดกฎหมาย ละเมิด หรือเป็นอันตราย' },
    { title: '5. บริการของบุคคลที่สาม', body: '• บริการนี้ใช้ Google Maps และ Google Places API\n• ข้อมูลร้านกาแฟมาจาก Google เราไม่รับผิดชอบต่อความถูกต้อง\n• เวลาทำการและคะแนนอาจแตกต่างจากสถานการณ์จริง' },
    { title: '6. ข้อจำกัดความรับผิด', body: '• บริการให้ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ\n• เราไม่รับผิดชอบต่อคุณภาพบริการ สุขอนามัย หรือสถานะการเปิดของร้านกาแฟ\n• เราไม่รับผิดชอบต่อความเสียหายทั้งทางตรงและทางอ้อม' },
    { title: '7. การลบบัญชี', body: '• คุณสามารถลบบัญชีได้ตลอดเวลาจากหน้าโปรไฟล์\n• การลบบัญชีจะลบข้อมูลส่วนตัวทั้งหมดอย่างถาวร\n• การดำเนินการนี้ไม่สามารถย้อนกลับได้\n• การลบบัญชีไม่ได้ยกเลิกสมาชิกอัตโนมัติ กรุณายกเลิกในการตั้งค่าอุปกรณ์ก่อน' },
    { title: '8. การเปลี่ยนแปลงข้อกำหนด', body: 'เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเหล่านี้ได้ตลอดเวลา การเปลี่ยนแปลงที่สำคัญจะแจ้งผ่านการแจ้งเตือนในแอปหรืออีเมล' },
  ],
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  updated: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.md },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  sectionBody: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  contact: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl * 2, marginTop: Spacing.lg, textAlign: 'center' },
});
