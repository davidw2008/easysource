# EaseLink — 短連結 SaaS（基本版 + 付款版）

Next.js + Prisma (SQLite) + Stripe（可 Demo）短連結服務。

## 功能對照

| | 基本版 Free | 專業版 Pro |
|---|---|---|
| 每月連結數 | 10 | 無限 |
| 短碼 | 系統隨機 | 可自訂 |
| 過期 | 30 日 | 永不過期 |
| 點擊統計 | 有（總數） | 有（含來源紀錄） |
| 價格 | HK$0 | HK$68/月 |

## 本地啟動

```bash
cd shortlink
cp .env.local.example .env.local   # 或沿用現有 .env.local
npm install
npx prisma migrate dev
npm run dev
```

開 [http://localhost:3000](http://localhost:3000)

## 付款流程

1. 註冊 → 預設 `plan=free`
2. `/pricing` 按「升級並付款」→ `POST /api/billing/checkout`
3. **Demo 模式**（預設 `DEMO_PAYMENTS=true`）：即時升 `pro`，跳去成功頁
4. **正式 Stripe**：設好 `STRIPE_*` 後關閉 Demo，會跳 Stripe Checkout；Webhook `/api/billing/webhook` 寫入訂閱狀態

### Stripe 環境變數

```env
DEMO_PAYMENTS=false
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
APP_URL=https://your-domain.com
```

## 主要路由

- `/` 首頁
- `/register` `/login` 帳號
- `/dashboard` 建立／管理短連結
- `/pricing` 方案與升級
- `/l/[code]` 短連結跳轉
- `/billing/success` 付款成功

## 之後可加

- 自訂網域、QR Code、團隊空間、API Key、防惡意連結掃描
