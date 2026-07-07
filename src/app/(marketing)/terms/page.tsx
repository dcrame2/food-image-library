import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Cutout Aura.",
};

const UPDATED = "July 6, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
        <section>
          <h2>1. The service</h2>
          <p className="mt-2">
            Cutout Aura lets you find images on the web, remove their
            backgrounds, and keep the results in a personal library. By creating
            an account you agree to these terms. If you do not agree, do not use
            the service.
          </p>
        </section>

        <section>
          <h2>2. Your account</h2>
          <p className="mt-2">
            You are responsible for your account and for keeping your sign-in
            method secure. You must provide accurate information and be at least
            13 years old. We may suspend accounts that abuse the service,
            attempt to circumvent usage limits, or violate these terms.
          </p>
        </section>

        <section>
          <h2>3. Your content and third-party images</h2>
          <p className="mt-2">
            You choose the images you add to your library. Cutout Aura does
            not grant you any rights to third-party images. You are solely
            responsible for making sure you have the right to use, modify, and
            publish any image you process through the service. The starter
            library is provided for convenience and without any warranty of
            fitness for commercial use.
          </p>
        </section>

        <section>
          <h2>4. Plans, billing, and cancellation</h2>
          <p className="mt-2">
            The Free plan includes a monthly allowance of background removals.
            Pro is a monthly subscription billed through Stripe. You can cancel
            anytime from Settings; Pro stays active until the end of the current
            billing period. Fees already paid are non-refundable except where
            required by law. We may change prices with reasonable advance
            notice.
          </p>
        </section>

        <section>
          <h2>5. Acceptable use</h2>
          <p className="mt-2">
            Do not use the service to process unlawful content, infringe
            intellectual property, harass others, or attempt to disrupt or
            reverse engineer the service. Automated scraping of the service is
            not allowed.
          </p>
        </section>

        <section>
          <h2>6. Termination</h2>
          <p className="mt-2">
            You can delete your account at any time from Settings, which removes
            your library and cancels any active subscription immediately. We may
            terminate or suspend access for violations of these terms.
          </p>
        </section>

        <section>
          <h2>7. Disclaimers and liability</h2>
          <p className="mt-2">
            The service is provided as is, without warranties of any kind. To
            the maximum extent permitted by law, Cutout Aura is not liable
            for indirect, incidental, or consequential damages, and our total
            liability is limited to the amount you paid us in the twelve months
            before the claim.
          </p>
        </section>

        <section>
          <h2>8. Changes</h2>
          <p className="mt-2">
            We may update these terms from time to time. Material changes will
            be announced in the app or by email. Continuing to use the service
            after changes take effect means you accept the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
