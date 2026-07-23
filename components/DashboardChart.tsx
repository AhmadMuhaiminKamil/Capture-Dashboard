"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { CaptureFilters } from "@/lib/types";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";

const TABLE = "binding_tickets";
const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6"];

function applyFilters(q: any, f: CaptureFilters) {
  if (f.search) q = q.or(`no_service.ilike.%${f.search}%,nomor_tiket.ilike.%${f.search}%,alasan_binding.ilike.%${f.search}%`);
  if (f.jenis) q = q.eq("jenis", f.jenis);
  if (f.stoLama) q = q.ilike("sto_lama", `%${f.stoLama}%`);
  if (f.stoBaru) q = q.ilike("sto_baru", `%${f.stoBaru}%`);
  if (f.domain) q = q.ilike("domain", `%${f.domain}%`);
  if (f.dateFrom) q = q.gte("created_at", f.dateFrom);
  if (f.dateTo) q = q.lte("created_at", `${f.dateTo}T23:59:59`);
  return q;
}

const ITEM_STYLE = { color: "var(--foreground)" };
const LABEL_STYLE = { color: "var(--muted-foreground)", fontWeight: 600 };

// ponytail: easeOutQuart — smooth enough, no spring lib needed
function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setDisplay(Math.round(ease * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return display;
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  // parse numeric for count-up; fallback to display string if "–"
  const numeric = parseInt(value.replace(/\D/g, ""), 10) || 0;
  const counted = useCountUp(numeric);
  const display = value === "–" ? "–" : counted.toLocaleString("id-ID");

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default"
      style={{ "--glow": color } as React.CSSProperties}
    >
      <div className="absolute top-0 left-0 h-0.5 w-full opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="absolute right-3 top-3 h-12 w-12 rounded-full opacity-10 transition-all duration-300 group-hover:opacity-20 group-hover:scale-125"
        style={{ background: color }} />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums transition-colors duration-200" style={{ color }}>{display}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// Custom pie tooltip — modern card style
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const color = payload[0].payload.fill || COLORS[0];
  const total = payload[0].payload.total;
  const pct = total ? Math.round(value / total * 100) : 0;
  return (
    <div className="rounded-xl border border-white/10 px-4 py-3 shadow-2xl"
      style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)", minWidth: 140 }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-xs font-semibold text-white">{name}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>{value.toLocaleString("id-ID")}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{pct}% dari total</p>
    </div>
  );
}


export default function DashboardChart({ filters }: { filters: CaptureFilters }) {
  const [jenisData, setJenisData] = useState<{ name: string; value: number }[]>([]);
  const [trendData, setTrendData] = useState<{ label: string; inc: number; lapsung: number }[]>([]);
  const [stats, setStats] = useState({ total: 0, inc: 0, lapsung: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);

  useEffect(() => {
    async function go() {
      setLoadingStats(true);
      try {
        let q = supabase.from(TABLE).select("jenis");
        q = applyFilters(q, filters);
        const { data } = await q;
        if (!data) return;
        const inc = data.filter(r => r.jenis === "INC" || r.jenis === "Tiket").length;
        setStats({ total: data.length, inc, lapsung: data.length - inc });
        setJenisData([
          { name: "INC", value: inc },
          { name: "Lapsung", value: data.length - inc },
        ].filter(d => d.value > 0));
      } finally { setLoadingStats(false); }
    }
    go();
  }, [filters]);

  // Trend: 1 hari → per jam (24 titik), ≤90 hari → per hari, >90 → per bulan
  useEffect(() => {
    async function go() {
      setLoadingTrend(true);
      try {
        let q = supabase.from(TABLE).select("jenis,created_at");
        q = applyFilters(q, filters);
        const { data } = await q;
        if (!data) return;

        const sameDay = !!(filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo);
        const dayDiff = filters.dateFrom && filters.dateTo
          ? Math.round((new Date(filters.dateTo).getTime() - new Date(filters.dateFrom).getTime()) / 86400000)
          : 999;
        const byMonth = dayDiff > 90;

        const map: Record<string, { inc: number; lapsung: number }> = {};

        // Pra-isi 24 jam agar selalu ada 24 titik saat 1 hari
        if (sameDay) {
          for (let h = 0; h < 24; h++)
            map[`${String(h).padStart(2, "0")}:00`] = { inc: 0, lapsung: 0 };
        }

        data.forEach(r => {
          if (!r.created_at) return;
          const d = new Date(r.created_at);
          const key = sameDay
            ? `${String(d.getHours()).padStart(2, "0")}:00`
            : byMonth
              ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
              : r.created_at.slice(0, 10);
          if (!map[key]) map[key] = { inc: 0, lapsung: 0 };
          if (r.jenis === "INC" || r.jenis === "Tiket") map[key].inc++;
          else map[key].lapsung++;
        });

        setTrendData(
          Object.entries(map)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => ({
              label: sameDay ? k
                : byMonth
                  ? new Date(k + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
                  : new Date(k).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
              inc: v.inc,
              lapsung: v.lapsung,
            }))
        );
      } finally { setLoadingTrend(false); }
    }
    go();
  }, [filters]);

  const skel = () => (
    <div className="flex h-[200px] items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
  const fmt = (n: number) => n.toLocaleString("id-ID");
  const trendLabel = filters.dateFrom && filters.dateTo
    ? filters.dateFrom === filters.dateTo
      ? `per jam — ${new Date(filters.dateFrom).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`
      : `${new Date(filters.dateFrom).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} – ${new Date(filters.dateTo).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`
    : "semua waktu";

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Binding" value={loadingStats ? "–" : fmt(stats.total)} color={COLORS[0]} sub="semua tiket" />
        <StatCard label="INC" value={loadingStats ? "–" : fmt(stats.inc)} color={COLORS[1]}
          sub={loadingStats ? "" : `${stats.total ? Math.round(stats.inc / stats.total * 100) : 0}% dari total`} />
        <StatCard label="Lapsung" value={loadingStats ? "–" : fmt(stats.lapsung)} color={COLORS[2]}
          sub={loadingStats ? "" : `${stats.total ? Math.round(stats.lapsung / stats.total * 100) : 0}% dari total`} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Donut */}
        <div className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Komposisi Jenis</p>
          {loadingStats ? skel() : jenisData.length === 0
            ? <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={jenisData.map(d => ({ ...d, total: jenisData.reduce((a, b) => a + b.value, 0) }))}
                    cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                    dataKey="value" strokeWidth={jenisData.length === 1 ? 0 : 3} stroke="var(--card)">
                    {jenisData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Area trend */}
        <div className="group rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tren Binding</p>
            <p className="text-[10px] text-muted-foreground">{trendLabel}</p>
          </div>
          {loadingTrend ? skel() : trendData.length === 0
            ? <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Tidak ada data — atur filter tanggal</div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gLap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontSize: 12, color: "var(--foreground)", backdropFilter: "blur(12px)" }}
                    itemStyle={ITEM_STYLE} labelStyle={LABEL_STYLE}
                    formatter={(v, name) => [fmt(Number(v)), name === "inc" ? "INC" : "Lapsung"]} />
                  <Area type="monotone" dataKey="inc" stackId="1" stroke={COLORS[0]} strokeWidth={2}
                    fill="url(#gInc)" dot={false} activeDot={{ r: 4, fill: COLORS[0] }} />
                  <Area type="monotone" dataKey="lapsung" stackId="1" stroke={COLORS[1]} strokeWidth={2}
                    fill="url(#gLap)" dot={false} activeDot={{ r: 4, fill: COLORS[1] }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>
    </div>
  );
}
