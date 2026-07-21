// lib/exportUtils.ts
//
// Butuh dependency tambahan:
//   npm install papaparse xlsx
//   npm install -D @types/papaparse

import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { CaptureTicket } from "./types";

interface ExportColumn {
  key: keyof CaptureTicket;
  label: string;
}

// Kolom yang mau di-export, sekaligus urutan & nama headernya. Diatur manual
// (bukan auto dari Object.keys) supaya urutan kolomnya rapi & konsisten,
// dan kolom internal (mis. telegram_user_id) tidak ikut ke-export.
const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "id", label: "ID" },
  { key: "created_at", label: "Tanggal" },
  { key: "jenis", label: "Jenis" },
  { key: "nomor_tiket", label: "Nomor Tiket" },
  { key: "no_service", label: "No Service" },
  { key: "clid_lama", label: "CLID Lama" },
  { key: "clid_baru", label: "CLID Baru" },
  { key: "sto_lama", label: "STO Lama" },
  { key: "sto_baru", label: "STO Baru" },
  { key: "domain", label: "Domain" },
  { key: "alasan_binding", label: "Alasan Binding" },
  { key: "telegram_username", label: "Dikirim Oleh" },
  { key: "photo_urls", label: "Link Foto" },
];

function toExportRows(rows: CaptureTicket[]): Record<string, string | number>[] {
  return rows.map((row) => {
    const out: Record<string, string | number> = {};
    for (const col of EXPORT_COLUMNS) {
      let value: unknown = row[col.key];
      if (col.key === "photo_urls" && Array.isArray(value)) {
        value = value.join(" | ");
      }
      out[col.label] = (value as string | number) ?? "";
    }
    return out;
  });
}

function timestampedFilename(ext: string): string {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `capture_tickets_${stamp}.${ext}`;
}

export function exportToCSV(rows: CaptureTicket[]): void {
  const csv = Papa.unparse(toExportRows(rows));
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, timestampedFilename("csv"));
}

export function exportToXLSX(rows: CaptureTicket[]): void {
  const worksheet = XLSX.utils.json_to_sheet(toExportRows(rows));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Capture Tickets");
  XLSX.writeFile(workbook, timestampedFilename("xlsx"));
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}