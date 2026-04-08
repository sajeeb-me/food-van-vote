"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Logo from '../../public/logo.png';
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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

    if (mode === "sign_in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ text: error.message, ok: false });
      } else {
        // redirect to vote page
        router.push("/vote");
      }
    }

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
    <main className="min-h-screen flex items-center justify-center px-4 bg-(--bg)">
      <div className="w-full max-w-sm">

        {/* Logo + Title */}
        <div className="mb-8 text-center">
          <Image src={Logo} alt="FoodVan Vote" width={82} height={82} className="mx-auto" />
          <h1 className="text-2xl font-semibold" style={{ color: "var(--textBase)" }}>
            FoodVan Vote
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Sign in with your work email
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 bg-(--surface) border border-(--border)"
        >
          {/* Toggle */}
          <div className="flex mb-6 border rounded-lg overflow-hidden">
            {(["sign_in", "sign_up"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setMessage(null);
                }}
                className={`flex-1 py-2 text-sm font-medium ${mode === m ? "bg-(--primary) text-white" : "transparent text-(--muted)"} transition-colors`}
              >
                {m === "sign_in" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="text-sm mb-1 block" style={{ color: "var(--textMuted)" }}>
                Email
              </label>
              <input
                type="email"
                required
                placeholder={`you@${COMPANY_DOMAIN}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border outline-none"
                style={{
                  borderColor: "var(--border)",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm mb-1 block" style={{ color: "var(--textMuted)" }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border outline-none"
                style={{
                  borderColor: "var(--border)",
                }}
              />
            </div>

            {/* Message */}
            {message && (
              <p
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  background: message.ok ? "#ecfdf5" : "#fef2f2",
                  color: message.ok ? "#16a34a" : "#dc2626",
                  border: `1px solid ${message.ok ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                {message.text}
              </p>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2"
              style={{
                background: "var(--primary)",
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "sign_in" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-xs text-center mt-4" style={{ color: "var(--muted)" }}>
          Only {COMPANY_DOMAIN} accounts allowed
        </p>
      </div>
    </main>
  );
}
