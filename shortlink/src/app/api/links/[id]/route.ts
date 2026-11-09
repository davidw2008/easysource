import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  const { id } = await context.params;
  const link = await prisma.link.findFirst({ where: { id, userId: user.id } });
  if (!link) {
    return NextResponse.json({ error: "找不到連結。" }, { status: 404 });
  }

  await prisma.link.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
