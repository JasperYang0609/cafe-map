# Reporting

## A 方案
適用情境：Claude Code / cowork 沒有 Discord 整合。

流程：
1. Claude 執行備份相關工作
2. Claude 在本地寫出 handoff 檔
3. OpenClaw 或人工讀取 handoff
4. 再轉送到 Discord `每日備份監控優化`（`channel:1493072746702311474`）

## 建議輸出
- `handoff/backup-monitor/latest-summary.md`
- `handoff/backup-monitor/latest-status.json`
- `handoff/backup-monitor/latest-anomaly.md`（有異常時）

## summary.md 建議內容
- 本輪模式：daily-sync / backlog-worker / audit
- 處理了哪些 entries
- 哪些 entries defer
- 是否 partial
- 重要結論

## status.json 建議內容
```json
{
  "generatedAt": "2026-04-13T21:30:00+08:00",
  "mode": "daily-sync",
  "status": "ok",
  "targetThread": "channel:1493072746702311474",
  "entriesProcessed": ["大廳", "openclaw優化研究"],
  "deferredEntries": ["beango-影片工作室"],
  "notes": ["首次全量備份（部分完成）"]
}
```

## 原則
- 不要把「logical target」誤寫成「Claude 已成功直接發送」
- relay 層若不存在，就只交付本地 handoff，不要假裝送達 Discord
