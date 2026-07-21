"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ponytail: username mapped to user@binding.local — upgrade to real username lookup if multi-tenant
const toEmail = (u: string) => `${u.trim().toLowerCase()}@binding.local`;

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground">Capture Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Masuk untuk melanjutkan</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin" autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-600">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
