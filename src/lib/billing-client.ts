"use client";

import { toast } from "sonner";

async function redirectTo(endpoint: string, failMessage: string) {
  try {
    const res = await fetch(endpoint, { method: "POST" });
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

export function startCheckout() {
  return redirectTo("/api/billing/checkout", "Could not start checkout");
}

export function openBillingPortal() {
  return redirectTo("/api/billing/portal", "Could not open billing portal");
}
