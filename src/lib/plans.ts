export type PlanId = "free" | "pro";

export interface Plan {
  id: PlanId;
  label: string;
  cutoutsPerMonth: number;
  /** Engines this plan may run. "skip" adds are always allowed and unmetered. */
  engines: readonly ("remove-bg" | "imgly" | "skip")[];
  priceMonthly: number;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    cutoutsPerMonth: 10,
    engines: ["remove-bg", "imgly", "skip"],
    priceMonthly: 0,
  },
  pro: {
    id: "pro",
    label: "Pro",
    cutoutsPerMonth: 300,
    engines: ["remove-bg", "imgly", "skip"],
    priceMonthly: 9,
  },
};

export function currentQuotaMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
