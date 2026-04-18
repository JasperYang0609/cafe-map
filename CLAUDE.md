# CLAUDE.md — BeanGo 跑咖 開發 Context

## 專案概要
- **App 名稱**: BeanGo 跑咖
- **Bundle ID**: com.ansai.beango
- **技術棧**: Expo (React Native) + Supabase + Google Places API (New) + RevenueCat + AdMob
- **目標**: 咖啡廳探索 App，核心玩法是「種子盲選」（塔羅牌風格咖啡豆 → 隨機推薦咖啡廳）
- **變現**: 免費版有廣告（3 次/天免費，之後看 rewarded ad）+ 訂閱制 NT$30/月（無廣告 + 花園地圖）

## Repo
- **GitHub**: JasperYang0609/cafe-map (Private)
- **主要開發分支**: `claude/general-session-fLOga`（main 目前落後，不會直接 push）
- **最新版**: V42（v1.0.0, versionCode 42 / buildNumber "42", commit `aefa67d`）

## 技術棧 & 版本
- Expo SDK 54, React Native 0.81.5, React 19.1.0
- Supabase (fykzbocjhsbljrlriewv, Tokyo, Pro plan)
- Google Places API (New) — key: AIzaSyCtAEBCtlmo5zDXYj0ZS5FevJcP9be70I8
- RevenueCat — Production API Key: appl_gRoXqbZikpsRMiVnMyXdwKXflbi
- AdMob — Android App ID: ca-app-pub-7299866937396477~3820937531
- react-native-google-mobile-ads v16.3.1
- react-native-maps 1.20.1
- react-native-purchases v9.14.0

## 專案結構
```
app/
  (tabs)/
    index.tsx       — 探索頁（種子盲選主頁面）
    map.tsx         — 地圖頁
    favorites.tsx   — 收藏頁（花園）
    history.tsx     — 搜尋紀錄頁
    profile.tsx     — 我的頁（登入/訂閱/設定）
  cafe/[id].tsx     — 店家詳情頁
  pages/
    subscribe.tsx   — 訂閱頁（RevenueCat Paywall）
    privacy.tsx     — 隱私權政策（6 語言）
    terms.tsx       — 服務條款（6 語言）
    reset-password.tsx — 重設密碼頁
src/
  components/       — CafeCard, FilterSheet, GardenRollModal, BannerAdPlaceholder, LanguagePicker
  context/          — AuthContext, FavoritesContext, HistoryContext, I18nContext
  hooks/            — useCafes, useLocation
  lib/
    ads.ts          — AdMob 管理（V19: on-demand 架構，不 preload）
    cafeDiscovery.ts — V40+ 咖啡廳 Nearby Search + 遞迴分圈
    cafeIdentity.ts — V40+ 咖啡廳識別分類（denylist / coffee signals）
    cafeSelectors.ts — V40+ Map / Explore 共用 selector
    places.ts       — 舊版 multi-circle 搜尋（legacy）+ 距離/營業時間 helper
    h3cache.ts      — 網格快取（Supabase h3_cache table）
    supabase.ts     — Supabase client
    purchases.ts    — RevenueCat 訂閱管理
    garden.ts       — 花園植物抽獎邏輯
    googleAuth.ts   — Google Sign In
    appleAuth.ts    — Apple Sign In
  locales/          — zh-TW, zh-CN, en, ja, ko, th（6 語言）
  constants/
    cafeDiscoveryRules.ts — V40+ 搜尋規則 / 半徑常數 / RULES_VERSION
    config.ts       — API key / 預設 region / 快取參數
    theme.ts        — 顏色、字級、間距
  types/            — cafe.ts
docs/               — GitHub Pages 官網（index.html, privacy.html, terms.html）
```

## Supabase
- **Project ref**: fykzbocjhsbljrlriewv
- **API URL**: https://fykzbocjhsbljrlriewv.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3pib2NqaHNibGpybHJpZXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTI3NzMsImV4cCI6MjA4OTU2ODc3M30.NswKBPGdClnjLRlBjQHRZG2omL4gywu3BDgAeCqvt08
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3pib2NqaHNibGpybHJpZXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk5Mjc3MywiZXhwIjoyMDg5NTY4NzczfQ.OPP-uh_X0ehcYIOL48V8bCAHJe9BinVUMjlCLBixdmU
- **Tables**: users, cafes, favorites, search_history, h3_cache
- **Auth**: Email/Password + Google Sign In + Apple Sign In
- **Redirect URLs**: beango://pages/reset-password, beango://**

## Google OAuth
- iOS Client ID: 884465277657-h3ulofb2q17hift5gjb269osq7jl0cn6.apps.googleusercontent.com
- Web Client ID: 884465277657-3fv8s27aiaejgbnr8s911jon85anjh3m.apps.googleusercontent.com

## RevenueCat
- 產品: beango_monthly → Entitlement: BeanGo Pro → Offering: default/Monthly
- App Store 訂閱群組: BeanGo Pro (NT$30/月)
- Shared Secret: df8e892949464fd5b2f3af37c953ffc2
- In-App Purchase Key ID: 9D6FHRLC3V

## AdMob
- Rewarded Ad (Android): ca-app-pub-7299866937396477/3433195775
- Rewarded Ad (iOS): ca-app-pub-7299866937396477/6951854171
- Banner (Android): ca-app-pub-7299866937396477/5356651534
- Banner (iOS): ca-app-pub-7299866937396477/1891099182
- Test ads 在 __DEV__ 模式自動啟用

