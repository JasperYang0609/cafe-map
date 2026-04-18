# BeanGo iOS Launch — 節點快照

**日期**：2026-04-18
**狀態**：iOS 1.0.0 (11) 已上 TestFlight 內測中；Android V40 Play Store 現行版本不受影響。

---

## Git 狀態

| 項目 | 值 |
|---|---|
| 工作分支 | `claude/cafe-map-ios-launch-zRY6T` |
| HEAD | `e982a19 fix: Android 鎖回 non-personalized 廣告` |
| 上一 commit | `a899bc0 feat: iOS 上架準備 — ATT + Privacy Manifest + AdMob hotfix (1.0.0 build 10)` |
| 基底 | `64b525c feat: V40 咖啡廳探索系統重構` (main) |

### 平行分支（僅歷史參考，不繼續開發）
- `claude/cafe-map-ios-launch-WQ2ef` @ `9a9c38c` — 當初上 TestFlight build 7/9 的 legacy 分支

---

## TestFlight 版本

| Build | 上傳日 | 狀態 | 備註 |
|---|---|---|---|
| 1.0.0 (7) | 2026-04-17 | 準備提交 | legacy，有已知 bug，不送審 |
| 1.0.0 (9) | 2026-04-17 | 準備提交 | legacy，有已知 bug，不送審 |
| 1.0.0 (11) | 2026-04-17 | 準備提交 | **目前測試中** |

Build 10 本地 build 出來但沒上傳（被 build 11 直接蓋過）。

---

## Build 11 包含的修正

### iOS 上架準備
- 版本 `0.1.0` → `1.0.0`
- 裝 `expo-tracking-transparency`，AdMob init 前請求 ATT
- `privacyManifests`：`NSPrivacyTracking=true` + tracking domains (`googleads.g.doubleclick.net`, `pagead2.googlesyndication.com`)
- API reasons：UserDefaults `CA92.1` / FileTimestamp `C617.1` / DiskSpace `E174.1` / SystemBootTime `35F9.1`

### Ads hotfixes
- `ads.ts` 共用 `initPromise`，解決 banner+rewarded init 競態
- rewarded NPA 旗標改為依 ATT 推導（iOS 同意→個人化；拒絕→非個人化）
- Android 鎖回 non-personalized（保守，等 UMP 同意流程才開個人化）
- rewarded ERROR log 加 code/message/raw 方便診斷
- `BannerAdPlaceholder` 等 `initAds()` 成功才 mount，首次 request 就帶對 NPA

### UI 修正
- `favorites` guest / loading / empty / regular 四種狀態都保留 banner
- `profile` 版本標籤改 Platform-aware（iOS 顯示 `ios.buildNumber`；Android 顯示 `android.versionCode`）
- `profile` 無 banner（維持原狀）
- `map` + `favorites` marker 改用穩定 key + `trackTrigger`，解決 iOS 鬼影/重複 marker

### 雜項
- `cafeDiscovery.ts` `price_level: null → undefined`（修 V40 baseline tsc error）

---

## Build 11 要驗證的項目

- [ ] 冷啟動第一次跳 ATT 對話框（同意/拒絕各測一次）
- [ ] Guest 狀態 4 個分頁都看得到 banner（探索 / 地圖 / 收藏 / 搜尋紀錄）
- [ ] 抽 3 次免費後第 4 次看 rewarded ad → 不再跳「廣告準備中」、reward 正確結算
- [ ] Profile 頁版本顯示 `v1.0.0 (Build 11)`（不是 Android 的 versionCode）
- [ ] 地圖點 marker 選取切換不會出現鬼影 / 重複 / 跳動
- [ ] 收藏頁 map marker 也正常

---

## 未結事項（交棒給之後 / OpenClaw）

### 立即
- [ ] build 11 TestFlight 驗證結果回饋
- [ ] 若 build 11 OK → 送審 App Store（**不要送 build 7/9**）

### 清理
- [ ] `~/cafe-map-ios-build` 有 7 個未 commit 檔案，需比對是否跟 `a899bc0` 等價；等價就刪，差異就撈回 zRY6T
- [ ] `git worktree list` 確認 ios-build 是獨立 clone 還是 worktree，再決定 `rm -rf` 或 `git worktree remove`
- [ ] 日後統一只用 `~/cafe-map` 一個資料夾

### Android 回頭要處理
- [ ] `main` 分支上 stash 有 `versionCode 40` 改動，日後要 pop 回來
- [ ] `zRY6T` 合回 `main` 前要手動保留 Android `versionCode` 不要被覆蓋成 26
- [ ] 若要拚 Android 個人化廣告收益 → 導入 Google UMP 同意流程後再解 Android NPA 鎖

### 未完成
- [ ] Build 7 / 8 實際 diff 無法從 repo 完整還原，不追了
- [ ] EAS 雲端 build 額度 2026-04-13 已用完，目前只跑本機 build

---

## 檔案、密鑰、聯絡（抄自 CLAUDE.md）

- **Bundle ID**：`com.ansai.beango`
- **App 名稱**：BeanGo 跑咖
- **Supabase project**：`fykzbocjhsbljrlriewv`
- **審核帳號**：`reviewer@beango.app` / `Review2026!`
- **聯絡信箱**：`annsai5869@gmail.com`
- **GitHub**：`JasperYang0609/cafe-map` (Private)
