"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, CreditCard, Loader2 } from "lucide-react";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) router.replace("/dashboard");
      })
      .catch(() => {});
  }, [router]);

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password || password.length < (mode === "register" ? 8 : 1)) {
      newErrors.password =
        mode === "register"
          ? "Password must be at least 8 characters"
          : "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || "Something went wrong" });
        return;
      }

      setSuccess(true);
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      setTimeout(() => router.push("/dashboard"), 800);
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="SubscriptionSavvy Logo"
            width={48}
            height={48}
            className="rounded-2xl mb-3"
          />
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            SubscriptionSavvy
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {mode === "login" ? "Sign in to your account" : "Create your free account"}
          </p>
        </div>

        <div className="card">
          {/* Mode toggle */}
          <div
            className="flex rounded-lg p-1 mb-6"
            style={{ backgroundColor: "var(--tag-bg)" }}
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}); }}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer"
                style={
                  mode === m
                    ? { backgroundColor: "var(--card)", color: "var(--primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                style={errors.email ? { borderColor: "var(--warning)" } : {}}
                disabled={loading || success}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: "var(--warning)" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                Password
                {mode === "register" && (
                  <span className="font-normal ml-1" style={{ color: "var(--text-secondary)" }}>
                    (min. 8 characters)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  style={errors.password ? { borderColor: "var(--warning)" } : {}}
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: "var(--warning)" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Form error */}
            {errors.form && (
              <div
                className="mb-4 p-3 rounded-lg text-sm"
                style={{ backgroundColor: "rgba(224, 92, 92, 0.1)", color: "var(--warning)" }}
              >
                {errors.form}
              </div>
            )}

            {/* Success state */}
            {success && (
              <div
                className="mb-4 p-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "rgba(46, 204, 122, 0.1)", color: "var(--success)" }}
              >
                {mode === "login" ? "Welcome back! Redirecting..." : "Account created! Redirecting..."}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
          By continuing, you agree to our{" "}
          <span style={{ color: "var(--primary)" }}>Terms of Service</span>
        </p>
      </div>
    </div>
  );
}
