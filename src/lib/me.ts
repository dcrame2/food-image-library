import type { PlanId } from "@/lib/plans";

/** Shape returned by GET /api/me. */
export interface Me {
  email: string | null;
  plan: PlanId;
  used: number;
  limit: number;
  removeBgConfigured: boolean;
  searchConfigured: boolean;
}
