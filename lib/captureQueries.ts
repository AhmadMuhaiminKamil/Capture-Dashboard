// lib/captureQueries.ts
//
// Query builder dipisah jadi function sendiri supaya dipakai bareng oleh
// tabel (pakai pagination) MAUPUN export (ambil semua row yang match
// filter, tanpa pagination) - biar filter-nya selalu konsisten di dua
// tempat itu.

import { supabase } from "./supabaseClient";
import type { CaptureFilters, CaptureTicket } from "./types";
import type { BindingDetail } from "./dummyData";

type RawTicket = Record<string, any>;

const TABLES: { name: string; kategori: string }[] = [
  { name: "binding_tickets", kategori: "Binding" },
  { name: "gno_tickets", kategori: "GNO/REGFAIL" },
  { name: "ognok_tickets", kategori: "OG NOK" },
  { name: "routing_tickets", kategori: "ROUTING" },
];

function normalizeJenis(jenis: string | null): "INC" | "Lapsung" {
  if (jenis === "Tiket" || jenis === "INC") return "INC";
  return "Lapsung";
}

// ---------------------------------------------------------------------------
// Fungsi khusus binding_tickets (dipakai dashboard/page.tsx)
// ---------------------------------------------------------------------------
const TABLE = "binding_tickets";

function applyFilters(query: any, filters: CaptureFilters) {
  const { search, jenis, stoLama, stoBaru, domain, dateFrom, dateTo } = filters;

  if (search) {
    query = query.or(
      `no_service.ilike.%${search}%,nomor_tiket.ilike.%${search}%,alasan_binding.ilike.%${search}%`
    );
  }
  if (jenis) query = query.eq("jenis", jenis);
  if (stoLama) query = query.ilike("sto_lama", `%${stoLama}%`);
  if (stoBaru) query = query.ilike("sto_baru", `%${stoBaru}%`);
  if (domain) query = query.ilike("domain", `%${domain}%`);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

  return query;
}

interface FetchPageParams {
  filters: CaptureFilters;
  page: number;
  pageSize: number;
}

interface FetchPageResult {
  rows: CaptureTicket[];
  totalCount: number;
}

export async function fetchCapturePage({
  filters,
  page,
  pageSize,
}: FetchPageParams): Promise<FetchPageResult> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  query = applyFilters(query, filters);

  const { data, error, count } = await query;
  if (error) throw error;

  return { rows: (data as CaptureTicket[]) || [], totalCount: count || 0 };
}

export async function fetchAllMatchingCapture(
  filters: CaptureFilters
): Promise<CaptureTicket[]> {
  const CHUNK_SIZE = 1000;
  let allRows: CaptureTicket[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + CHUNK_SIZE - 1);

    query = applyFilters(query, filters);

    const { data, error } = await query;
    if (error) throw error;

    allRows = allRows.concat((data as CaptureTicket[]) || []);

    if (!data || data.length < CHUNK_SIZE) break;
    from += CHUNK_SIZE;
  }

  return allRows;
}

// ---------------------------------------------------------------------------
// Fungsi multi-table (dipakai table_detail / kategori_binding / summarize)
// ---------------------------------------------------------------------------

// Ambil SEMUA row dari satu table (chunked per 1000)
async function fetchAllFromTable(
  table: string,
  columnMap: Record<string, string>
): Promise<RawTicket[]> {
  const CHUNK_SIZE = 1000;
  let allRows: RawTicket[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + CHUNK_SIZE - 1);

    if (error) throw error;
    allRows = allRows.concat((data as RawTicket[]) || []);
    if (!data || data.length < CHUNK_SIZE) break;
    from += CHUNK_SIZE;
  }

  return allRows;
}

// Ambil SEMUA row dari 4 table, gabung jadi BindingDetail[] dengan kategori asal table
export async function fetchAllCaptureDetails(): Promise<BindingDetail[]> {
  const allDetails: BindingDetail[] = [];

  for (const { name, kategori } of TABLES) {
    const rows = await fetchAllFromTable(name, {});
    for (const row of rows) {
      const created = row.created_at ? new Date(row.created_at) : new Date();
      allDetails.push({
        id: `${name}_${row.id}`,
        tanggal: created.toLocaleString("id-ID", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
        tanggalRaw: created,
        jenis: normalizeJenis(row.jenis),
        kategori,
        noTiket: row.nomor_tiket || "",
        noService: row.no_service || "",
        stoLama: row.sto_lama || "",
        stoBaru: row.sto_baru || row.sto || "",
        domain: row.domain || "",
        alasanBinding:
          row.alasan_binding || row.keterangan || row.ket_gpon_msan || "",
        fotoUrls: row.photo_urls || undefined,
      });
    }
  }

  return allDetails;
}