import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const link = await prisma.link.findUnique({ where: { code } });

  if (!link) {
    return NextResponse.redirect(new URL("/?missing=1", req.url));
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/?expired=1", req.url));
  }

  await prisma.$transaction([
    prisma.link.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    }),
    prisma.clickLog.create({
      data: {
        linkId: link.id,
        referer: req.headers.get("referer")?.slice(0, 500) || null,
        userAgent: req.headers.get("user-agent")?.slice(0, 500) || null,
      },
    }),
  ]);

  return NextResponse.redirect(link.url, { status: 302 });
}
