import { customAlphabet } from "nanoid";
import { prisma } from "./prisma";
import { getPlan } from "./plans";

const generateCode = customAlphabet(
  "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  7,
);

const CODE_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

export function isValidCode(code: string) {
  return CODE_REGEX.test(code);
}

export function isValidUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function countLinksThisMonth(userId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  return prisma.link.count({
    where: {
      userId,
      createdAt: { gte: start },
    },
  });
}

export async function createShortLink(input: {
  url: string;
  userId: string;
  plan: string;
  customCode?: string;
  title?: string;
}) {
  const plan = getPlan(input.plan);
  const used = await countLinksThisMonth(input.userId);

  if (used >= plan.monthlyLinkLimit) {
    return {
      ok: false as const,
      error: `基本版每月上限 ${plan.monthlyLinkLimit} 條。升級專業版即可無限建立。`,
      code: "LIMIT" as const,
    };
  }

  if (!isValidUrl(input.url)) {
    return { ok: false as const, error: "請輸入有效的 http(s) 網址。", code: "URL" as const };
  }

  let code = input.customCode?.trim();
  let isCustom = false;

  if (code) {
    if (!plan.allowCustomAlias) {
      return {
        ok: false as const,
        error: "自訂短碼只限專業版。",
        code: "PLAN" as const,
      };
    }
    if (!isValidCode(code)) {
      return {
        ok: false as const,
        error: "短碼需為 3–32 位英數、底線或連字號。",
        code: "CODE" as const,
      };
    }
    const exists = await prisma.link.findUnique({ where: { code } });
    if (exists) {
      return { ok: false as const, error: "此短碼已被使用。", code: "TAKEN" as const };
    }
    isCustom = true;
  } else {
    for (let i = 0; i < 8; i += 1) {
      const candidate = generateCode();
      const exists = await prisma.link.findUnique({ where: { code: candidate } });
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return { ok: false as const, error: "暫時無法產生短碼，請再試。", code: "GEN" as const };
    }
  }

  const expiresAt =
    plan.linkExpiryDays == null
      ? null
      : new Date(Date.now() + plan.linkExpiryDays * 24 * 60 * 60 * 1000);

  const link = await prisma.link.create({
    data: {
      code,
      url: input.url,
      title: input.title?.trim() || null,
      isCustom,
      expiresAt,
      userId: input.userId,
    },
  });

  return { ok: true as const, link };
}
