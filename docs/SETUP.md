# 逐步設定說明（本機真機）

這份文件教你從零把「開網頁就自動測 Android App」跑起來。

## 你會得到什麼

1. 用瀏覽器打開 `http://127.0.0.1:3780`
2. 頁面可自動（或手動）依 use case 測試已安裝的 App
3. 看到即時 log、通過／失敗、截圖

---

## 第 0 步：前置條件

- 一台電腦（macOS / Linux / Windows + WSL 或 Git Bash）
- 已安裝 Node.js 18+
- 一部已開啟「開發人員選項 → USB 偵錯」的 Android 手機
- App 已安裝在該手機上（你知道它的 package name / appId）

---

## 第 1 步：安裝 ADB

### macOS（Homebrew）

```bash
brew install android-platform-tools
adb version
```

### Linux（Debian/Ubuntu）

```bash
sudo apt-get update
sudo apt-get install -y android-tools-adb
adb version
```

### Windows

1. 下載 [Android platform-tools](https://developer.android.com/tools/releases/platform-tools)
2. 解壓並把資料夾加入 PATH
3. 開新終端機執行 `adb version`

用 USB 接上手機，允許偵錯授權後：

```bash
adb devices
```

應看到類似：

```
List of devices attached
XXXXXXXX    device
```

狀態必須是 `device`（不是 `unauthorized`）。

---

## 第 2 步：安裝 Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
maestro --version
```

若指令找不到，把 Maestro 的安裝路徑加進 PATH（安裝腳本結束時會提示）。

---

## 第 3 步：安裝本專案依賴

在專案根目錄：

```bash
npm install
npm run check
```

`npm run check` 會檢查 `adb`、`maestro`、已連線裝置。

---

## 第 4 步：設定你的 App

複製範例設定（可選本機覆寫檔，避免改到 git 追蹤的檔）：

```bash
cp config/app.example.json config/app.local.json
```

編輯 `config/app.local.json`：

```json
{
  "appName": "我的 App",
  "appId": "com.your.company.app",
  "deviceSerial": "",
  "autoRunOnOpen": true,
  "autoRunUseCaseId": "launch_app",
  "dryRun": false
}
```

重點欄位：

| 欄位 | 意思 |
|------|------|
| `appId` | Android 套件名，例如 `com.example.app` |
| `autoRunOnOpen` | `true` = 一開網頁就自動跑指定 use case |
| `autoRunUseCaseId` | 自動跑哪一個 use case |
| `dryRun` | `true` = 不碰真機，只模擬；真機測試請設 `false` |
| `deviceSerial` | 多部裝置時填序列號；一部可留空 |

如何查 appId：

```bash
adb shell pm list packages | grep -i yourkeyword
```

或從 APK／Android Studio 的 `applicationId` 取得。

---

## 第 5 步：依真實 UI 改 use case

範本在：

- 清單：`usecases/registry.json`
- 流程：`usecases/flows/*.yaml`

Maestro 腳本是依畫面上的**文字**或 **id** 操作。請打開 App，把範本裡的：

- `Home|主頁|首頁`
- `Settings|設定`
- `Search|搜尋`

改成你 App 真正看得到的字。

新增一個 use case 的最短做法：

1. 在 `usecases/flows/` 新增 `my_flow.yaml`
2. 在 `registry.json` 加一筆 `id` / `title` / `flow`
3. 重新整理網頁即可看到

YAML 範例：

```yaml
appId: com.your.company.app
---
- launchApp
- tapOn: "登入"
- inputText: "demo@example.com"
- tapOn: "下一步"
- assertVisible: "歡迎"
```

官方語法參考：https://docs.maestro.dev

---

## 第 6 步：啟動網頁工具

```bash
npm start
```

瀏覽器打開：

```
http://127.0.0.1:3780
```

若 `autoRunOnOpen: true`，頁面載入後會自動執行 `autoRunUseCaseId`。

你也可以在左側清單按「執行」。

---

## 第 7 步：判讀結果

- 狀態：**通過** / **失敗**
- 下方黑色區塊：即時 log
- 若有截圖會顯示在 log 下方
- 每次執行也會寫入 `results/<run-id>/`

---

## 常見問題

### 1. `adb devices` 是空的

- 換線／換 USB 口
- 手機重新允許 USB 偵錯
- 某些手機要選「檔案傳輸」模式

### 2. Maestro 說找不到元素

- 畫面文字與 YAML 不一致（最常見）
- 動畫太慢：加 `extendedWaitUntil`
- 元素在 WebView／Compose 內：改用更精準的 `id` 或階層選擇器

### 3. 想先不接手機試網頁

保持：

```json
"dryRun": true
```

即可開網頁看自動執行流程。

### 4. 無線 ADB

```bash
adb tcpip 5555
adb connect 手機IP:5555
adb devices
```

之後可拔掉線，後端仍可測。

---

## 建議落地順序

1. `dryRun: true` 先確認網頁與 API
2. 接真機，只改通 `launch_app`
3. 再逐個改 smoke／搜尋／設定
4. 最後打開 `autoRunOnOpen`，做到「開網頁就測」
