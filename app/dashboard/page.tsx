// app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchCapturePage, fetchAllMatchingCapture } from "@/lib/captureQueries";
import { exportToCSV, exportToXLSX } from "@/lib/exportUtils";
import FilterBar from "@/components/FilterBar";
import CaptureDetailModal from "@/components/CaptureDetailModal";
import EditDeleteModal, { type EditableFields } from "@/components/EditDeleteModal";
import DashboardChart from "@/components/DashboardChart";
import NavBar from "@/components/NavBar";
import LoadingOverlay from "@/components/LoadingOverlay";
import { EMPTY_FILTERS, type CaptureTicket, type CaptureFilters } from "@/lib/types";

/** Format Date ke string "YYYY-MM-DD" untuk value input[type=date] */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Filter default: dateFrom & dateTo = hari ini */
function todayFilters(): CaptureFilters {
  const today = toDateStr(new Date());
  return { ...EMPTY_FILTERS, dateFrom: today, dateTo: today };
}

const PAGE_SIZE = 25;

export default function DashboardPage() {
  const session = useAuthGuard();

  const [filters, setFilters] = useState<CaptureFilters>(todayFilters);
  const [rows, setRows] = useState<CaptureTicket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<CaptureTicket | null>(null);
  const [editRow, setEditRow] = useState<EditableFields | null>(null);

  // ── STO options untuk autocomplete ──────────────────────────────────────────
  const [stoOptions, setStoOptions] = useState<string[]>([]);

  useEffect(() => {
    // Fetch semua nilai distinct sto_baru dari Supabase sekali saja
    async function fetchStoOptions() {
      const { data, error } = await supabase
        .from("binding_tickets")
        .select("sto_baru")
        .not("sto_baru", "is", null)
        .neq("sto_baru", "");

      if (!error && data) {
        const unique = [...new Set(data.map((r: { sto_baru: string }) => r.sto_baru))]
          .filter(Boolean)
          .sort() as string[];
        setStoOptions(unique);
      }
    }
    fetchStoOptions();
  }, []); // hanya sekali saat mount
  // ────────────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: newRows, totalCount: newTotal } = await fetchCapturePage({
        filters,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(newRows);
      setTotalCount(newTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  async function handleExport(format: "csv" | "xlsx") {
    setExporting(true);
    setError(null);
    try {
      const allRows = await fetchAllMatchingCapture(filters);
      if (allRows.length === 0) {
        setError("Tidak ada data yang match filter untuk di-export.");
        return;
      }
      if (format === "csv") exportToCSV(allRows);
      else exportToXLSX(allRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (session === undefined) return null;
  if (session === null) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-muted/30">
      <NavBar right={
        <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      } />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">

        <DashboardChart filters={filters} />

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(todayFilters())}
            stoOptions={stoOptions}
          />
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 15V3" /><path d="M7 10l5 5 5-5" /><path d="M20 21H4" />
              </svg>
              {exporting ? "Mengekspor..." : "Export CSV"}
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 15V3" /><path d="M7 10l5 5 5-5" /><path d="M20 21H4" />
              </svg>
              {exporting ? "Mengekspor..." : "Export Excel"}
            </button>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary">
              <path d="M9 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4" />
              <path d="M9 21h6" /><path d="M12 17v4" />
            </svg>
            <span className="text-xs font-medium text-muted-foreground">Total Binding</span>
            {loading ? (
              <span className="inline-block h-4 w-8 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {totalCount.toLocaleString("id-ID")}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tanggal</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Jenis</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">No Tiket</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">No Service</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">STO Lama</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">STO Baru</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Domain</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Alasan Binding</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Foto</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <div className="relative overflow-hidden">
                        <div className="relative h-1 w-full bg-muted overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                            style={{ width: "40%", animation: "slideProgress 1.4s ease-in-out infinite" }} />
                        </div>
                        <div className="flex flex-col items-center justify-center gap-4 py-16">
                          <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" style={{ animationDuration: "1s" }} />
                            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" style={{ animationDuration: "0.75s", animationDirection: "reverse" }} />
                            <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" style={{ animationDuration: "0.5s" }} />
                          </div>
                          <p className="text-sm text-muted-foreground">Memuat data binding...</p>
                        </div>
                        <style>{`@keyframes slideProgress{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      Tidak ada data.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0 transition hover:bg-muted/40">
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        {row.created_at ? new Date(row.created_at).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                          {row.jenis}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">{row.nomor_tiket || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">{row.no_service}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{row.sto_lama || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{row.sto_baru || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">{row.domain}</td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-foreground" title={row.alasan_binding}>
                        {row.alasan_binding}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ width: "1px" }}>
                        <div className="flex items-center justify-between gap-1.5" style={{ minWidth: "100px" }}>
                          <button onClick={() => setSelectedRow(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent" style={{ minWidth: "70px" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Detail
                            {row.photo_urls && row.photo_urls.length > 0 && (
                              <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                {row.photo_urls.length}
                              </span>
                            )}
                          </button>
                          <button onClick={() => setEditRow({ id: row.id, table: "binding_tickets", nomor_tiket: row.nomor_tiket, no_service: row.no_service, sto_lama: row.sto_lama, sto_baru: row.sto_baru, domain: row.domain, alasan_binding: row.alasan_binding, jenis: row.jenis })}
                            className="flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-border bg-background p-1.5 text-muted-foreground shadow-sm transition hover:border-blue-500/40 hover:text-blue-400 hover:bg-blue-500/5">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Sebelumnya
          </button>

          <span className="text-sm text-muted-foreground">
            Halaman <span className="font-medium text-foreground">{page + 1}</span> dari{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Berikutnya
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {selectedRow && (
        <CaptureDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
      {editRow && (
        <EditDeleteModal fields={editRow} onClose={() => setEditRow(null)} onSaved={() => { setEditRow(null); loadData(); }} />
      )}
    </div>
  );
}