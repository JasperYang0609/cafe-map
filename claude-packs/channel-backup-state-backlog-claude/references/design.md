# Design

## 核心設計
- 用 state JSON 記每個 channel/thread 的同步進度
- 用 daily sync 保持系統日常健康
- 用 backlog worker 補大型落後 entry
- 用 partial completion 明確標記首次全量未完成的狀態

## 狀態檔建議欄位
```json
{
  "type": "channel|thread",
  "channelId": "...",
  "parentChannel": "...",
  "relativePath": "...",
  "lastMessageId": "...",
  "lastBackup": "YYYY-MM-DD",
  "guildId": "..."
}
```

## daily sync 原則
- 快
- 穩
- 不啃大型 backlog
- 新 entry 只做有限 bootstrap

## backlog worker 原則
- 每輪只挑少數候選
- 每批寫檔後就更新 state
- 追平後退出 backlog 候選

## Claude A 方案
如果 Claude 沒有直接 Discord 能力：
- Claude 只輸出本地 handoff 檔
- OpenClaw 或人工流程負責 relay

## 最終回報目標
最終目標仍是 Discord `每日備份監控優化`：`channel:1493072746702311474`
但這是 relay target，不是 Claude direct-send target。
