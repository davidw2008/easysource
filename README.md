# EasySource · 開網頁就測 Android App

用瀏覽器打開一個本機網頁，就能依照 use case 自動測試已安裝在 Android 手機上的 App（Maestro + ADB）。

預設開啟 **Dry Run 模擬模式**，即使這台雲端環境沒有接手機，也可以先把整條流程跑通。

## 快速開始（模擬模式，零裝置）

```bash
npm install
npm start
```

瀏覽器打開 [http://127.0.0.1:3780](http://127.0.0.1:3780)  
預設會自動執行 `launch_app` use case（模擬通過 + log）。

## 真機模式（你已有 App 裝在 Android）

完整步驟見：

- [docs/SETUP.md](docs/SETUP.md) — 從安裝 ADB／Maestro 到開網頁
- [docs/USE_CASES.md](docs/USE_CASES.md) — 怎麼改／新增 use case

最短路徑：

1. 安裝 `adb`、`maestro`，`adb devices` 看到你的手機
2. 複製設定：`cp config/app.example.json config/app.local.json`
3. 填入真實 `appId`，設 `"dryRun": false`
4. 依 App UI 修改 `usecases/flows/*.yaml`
5. `npm start` → 開網頁自動測

## 專案結構

```
config/app.json              預設設定（含 dryRun）
config/app.local.json        本機覆寫（可選，已 gitignore）
usecases/registry.json       use case 清單
usecases/flows/*.yaml        Maestro 測試腳本
server/                      API 與測試執行器
public/                      網頁儀表板
results/                     每次執行的 log／截圖
docs/                        逐步說明
```

## API 摘要

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/config` | 目前 App／自動執行設定 |
| GET | `/api/usecases` | use case 清單 |
| POST | `/api/runs` | `{ "useCaseId": "launch_app" }` 開始測試 |
| GET | `/api/runs/:id` | 查詢狀態、log、截圖 |

## 成本

本機真機 + 開源 Maestro／ADB：**現金成本約為 0**。  
只有改用雲端真機農場或長期雲主機時才會產生費用。

## 檢查環境

```bash
npm run check
```
