# 逐步整出嚟（跟住做）

呢份係「由零到開網頁自動測 App」嘅操作清單。詳細指令睇 [SETUP.md](./SETUP.md)。

## 階段 A：先喺電腦睇到網頁工具（唔使手機）

1. 進入專案目錄，執行 `npm install`
2. 確認 `config/app.json` 入面 `dryRun` 係 `true`
3. 執行 `npm start`
4. 開瀏覽器去 `http://127.0.0.1:3780`
5. 應該會自動跑「啟動 App」模擬測試，log 顯示 PASSED

做到呢步，代表網頁 + API + use case 清單已經通。

## 階段 B：接真機

1. 手機開「開發人員選項 → USB 偵錯」
2. 電腦安裝 `adb`，執行 `adb devices` 見到 `device`
3. 安裝 Maestro：`curl -Ls "https://get.maestro.mobile.dev" | bash`
4. 複製設定：`cp config/app.example.json config/app.local.json`
5. 改 `appId` 做你 App 嘅套件名
6. 設 `"dryRun": false`
7. 重開 `npm start`，再開網頁

若失敗，多數係：未授權 USB 偵錯、`appId` 錯、或者 YAML 入面嘅畫面文字同真實 UI 唔夾。

## 階段 C：整合你嘅 use case

1. 打開 App，記低主頁／設定／搜尋掣嘅真實文字
2. 改 `usecases/flows/*.yaml` 對應文字
3. 想加新場景：新 YAML + 喺 `registry.json` 加一筆
4. 用 Maestro Studio 可以更快：`maestro studio`
5. 網頁撳「執行」驗證每一個 use case

## 階段 D：做到「一開網頁就測」

喺 `config/app.local.json`：

```json
{
  "autoRunOnOpen": true,
  "autoRunUseCaseId": "launch_app"
}
```

之後每次開 `http://127.0.0.1:3780` 就會自動跑指定 use case。

想改做一開就跑「主頁煙霧測試」，把 `autoRunUseCaseId` 改成 `smoke_home` 即可。

## 建議順序

`launch_app` → `smoke_home` → `navigate_settings` / `search_keyword` → 先開 auto-run

唔好一開始就寫好複雜流程；每個 use case 只驗證一件事會穩好多。
