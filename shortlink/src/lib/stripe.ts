import Stripe from "stripe";
import { PLANS } from "./plans";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function demoPaymentsEnabled() {
  return process.env.DEMO_PAYMENTS === "true" || !process.env.STRIPE_SECRET_KEY;
}

export function getProPriceLabel() {
  return `HK$${PLANS.pro.priceMonthlyHkd}/月`;
}
