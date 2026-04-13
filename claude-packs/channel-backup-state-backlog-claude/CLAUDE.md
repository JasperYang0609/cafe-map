# CLAUDE.md — channel-backup-state-backlog

## 任務目標
維護一套「多頻道 / 多討論串自動備份不丟訊息」流程。
核心做法是把進度持久化到 state JSON，並把工作拆成 `daily sync` 與 `backlog worker` 兩條線，避免大型頻道拖垮日常同步。

## 本 workspace 固定設定
- 備份根目錄：`/Users/as_openclaw/Desktop/安賽小助手備份/頻道紀錄/`
- 狀態檔：`/Users/as_openclaw/.openclaw/workspace/memory/channel_backup_summary_state.json`
- 最終回報目標：Discord `每日備份監控優化`（`channel:1493072746702311474`）

## A 方案回報模型（Claude Code / cowork 專用）
Claude Code 沒有直接串 Discord 時，不要假裝能自己送訊息到 thread。

改用這個模式：
- Claude 負責產出本地報告檔
- OpenClaw 或人工流程負責 relay 到 Discord thread

也就是：
- **logical destination** = `每日備份監控優化`
- **delivery mechanism** = 本地檔案 handoff，不是 Claude 直接發 Discord

## 本地輸出約定
將回報寫到 repo 內或指定工作目錄下的：
- `handoff/backup-monitor/latest-summary.md`
- `handoff/backup-monitor/latest-status.json`
- `handoff/backup-monitor/latest-anomaly.md`（只有異常時才需要）

若專案已有既定 handoff 目錄，可沿用，但要保持：
- 一份人類可讀摘要
- 一份機器可讀狀態 JSON
- 異常時額外一份 anomaly 文檔

## 路徑規則
- 頻道：`<頻道名>/{raw,summary,legacy}/`
- 討論串：`<父頻道名>/<討論串名>/{raw,summary,legacy,legacy_docs}/`

## 角色拆分

### Daily sync
只做：
- discovery
- 健康增量同步
- 少量 bootstrap

不要做：
- 大型 backlog 全量追趕
- 一次吞太多新頻道歷史

建議上限：
- 一般增量：最多 5 頁、約 250 則
- 首次全量：每次最多 1 個新 entry，最多 40 頁、約 2000 則，或接近 timeout 就安全收尾

### Backlog worker
只做：
- 補 daily sync 故意 defer 的大型 / 落後 entry
- 分批追趕
- 每批寫入 raw / summary 後同步更新 state

## 關鍵規則
- 狀態以 `channel_backup_summary_state.json` 為準，不可只靠檔案名推進度
- 發現新頻道 / 新討論串時，要先註冊進 state，再做首輪 bootstrap
- 首次全量若沒補完，必須明寫：`首次全量備份（部分完成）`
- 不可把未真正寫入的訊息先推進 `lastMessageId`
- `legacy` 只當歷史倉庫，不當主輸出
- 若有專案特化日報，請放 `reports/`，不要放進 `legacy`

## 回報規則
Claude 端回報分成兩層：

### 1. 本地交付
至少落地：
- `latest-summary.md`
- `latest-status.json`

### 2. 最終 Discord relay
由 OpenClaw 或人工把本地交付轉送到：
- Discord 討論串 `每日備份監控優化`（`channel:1493072746702311474`）

Claude 版不要寫成「直接送 Discord」。
要寫成「最終目標 thread 如上，由 relay 層負責送達」。

## 建議的 status.json 欄位
```json
{
  "generatedAt": "2026-04-13T21:30:00+08:00",
  "mode": "daily-sync|backlog-worker|audit",
  "status": "ok|partial|error",
  "targetThread": "channel:1493072746702311474",
  "entriesProcessed": [],
  "deferredEntries": [],
  "notes": []
}
```

## 你應該先讀
- `references/design.md`
- `references/recovery.md`
- `references/reporting.md`

## 可直接用的腳本
- `scripts/bootstrap_state.py`
- `scripts/select_backlog_candidates.py`

## 交付標準
若你要修改或重建這套流程，交付內容至少包含：
- state 檔路徑
- backup root
- daily sync 與 backlog worker 的分工
- 首次全量與 partial completion 規則
- 本地 handoff 路徑
- 最終 Discord 目標 thread
- recovery 說明
