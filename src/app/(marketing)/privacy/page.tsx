import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Cutout Aura collects, uses, and protects your data.",
};

const UPDATED = "July 6, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
        <section>
          <h2>1. What we collect</h2>
          <p className="mt-2">
            Account data: your email address and, if you sign in with Google,
            your name and avatar from your Google profile. Content data: the
            images you add, their names, categories, and tags. Usage data: how
            many background removals you run each month, for enforcing plan
            limits. Billing data: handled by Stripe; we store your subscription
            status but never your card details.
          </p>
        </section>

        <section>
          <h2>2. How we use it</h2>
          <p className="mt-2">
            To run the service: authenticate you, store your library, enforce
            plan limits, and process payments. We do not sell your data or use
            it for advertising.
          </p>
        </section>

        <section>
          <h2>3. Where it lives</h2>
          <p className="mt-2">
            Your data is stored with Supabase (database, authentication, and
            file storage). Payments run through Stripe. Image searches are
            processed through a search provider; background removal for premium
            cutouts is processed by remove.bg. Each provider handles data under
            its own privacy policy.
          </p>
        </section>

        <section>
          <h2>4. Cookies</h2>
          <p className="mt-2">
            We use only the cookies required to keep you signed in. No tracking
            or advertising cookies.
          </p>
        </section>

        <section>
          <h2>5. Your rights</h2>
          <p className="mt-2">
            You can export your cutouts anytime with zip export. Deleting your
            account from Settings permanently removes your library, your
            account data, and cancels billing. For any other request, contact
            us and we will help.
          </p>
        </section>

        <section>
          <h2>6. Changes</h2>
          <p className="mt-2">
            If this policy changes materially, we will announce it in the app
            or by email before the change takes effect.
          </p>
        </section>
      </div>
    </div>
  );
}
