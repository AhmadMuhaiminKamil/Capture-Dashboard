"use client";

import { useEffect, useState } from "react";
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

const TOOLTIP = {
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "8px", fontSize: 12, color: "var(--foreground)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
};
const ITEM_STYLE = { color: "var(--foreground)" };
const LABEL_STYLE = { color: "var(--muted-foreground)", fontWeight: 600 };

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="absolute right-3 top-3 h-8 w-8 rounded-full opacity-10" style={{ background: color }} />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
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
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Komposisi Jenis</p>
          {loadingStats ? skel() : jenisData.length === 0
            ? <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={jenisData} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                    dataKey="value" strokeWidth={3} stroke="var(--card)">
                    {jenisData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} itemStyle={ITEM_STYLE} labelStyle={LABEL_STYLE}
                    formatter={(v) => [fmt(Number(v)), ""]} />
                  <Legend iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Area trend */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
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
                  <Tooltip contentStyle={TOOLTIP} itemStyle={ITEM_STYLE} labelStyle={LABEL_STYLE}
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
