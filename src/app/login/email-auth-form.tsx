"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Field, inputClass } from "@/components/ui/field";
import { LoginSuccess } from "./login-success";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function EmailAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<Mode | null>(null);

  const enterApp = useCallback(() => {
    router.push("/");
    router.refresh();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        // The DB trigger reads full_name to create the profile row.
        options: { data: { full_name: name.trim() } },
      });
      setPending(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      // If email confirmation is ON in Supabase, there's no session yet.
      if (!data.session) {
        toast.success("Check your email to confirm your account, then sign in.");
        setMode("signin");
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setPending(false);
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Wrong email or password."
            : signInError.message,
        );
        return;
      }
    }

    // Signed in — play the little celebration, then open the book.
    setCelebrating(mode);
  }

  return (
    <div className="text-left">
      <AnimatePresence>
        {celebrating && <LoginSuccess mode={celebrating} onDone={enterApp} />}
      </AnimatePresence>

      {/* Mode switch */}
      <div
        className="mx-auto flex w-fit rounded-full bg-sand p-1"
        role="tablist"
        aria-label="Sign in or create account"
      >
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors",
              mode === m ? "bg-card text-ink shadow-soft" : "text-stone",
            )}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field label="Your name" htmlFor="auth-name">
            <input
              id="auth-name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kiki"
              autoComplete="name"
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Email" htmlFor="auth-email">
          <input
            id="auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClass}
          />
        </Field>
        <Field label="Password" htmlFor="auth-password">
          <input
            id="auth-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || celebrating !== null}
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium text-paper shadow-soft transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}