export type PlanId = "free" | "pro";

export interface Plan {
  id: PlanId;
  label: string;
  cutoutsPerMonth: number;
  /** Engines this plan may run. "skip" adds are always allowed and unmetered. */
  engines: readonly ("remove-bg" | "imgly" | "skip")[];
  priceMonthly: number;
  /** Total billed per year on the annual plan (0 = no annual option). */
  priceYearly: number;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    cutoutsPerMonth: 10,
    engines: ["remove-bg", "imgly", "skip"],
    priceMonthly: 0,
    priceYearly: 0,
  },
  pro: {
    id: "pro",
    label: "Pro",
    cutoutsPerMonth: 300,
    engines: ["remove-bg", "imgly", "skip"],
    priceMonthly: 9,
    priceYearly: 60,
  },
};

export type BillingInterval = "month" | "year";

export function currentQuotaMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
