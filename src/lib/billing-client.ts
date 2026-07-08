"use client";

import { toast } from "sonner";

async function redirectTo(
  endpoint: string,
  failMessage: string,
  body?: Record<string, unknown>,
) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      ...(body
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        : {}),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      toast.error(data.error ?? failMessage);
      return;
    }
    window.location.href = data.url;
  } catch {
    toast.error(failMessage);
  }
}

export function startCheckout(interval: "month" | "year" = "month") {
  return redirectTo("/api/billing/checkout", "Could not start checkout", { interval });
}

export function openBillingPortal() {
  return redirectTo("/api/billing/portal", "Could not open billing portal");
}
