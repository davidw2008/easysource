# Use Case 編寫指南

## 檔案關係

```
usecases/
  registry.json          ← 網頁左側清單來源
  flows/
    launch_app.yaml      ← 真正對手機執行的 Maestro 流程
    smoke_home.yaml
    ...
```

`registry.json` 每一筆至少要有：

```json
{
  "id": "launch_app",
  "title": "啟動 App",
  "description": "確認 App 能正常啟動並進入主畫面。",
  "flow": "flows/launch_app.yaml",
  "tags": ["smoke"],
  "estimatedSeconds": 20
}
```

## 內建 5 個範本

| ID | 用途 | 你要改什麼 |
|----|------|------------|
| `launch_app` | 啟動 App | 幾乎只靠 `appId` |
| `smoke_home` | 主頁關鍵字可見 | 主頁標題文字 |
| `navigate_settings` | 進設定 | 設定按鈕／標題文字 |
| `search_keyword` | 搜尋 | 搜尋入口、輸入框、結果斷言 |
| `back_to_home` | 返回主頁 | 內頁入口與主頁斷言 |

## 撰寫原則

1. **一個 use case 只驗證一件事**
2. 斷言用使用者看得到的文案，少依賴座標
3. 先 `launchApp`，再操作，最後 `assertVisible`
4. 不穩定畫面加等待：

```yaml
- extendedWaitUntil:
    visible:
      text: "主頁"
    timeout: 10000
```

## 用 Maestro Studio 加速（建議）

手機連上後：

```bash
maestro studio
```

可在視覺介面點元素、產生 YAML，再貼回 `usecases/flows/`。

## 從網頁觸發

- 自動：`config` 裡 `autoRunOnOpen: true` + `autoRunUseCaseId`
- 手動：網頁按「執行」
- API：

```bash
curl -X POST http://127.0.0.1:3780/api/runs \
  -H 'content-type: application/json' \
  -d '{"useCaseId":"launch_app"}'
```
