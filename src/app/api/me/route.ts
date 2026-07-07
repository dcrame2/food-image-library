import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWebPlan } from "@/lib/billing";
import { currentQuotaMonth } from "@/lib/plans";
import { isRemoveBgConfigured } from "@/lib/remove-bg";
import { isImageSearchConfigured } from "@/lib/serper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const [plan, usage] = await Promise.all([
    getWebPlan(user.id),
    supabase
      .from("bg_removals")
      .select("web_count")
      .eq("user_id", user.id)
      .eq("month", currentQuotaMonth())
      .maybeSingle(),
  ]);

  return NextResponse.json({
    email: user.email,
    plan: plan.id,
    used: usage.data?.web_count ?? 0,
    limit: plan.cutoutsPerMonth,
    removeBgConfigured: isRemoveBgConfigured(),
    searchConfigured: isImageSearchConfigured(),
  });
}
