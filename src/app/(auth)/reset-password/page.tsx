"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

/**
 * Landing page for the password-recovery email. The /auth/callback route has
 * already exchanged the recovery code for a session by the time we get here,
 * so all that's left is setting the new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<"checking" | "ok" | "missing">("checking");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setSessionState(data.user ? "ok" : "missing"))
      .catch(() => setSessionState("missing"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
  }

  return (
    <div className="checkered-bg flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background/90 p-8 shadow-2xl backdrop-blur sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex text-lg">
              <Logo markClassName="h-7 w-7" />
            </Link>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              {done ? "Password updated" : "Choose a new password"}
            </h1>
          </div>

          {sessionState === "checking" ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessionState === "missing" ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                That reset link did not work or has expired. Request a new one
                from the sign-in page.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You are signed in with your new password.
              </p>
              <button
                type="button"
                onClick={() => {
                  router.push("/app");
                  router.refresh();
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Check className="h-4 w-4" />
                Open your library
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input
                type="password"
                required
                minLength={6}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (6+ characters)"
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Set new password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
