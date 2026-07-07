import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { PLANS, type Plan } from "@/lib/plans";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/**
 * Web plan from stripe_subscriptions. Fully separate from the mobile app's
 * RevenueCat pro_until field.
 */
export async function getWebPlan(userId: string): Promise<Plan> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stripe_subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || !data.status || !ACTIVE_STATUSES.has(data.status)) {
    return PLANS.free;
  }
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
    return PLANS.free;
  }
  return PLANS.pro;
}

/**
 * Find the user's Stripe customer id, creating the customer (and the
 * stripe_subscriptions row that anchors it) on first use.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | undefined,
): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stripe_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.stripe_customer_id) return data.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  const { error } = await admin.from("stripe_subscriptions").upsert(
    { user_id: userId, stripe_customer_id: customer.id },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`Failed to store Stripe customer: ${error.message}`);

  return customer.id;
}
