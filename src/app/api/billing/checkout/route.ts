import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateStripeCustomer, getWebPlan } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const plan = await getWebPlan(user.id);
  if (plan.id === "pro") {
    return NextResponse.json({ error: "You are already on Pro" }, { status: 400 });
  }

  // Optional body: { interval: "month" | "year" }. Defaults to monthly.
  let interval: "month" | "year" = "month";
  try {
    const body = await request.json();
    if (body?.interval === "year") interval = "year";
  } catch {
    // No body: keep the monthly default.
  }

  const priceId =
    interval === "year"
      ? process.env.STRIPE_PRICE_PRO_YEARLY
      : process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          interval === "year"
            ? "Yearly billing is not configured"
            : "Billing is not configured",
      },
      { status: 503 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app?checkout=success`,
      cancel_url: `${appUrl}/app`,
      allow_promotion_codes: true,
      // Skip the card field whenever nothing is due now (e.g. a 100%-off
      // "forever" promo code for friends and family). Paying customers still
      // get the card field as normal.
      payment_method_collection: "if_required",
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
