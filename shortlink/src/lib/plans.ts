export type PlanId = "free" | "pro";

export const PLANS = {
  free: {
    id: "free" as const,
    name: "基本版",
    nameEn: "Free",
    priceMonthlyHkd: 0,
    monthlyLinkLimit: 10,
    allowCustomAlias: false,
    linkExpiryDays: 30,
    analyticsDays: 7,
    features: [
      "每月最多 10 條短連結",
      "系統隨機短碼",
      "連結 30 日後過期",
      "近 7 日點擊總數",
    ],
  },
  pro: {
    id: "pro" as const,
    name: "專業版",
    nameEn: "Pro",
    priceMonthlyHkd: 68,
    monthlyLinkLimit: Infinity,
    allowCustomAlias: true,
    linkExpiryDays: null as number | null,
    analyticsDays: 365,
    features: [
      "無限短連結",
      "自訂短碼（例如 /l/promo）",
      "連結永不過期",
      "一年點擊紀錄與來源",
      "優先客服支援",
    ],
  },
} as const;

export function getPlan(plan: string) {
  return plan === "pro" ? PLANS.pro : PLANS.free;
}

export function isPro(plan: string) {
  return plan === "pro";
}
