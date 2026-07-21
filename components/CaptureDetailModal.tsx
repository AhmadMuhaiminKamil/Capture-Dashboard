// components/CaptureDetailModal.tsx
"use client";

import { useEffect } from "react";
import type { CaptureTicket } from "@/lib/types";

interface CaptureDetailModalProps {
  row: CaptureTicket;
  onClose: () => void;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}

export default function CaptureDetailModal({ row, onClose }: CaptureDetailModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const photos = row.photo_urls ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card/95 backdrop-blur px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Detail Capture</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {row.no_service} {row.nomor_tiket ? `· Tiket ${row.nomor_tiket}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Tutup"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <InfoItem
              label="Tanggal"
              value={row.created_at ? new Date(row.created_at).toLocaleString("id-ID") : "-"}
            />
            <InfoItem label="Jenis" value={row.jenis} />
            <InfoItem label="Domain" value={row.domain} />
            <InfoItem label="No Tiket" value={row.nomor_tiket ?? "-"} />
            <InfoItem label="No Service" value={row.no_service} />
            <InfoItem label="STO Lama" value={row.sto_lama ?? "-"} />
            <InfoItem label="STO Baru" value={row.sto_baru ?? "-"} />
            <InfoItem label="CLID Lama" value={row.clid_lama} />
            <InfoItem label="CLID Baru" value={row.clid_baru} />
          </div>

          {/* Alasan binding */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Alasan Binding</p>
            <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed text-foreground">
              {row.alasan_binding || "-"}
            </p>
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Foto {photos.length > 0 ? `(${photos.length})` : ""}
            </p>
            {photos.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
                Tidak ada foto
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((url, idx) => (
                  <a
                    key={url + idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-black">
                        Buka
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}