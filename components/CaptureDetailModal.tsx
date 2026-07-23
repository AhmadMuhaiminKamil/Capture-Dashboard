"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import type { CaptureTicket } from "@/lib/types";

interface Props { row: CaptureTicket; onClose: () => void; }

export default function CaptureDetailModal({ row, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const photos = row.photo_urls ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") zoomUrl ? setZoomUrl(null) : onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, zoomUrl]);

  const openZoom = (url: string) => { setZoomUrl(url); setZoomScale(1); setZoomPos({ x: 0, y: 0 }); };

  const fields = [
    { label: "Tanggal", value: row.created_at ? new Date(row.created_at).toLocaleString("id-ID") : "-" },
    { label: "Jenis", value: row.jenis },
    { label: "No Tiket", value: row.nomor_tiket ?? "-" },
    { label: "No Service", value: row.no_service },
    { label: "STO Lama", value: row.sto_lama ?? "-" },
    { label: "STO Baru", value: row.sto_baru ?? "-" },
    { label: "Domain", value: row.domain },
  ];

  return (
    <>
      {/* Lightbox zoom */}
      {zoomUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setZoomUrl(null)}
          onWheel={(e) => { e.preventDefault(); setZoomScale(s => Math.min(10, Math.max(1, s - e.deltaY * 0.005))); }}
          onMouseDown={(e) => { dragging.current = true; dragStart.current = { x: e.clientX, y: e.clientY, px: zoomPos.x, py: zoomPos.y }; }}
          onMouseMove={(e) => { if (!dragging.current) return; setZoomPos({ x: dragStart.current.px + e.clientX - dragStart.current.x, y: dragStart.current.py + e.clientY - dragStart.current.y }); }}
          onMouseUp={() => { dragging.current = false; }}
          style={{ cursor: zoomScale > 1 ? "grab" : "zoom-out" }}
        >
          <img src={zoomUrl} alt="zoom" draggable={false}
            style={{ transform: `translate(${zoomPos.x}px,${zoomPos.y}px) scale(${zoomScale})`, maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", userSelect: "none", pointerEvents: "none" }} />
          <button onClick={() => setZoomUrl(null)} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">✕</button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">Scroll zoom · Drag geser · Klik tutup</div>
        </div>
      )}

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Detail Tiket</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{row.no_service}{row.nomor_tiket ? ` · ${row.nomor_tiket}` : ""}</p>
            </div>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent transition">✕</button>
          </div>

          {/* Body */}
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              {fields.map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">{label}</p>
                  <p className="text-sm text-foreground">{value || "-"}</p>
                </div>
              ))}

              {/* Alasan */}
              <div className="col-span-2 rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Alasan Binding</p>
                <p className="text-sm text-foreground">{row.alasan_binding || "-"}</p>
              </div>

              {/* Foto */}
              <div className="col-span-2 rounded-lg bg-muted/40 border border-border/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    Foto Pendukung {photos.length > 0 ? `(${photos.length})` : ""}
                  </p>
                  {photos.length > 1 && <span className="text-xs text-muted-foreground">{idx + 1} / {photos.length}</span>}
                </div>
                {photos.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Tidak ada foto</div>
                ) : (
                  <div>
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-background/50">
                      <Image src={photos[idx]} alt={`Foto ${idx + 1}`} fill className="object-contain" sizes="672px" />
                      <div className="absolute inset-0 cursor-zoom-in" onClick={() => openZoom(photos[idx])} />
                    </div>
                    {photos.length > 1 && (
                      <div className="flex items-center justify-between gap-2 mt-3">
                        <button onClick={() => setIdx(i => i > 0 ? i - 1 : photos.length - 1)}
                          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors">
                          ← Prev
                        </button>
                        <div className="flex gap-1.5 overflow-x-auto px-1 py-1">
                          {photos.map((url, i) => (
                            <button key={i} onClick={() => setIdx(i)}
                              className={`relative w-12 h-12 rounded-md overflow-hidden border-2 shrink-0 ${i === idx ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
                              <Image src={url} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="48px" />
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setIdx(i => i < photos.length - 1 ? i + 1 : 0)}
                          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors">
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
