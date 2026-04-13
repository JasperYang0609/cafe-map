# Recovery

## 恢復順序
1. workspace 核心文件
2. `memory/`
3. 備份樹
4. `memory/channel_backup_summary_state.json`
5. cron 定義

## 重點
- 只有 backup 檔案但沒有 state，不算真正可續跑
- 新 agent 接手時先讀 `summary`
- 要精準原話再查 `raw`
- `legacy` 不當主讀來源

## 恢復後驗證
- state JSON 可正常讀取
- backup root 存在
- 任一已知 entry 路徑正確
- 下一次 incremental 不重複寫舊資料
