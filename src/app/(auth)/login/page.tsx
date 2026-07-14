"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.19 7.19 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  const [mode, setMode] = useState<"signin" | "signup" | "reset">(
    searchParams.get("mode") === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  // The auth callback redirects here with ?error=auth when a link is expired
  // or was opened in a different browser than the one that requested it.
  const [error, setError] = useState<string | null>(() =>
    searchParams.get("error") === "auth"
      ? "That link did not work or has expired. Sign in below, or create your account again."
      : null,
  );
  const [notice, setNotice] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);
    setBusy("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // Always show Google's account chooser so users can pick a different
        // account instead of being silently re-signed into the last one.
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setError(error.message);
      setBusy(null);
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy("email");
    const supabase = createClient();

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) setError(error.message);
      else setNotice("Check your email for a link to reset your password.");
      setBusy(null);
      return;
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(null);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(error.message);
        setBusy(null);
        return;
      }
      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setNotice("Check your email to confirm your account, then sign in.");
        setBusy(null);
      }
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex text-lg">
          <Logo markClassName="h-7 w-7" />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {mode === "signin"
            ? "Welcome back"
            : mode === "signup"
              ? "Create your library"
              : "Reset your password"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to open your library."
            : mode === "signup"
              ? "Free to start. No card required."
              : "Enter your email and we will send you a reset link."}
        </p>
      </div>

      {mode !== "reset" && (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-muted/60 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
          >
            {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-muted" />
            or
            <div className="h-px flex-1 bg-muted" />
          </div>
        </>
      )}

      <form onSubmit={submitEmail} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary"
        />
        {mode !== "reset" && (
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Password (6+ characters)" : "Password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary"
          />
        )}

        {mode === "signin" && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setError(null);
                setNotice(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && <p className="text-sm text-primary">{notice}</p>}

        <button
          type="submit"
          disabled={busy !== null}
          className={clsx(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
          )}
        >
          {busy === "email" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {mode === "signin"
            ? "Sign in with email"
            : mode === "signup"
              ? "Sign up with email"
              : "Email me a reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New here?" : mode === "signup" ? "Already have an account?" : ""}{" "}
        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
            setNotice(null);
          }}
          className="font-medium text-primary hover:underline"
        >
          {mode === "signin" ? "Create an account" : mode === "signup" ? "Sign in" : "Back to sign in"}
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="checkered-bg flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background/90 p-8 shadow-2xl backdrop-blur sm:p-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
