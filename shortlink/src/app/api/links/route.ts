import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { countLinksThisMonth, createShortLink } from "@/lib/links";
import { getPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  const [links, usedThisMonth] = await Promise.all([
    prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    countLinksThisMonth(user.id),
  ]);

  const plan = getPlan(user.plan);
  return NextResponse.json({
    links,
    usage: {
      usedThisMonth,
      limit: plan.monthlyLinkLimit === Infinity ? null : plan.monthlyLinkLimit,
      plan: user.plan,
    },
  });
}

const createSchema = z.object({
  url: z.string().url(),
  customCode: z.string().optional(),
  title: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const result = await createShortLink({
      url: body.url,
      userId: user.id,
      plan: user.plan,
      customCode: body.customCode,
      title: body.title,
    });

    if (!result.ok) {
      const status = result.code === "LIMIT" || result.code === "PLAN" ? 402 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({ link: result.link }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "請輸入有效網址。" }, { status: 400 });
    }
    return NextResponse.json({ error: "建立失敗，請稍後再試。" }, { status: 500 });
  }
}
