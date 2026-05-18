"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Zap, TrendingUp, Shield, CreditCard } from "lucide-react";

type AuthMode = "login" | "register";

const FEATURES = [
  { icon: TrendingUp, text: "Track all subscriptions in one place" },
  { icon: Shield,     text: "Bank-grade security with Supabase" },
  { icon: Zap,        text: "Smart alerts before payments hit" },
  { icon: CreditCard, text: "Multi-currency with live exchange rates" },
];

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        });
        if (error) throw error;
        setSuccess("Check your email for a confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) { setError("Enter your email first"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess("Magic link sent! Check your inbox.");
  }

  return (
    <div className="min-h-screen bg-base flex overflow-hidden">
      {/* Left — Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] p-16 relative overflow-hidden">
        {/* Background orbs */}
        <div
          className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full animate-breathe"
          style={{ background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-80px] right-[-60px] w-[400px] h-[400px] rounded-full animate-breathe"
          style={{ background: "radial-gradient(circle, rgba(42,157,143,0.1) 0%, transparent 70%)", animationDelay: "4s" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber flex items-center justify-center">
              <CreditCard size={20} color="#000" />
            </div>
            <span className="text-xl font-bold text-text tracking-tight">SubscriptionSavvy</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-display text-text leading-none mb-4">
              Never miss a<br />
              <span style={{ color: "#0D7377" }}>payment again.</span>
            </h1>
            <p className="text-muted text-lg max-w-sm leading-relaxed">
              The intelligent subscription tracker that keeps your finances sharp and your mind clear.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(13,115,119,0.2)" }}
                >
                  <f.icon size={16} color="#0D7377" />
                </div>
                <span className="text-muted text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Floating mini-stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card p-5 max-w-xs"
          >
            <div className="flex items-end gap-2 mb-1">
              <span className="numeric-display text-3xl">₹2,847</span>
              <span className="text-muted text-sm mb-1">/mo saved</span>
            </div>
            <p className="text-muted text-xs">by cancelling unused subs · avg user</p>
            <div className="mt-3 flex gap-2">
              {["Netflix", "Spotify", "iCloud+"].map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(13,115,119,0.1)", color: "#0D7377", border: "1px solid rgba(13,115,119,0.2)" }}>{s}</span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-muted text-xs">© 2025 SubscriptionSavvy</div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-amber flex items-center justify-center">
              <CreditCard size={18} color="#000" />
            </div>
            <span className="text-lg font-bold">SubscriptionSavvy</span>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: "var(--color-surface)" }}>
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  background: mode === m ? "var(--color-amber)" : "transparent",
                  color: mode === m ? "#000" : "var(--color-muted)",
                }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text">
              {mode === "login" ? "Welcome back" : "Get started free"}
            </h2>
            <p className="text-muted text-sm mt-1">
              {mode === "login"
                ? "Sign in to your dashboard"
                : "No credit card required · Forever free"}
            </p>
          </div>

          {/* Error / Success */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3 rounded-xl text-sm font-medium"
                style={{
                  background: error ? "rgba(248,81,73,0.1)" : "rgba(63,185,80,0.1)",
                  border: `1px solid ${error ? "rgba(248,81,73,0.3)" : "rgba(63,185,80,0.3)"}`,
                  color: error ? "#F85149" : "#3FB950",
                }}
              >
                {error || success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Display Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="display-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="input pl-10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="auth-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="auth-submit"
              className="btn btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  {mode === "login" ? "Signing in…" : "Creating account…"}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            <span className="text-muted text-xs">OR</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          </div>

          <button
            onClick={handleMagicLink}
            id="magic-link-btn"
            disabled={loading}
            className="btn btn-secondary w-full justify-center py-2.5 text-sm"
          >
            <Zap size={15} className="text-amber" />
            Sign in with Magic Link
          </button>

          <p className="text-center text-muted text-xs mt-6">
            By continuing, you agree to our{" "}
            <span className="text-amber cursor-pointer hover:underline">Terms</span> and{" "}
            <span className="text-amber cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