## Build
- **本機 Android build**: `EAS_NO_VCS=1 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools JAVA_HOME=$(/usr/libexec/java_home -v 17) npx eas-cli build --platform android --profile production --local --non-interactive`
- **本機 iOS build**（需 Xcode + CocoaPods）: `EAS_NO_VCS=1 npx eas-cli build --platform ios --profile production --local --non-interactive`
- **雲端 EAS build**（需額度）: `npx eas-cli build --platform android --profile production --non-interactive`
- EAS 免費方案月額度已用完（2026-04-13 重置），優先用本機 build
- `production` profile 有 autoIncrement：Android build 只動 `versionCode`，iOS build 只動 `buildNumber`
- **版本同步規則**：Android build 完**不要 commit**，直接接著 build iOS，autoIncrement 會讓兩邊都 +1 到同一版號；全部 build 完再一起 commit
- AAB 產出在 repo 根目錄 `build-*.aab`（已加入 .gitignore），IPA 同樣 `build-*.ipa`

## EAS Update（OTA）
- `updates.url`: https://u.expo.dev/65269658-1b91-4072-9abb-1d676abb8d17
- `runtimeVersion.policy`: `appVersion`（runtime = app version）
- Channel 設定：production profile → channel `production`；preview profile → channel `preview`（在 eas.json）
- **Publish OTA**: `npx eas-cli update --branch production --message "..."`
- **何時用 OTA**: 只改 JS 程式碼、asset、常數時（不改 native module / plugin / permission）
- **何時必須 native rebuild**: version 升級（runtime 會跟著變）、新增/升級 native module、改權限、改 app.json plugin 設定
- **升級 version（例如 1.0.0 → 1.1.0）**: 所有舊用戶必須重裝，OTA 沒辦法把他們跨 runtime 升過去

## 審核帳號
- Email: reviewer@beango.app / Password: Review2026!（Supabase 已建）

## 聯絡信箱
- 所有官方頁面（privacy, terms, 官網）統一用: annsai5869@gmail.com

## 已完成功能
- Google Sign In (iOS + Web OAuth) + Apple Sign In + Email/Password
- 種子盲選（3 種塔羅牌風格咖啡豆 → 隨機咖啡廳）
- 搜尋記錄持久化（Supabase）+ 評分持久化
- 收藏花園（收藏時抽 emoji 植物）
- RevenueCat 訂閱制 UI（Paywall、月訂閱、恢復購買、6 語言 i18n）
- 免費用戶廣告流程（3 次免費/天 → rewarded ad → 看完給結果）
- V40 咖啡廳探索系統重構（cafeDiscovery + cafeIdentity + cafeSelectors + RULES_VERSION 版控）
- 冷啟動優化（getLastKnownPositionAsync 先出）
- 帳號刪除功能（Apple Guideline 合規）
- Terms of Use + Privacy Policy（App 內 6 語言 + 網頁版）
- 營業狀態即時計算（isCurrentlyOpen，支援跨午夜/24hr）
- Banner 廣告（探索頁、地圖頁、搜尋紀錄頁）
- 地圖原生 pinColor marker + 收藏 emoji marker
- **V42 Places API 成本優化（Phase 1/2/5）**:
  - 移除 Text Search（省 50-70%）
  - `cafe` + `coffee_shop` 合併成單次 Nearby Search（再省 ~50%）
  - `MIN_RECURSIVE_RADIUS` 250m → 500m（限制深層遞迴）
  - 距離 UI 砍到 500m/1km/2km/3km，`MAP_SEARCH_RADIUS` 5km→3km、`MAX_SEARCH_RADIUS` 10km→3km
  - 預期成本降到原本 15-25%
  - 注意：**不要 bump `RULES_VERSION`**，否則 Supabase cache 全失效會再燒一波

## 已知問題 / 待驗證（V42）
- **Places API 成本**: V42 上線後需觀察成本曲線，Supabase cache 舊資料 TTL 45 天，新網格立即生效
- **廣告 reward**: V19 改為 on-demand 架構（不 preload）
- **地圖 marker**: V19 改用原生 pinColor（非收藏）+ emoji always-track（收藏）
- **忘記密碼**: Supabase rate limit 60s/封，不是 bug
- **冷啟動**: 仍有 1-2 秒定位中，可接受
- **iOS 正式上架**: 暫緩中（TestFlight 廣告 0 fill 正常，等公開上架才有數據）

## Commit 慣例
- `fix:` bug 修復
- `feat:` 新功能
- `chore:` 非功能性變更（email、config、docs）
- `[openclaw-fallback]` 標記 OpenClaw 臨時接手的 commit

## 協作模式
- **Claude Code**: 唯一 code writer，直接存取 repo
- **OpenClaw/GPT**: 負責 Notion、備份、Discord 管理，不改 code
- 共用 git repo + Notion，衝突靠角色分工防止

## Backup relay addendum
本 repo 已加入 **A 方案 relay 模式** 的備份監控上下文。
- Claude 不直接發 Discord
- Claude 只寫本地 handoff 檔
- 最終由 OpenClaw 或人工 relay 到 Discord `每日備份監控優化`（`channel:1493072746702311474`）

請優先讀：
- `claude-packs/channel-backup-state-backlog-claude/CLAUDE.md`
- `claude-packs/channel-backup-state-backlog-claude/references/design.md`
- `claude-packs/channel-backup-state-backlog-claude/references/recovery.md`
- `claude-packs/channel-backup-state-backlog-claude/references/reporting.md`

本地 handoff 輸出路徑：
- `handoff/backup-monitor/latest-summary.md`
- `handoff/backup-monitor/latest-status.json`
- `handoff/backup-monitor/latest-anomaly.md`（有異常時）
