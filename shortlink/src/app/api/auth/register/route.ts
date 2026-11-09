import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(60).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "此電郵已被註冊。" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name?.trim() || null,
        passwordHash: await hashPassword(body.password),
        plan: "free",
      },
    });

    await createSession(user.id);
    return NextResponse.json({
      user: { id: user.id, email: user.email, plan: user.plan },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "請檢查電郵與密碼格式。" }, { status: 400 });
    }
    return NextResponse.json({ error: "註冊失敗，請稍後再試。" }, { status: 500 });
  }
}
