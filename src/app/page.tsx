"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, UtensilsCrossed } from "lucide-react";

const COMPANY_DOMAIN = "gmail.com"; // ← change to your actual domain

type Mode = "sign_in" | "sign_up";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  );

  function validateDomain(e: string) {
    return e.toLowerCase().endsWith(`@${COMPANY_DOMAIN}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!validateDomain(email)) {
      setMessage({
        text: `Only @${COMPANY_DOMAIN} email addresses are allowed.`,
        ok: false,
      });
      return;
    }

    setLoading(true);

    if (mode === "sign_up") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ text: error.message, ok: false });
      } else {
        setMessage({
          text: "Check your email for a confirmation link.",
          ok: true,
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage({ text: error.message, ok: false });
      }
      // Middleware handles redirect on success
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, #2a1f0a 0%, var(--bg) 60%)" }}>

      {/* Decorative top bar */}
      <div className="fixed top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--amber), transparent)" }} />

      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--amber)", boxShadow: "0 0 32px color-mix(in srgb, var(--amber) 40%, transparent)" }}>
            <UtensilsCrossed size={26} color="#0f0d0b" strokeWidth={2.2} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black" style={{ color: "var(--cream)", letterSpacing: "-0.02em" }}>
              FoodVan Vote
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Company employees only
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-7">
          {/* Mode toggle */}
          <div className="flex rounded-xl p-1 mb-6 gap-1"
            style={{ background: "var(--surface-2)" }}>
            {(["sign_in", "sign_up"] as Mode[]).map((m) => (
              <button key={m}
                onClick={() => { setMode(m); setMessage(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: mode === m ? "var(--surface)" : "transparent",
                  color: mode === m ? "var(--cream)" : "var(--muted)",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.4)" : "none",
                }}>
                {m === "sign_in" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-2 block"
                style={{ color: "var(--muted)" }}>
                Work email
              </label>
              <input
                type="email"
                required
                placeholder={`you@${COMPANY_DOMAIN}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest mb-2 block"
                style={{ color: "var(--muted)" }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>

            {message && (
              <p className="text-sm rounded-xl px-4 py-3"
                style={{
                  background: message.ok
                    ? "color-mix(in srgb, var(--green) 12%, transparent)"
                    : "color-mix(in srgb, var(--red) 12%, transparent)",
                  color: message.ok ? "var(--green)" : "var(--red)",
                  border: `1px solid ${message.ok ? "color-mix(in srgb, var(--green) 25%, transparent)" : "color-mix(in srgb, var(--red) 25%, transparent)"}`,
                }}>
                {message.text}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === "sign_in" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "var(--muted)" }}>
          Access restricted to {COMPANY_DOMAIN} accounts
        </p>
      </div>
    </main>
  );
}
