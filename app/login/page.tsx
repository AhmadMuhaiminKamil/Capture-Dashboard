"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const toEmail = (u: string) => `${u.trim().toLowerCase()}@binding.local`;

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [focusedField, setFocusedField] = useState<"username" | "password" | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
      else setChecking(false);
    });
  }, [router]);

  if (checking) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("Username dan password harus diisi"); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
    setLoading(false);
    if (err) setError("Username atau password salah");
    else router.replace("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0f1e] p-4">

      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-900/10 blur-3xl animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 p-10 shadow-2xl transition-all duration-500 hover:shadow-blue-500/10 hover:-translate-y-1"
        style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(24px)" }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

        {/* Logo/icon */}
        <div className="flex justify-center mb-6">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6l3-3 3 3v6M3 21h18M3 7l9-4 9 4" />
            </svg>
            <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse" style={{ animationDuration: "3s" }} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Capture Dashboard</h1>
          <p className="text-sm text-blue-300/70 mt-1.5">Masuk untuk melanjutkan</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Username field */}
          <div className="group">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: focusedField === "username" ? "#60a5fa" : "rgba(148,163,184,0.8)" }}>
              Username
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                style={{ color: focusedField === "username" ? "#60a5fa" : "rgba(100,116,139,0.8)" }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                placeholder="admin"
                autoFocus
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300"
                style={{
                  background: focusedField === "username" ? "rgba(59,130,246,0.08)" : "rgba(30,41,59,0.6)",
                  border: focusedField === "username" ? "1px solid rgba(96,165,250,0.5)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: focusedField === "username" ? "0 0 0 3px rgba(59,130,246,0.12)" : "none",
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="group">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: focusedField === "password" ? "#60a5fa" : "rgba(148,163,184,0.8)" }}>
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
                style={{ color: focusedField === "password" ? "#60a5fa" : "rgba(100,116,139,0.8)" }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300"
                style={{
                  background: focusedField === "password" ? "rgba(59,130,246,0.08)" : "rgba(30,41,59,0.6)",
                  border: focusedField === "password" ? "1px solid rgba(96,165,250,0.5)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: focusedField === "password" ? "0 0 0 3px rgba(59,130,246,0.12)" : "none",
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
            {/* Shimmer */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        </form>

      </div>
    </div>
  );
}
