"use client";
import { useEffect, useState, useRef } from "react";
import NavBar from "@/components/NavBar";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const LIMIT = 536870912;
const BUCKET_LIMIT = 1073741824;
const STATUS_COLOR = { safe: "#10b981", caution: "#f59e0b", warning: "#f97316", critical: "#ef4444" };
const statusOf = (p: number) => p >= 90 ? "critical" : p >= 80 ? "warning" : p >= 70 ? "caution" : "safe";
const bgOf = (p: number) => p >= 90 ? "border-red-500/40 bg-red-500/5" : p >= 80 ? "border-orange-500/40 bg-orange-500/5" : p >= 70 ? "border-yellow-500/40 bg-yellow-500/5" : "border-green-500/30 bg-green-500/5";
const glowOf = (p: number) => p >= 90 ? "0 0 0 2px rgba(239,68,68,0.5), 0 0 16px rgba(239,68,68,0.3)" : p >= 70 ? "0 0 0 2px rgba(245,158,11,0.4), 0 0 12px rgba(245,158,11,0.2)" : "";

function fmtMB(b: number) { return (b / 1024 ** 2).toFixed(1) + " MB"; }
function fmtPct(p: number) { return p.toFixed(1) + "%"; }

// ponytail: easeOutQuart counter — same as DashboardChart
function useCount(target: number) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!target) { setV(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 900, 1);
      setV(Math.round((1 - Math.pow(1 - t, 4)) * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return v;
}

interface Stats {
  dbBytes: number; bucketBytes: number; totalRows: number;
  limitBytes: number; pct: number; status: "safe"|"caution"|"warning"|"critical";
  tables: { table: string; rows: number }[];
  bucketFiles: number; bucketByType: Record<string, { count: number; bytes: number }>;
  fetchedAt: string;
}


function Gauge({ pct, label, limitLabel, color, bg, glow }: { pct: number; label: string; limitLabel: string; color: string; bg: string; glow: string }) {
  const [key, setKey] = useState(0);
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(pct);
  useEffect(() => { setKey(k => k + 1); if (prevRef.current !== pct) { setFlash(true); setTimeout(() => setFlash(false), 600); prevRef.current = pct; } }, [pct]);
  const s = statusOf(pct);
  return (
    <div className={`rounded-2xl border p-4 ${bg} flex flex-col items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`} style={{ boxShadow: glow || undefined }}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <div className="relative h-36 w-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={key}>
            <Pie data={[{ value: pct }, { value: 100 - pct }]} cx="50%" cy="50%" innerRadius={42} outerRadius={58}
              startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}
              isAnimationActive animationBegin={0} animationDuration={1200} animationEasing="ease-out">
              <Cell fill={color} />
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold transition-all duration-300 ${flash ? "scale-110" : "scale-100"}`} style={{ color }}>{fmtPct(pct)}</span>
          <span className="text-[10px] text-muted-foreground">{limitLabel}</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs font-bold mt-0.5" style={{ color }}>
          {s === "safe" ? "✓ Aman" : s === "caution" ? "⚠ Perhatian" : s === "warning" ? "⚠ Peringatan" : "⛔ Kritis"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, glow, loading }: { label: string; value: string; glow?: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ boxShadow: glow || undefined }}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      {loading ? (
        <div className="h-7 w-20 rounded bg-muted animate-pulse mt-2" />
      ) : (
        <p className="text-xl font-bold text-foreground mt-1">{value}</p>
      )}
    </div>
  );
}

export default function StoragePage() {
  const session = useAuthGuard();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); fetch("/api/storage-stats").then(r => r.json()).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { if (session) { load(); const t = setInterval(load, 30000); return () => clearInterval(t); } }, [session]);

  // All hooks must be called before any early return
  const dbMBCount = useCount(stats ? stats.dbBytes / 1024 ** 2 : 0);
  const bucketMBCount = useCount(stats ? stats.bucketBytes / 1024 ** 2 : 0);
  const rowsCount = useCount(stats?.totalRows ?? 0);
  const remainMBCount = useCount(stats ? (LIMIT - stats.dbBytes) / 1024 ** 2 : 0);

  if (!session) return null;

  const dbPct = stats?.pct ?? 0;
  const bp = Math.min((stats?.bucketBytes ?? 0) / BUCKET_LIMIT * 100, 100);
  const sc = STATUS_COLOR[statusOf(dbPct)];
  const bc = STATUS_COLOR[statusOf(bp)];

  // counter animations — deps on actual values so they retrigger on refresh


  return (
    <div className="min-h-screen bg-muted/30">
      <NavBar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Storage Monitor</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{stats ? `Update: ${new Date(stats.fetchedAt).toLocaleString("id-ID")} · auto 30s` : "Memuat..."}</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent disabled:opacity-50 transition-all">
            <svg className={`h-3.5 w-3.5 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>

        {/* Gauge + Cards + Gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Gauge pct={dbPct} label="Database Usage" limitLabel="of 512 MB" color={sc} bg={bgOf(dbPct)} glow={glowOf(dbPct)} />

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="DB Size" value={`${dbMBCount.toFixed(1)} MB`} glow={glowOf(dbPct)} loading={loading && !stats} />
            <StatCard label="Bucket" value={`${bucketMBCount.toFixed(1)} MB`} glow={glowOf(bp)} loading={loading && !stats} />
            <StatCard label="Total Rows" value={rowsCount.toLocaleString("id-ID")} loading={loading && !stats} />
            <StatCard label="Sisa Limit" value={`${remainMBCount.toFixed(1)} MB`} loading={loading && !stats} />
          </div>

          <Gauge pct={bp} label="Storage Bucket" limitLabel="of 1 GB" color={bc} bg={bgOf(bp)} glow={glowOf(bp)} />
        </div>

        {/* Alert */}
        {dbPct >= 70 && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${dbPct >= 90 ? "border-red-500/40 bg-red-500/10 text-red-400" : dbPct >= 80 ? "border-orange-500/40 bg-orange-500/10 text-orange-400" : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"}`}>
            {dbPct >= 90 ? "⛔ KRITIS" : dbPct >= 80 ? "⚠ PERINGATAN" : "⚠ PERHATIAN"} — Database {fmtPct(dbPct)} dari limit.
          </div>
        )}



      </div>
    </div>
  );
}
