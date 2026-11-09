import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "電郵或密碼不正確。" }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({
      user: { id: user.id, email: user.email, plan: user.plan },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "請檢查登入資料。" }, { status: 400 });
    }
    return NextResponse.json({ error: "登入失敗，請稍後再試。" }, { status: 500 });
  }
}
