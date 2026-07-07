import "server-only";

import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    // No explicit apiVersion: the SDK pins the version it ships with.
    cached = new Stripe(key);
  }
  return cached;
}
