import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { demoPaymentsEnabled, getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  }

  if (user.plan === "pro") {
    return NextResponse.json({ error: "你已是專業版。" }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ||
    process.env.APP_URL ||
    "http://localhost:3000";

  // Demo / local flow without Stripe keys
  if (demoPaymentsEnabled()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "pro",
        stripeSubId: `demo_sub_${Date.now()}`,
      },
    });
    // Relative path keeps the same host (localhost vs 127.0.0.1) so session cookie stays
    return NextResponse.json({
      mode: "demo",
      url: `/billing/success?demo=1`,
    });
  }

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "尚未設定 Stripe。請在 .env.local 填入金鑰，或開啟 DEMO_PAYMENTS。" },
      { status: 500 },
    );
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  return NextResponse.json({ mode: "stripe", url: session.url });
}
