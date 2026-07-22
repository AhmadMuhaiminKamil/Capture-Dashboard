// app/summarize/page.tsx
"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchAllCaptureDetails } from "@/lib/captureQueries";
import type { CaptureFilters } from "@/lib/types";
import Image from "next/image";
import { 
  filterDetailsData,
  type BindingDetail 
} from "@/lib/dummyData";

// ----------------------------------------------------------------------------
// TYPES untuk DUMMY_DATA
// ----------------------------------------------------------------------------

interface StoRow {
  kode: string;
  details: BindingDetail[];
}

interface AreaGroup {
  name: string;
  stos: StoRow[];
}

interface RegionGroup {
  name: string;
  areas: AreaGroup[];
}

// ----------------------------------------------------------------------------
// DUMMY DATA STRUCTURE
// ----------------------------------------------------------------------------

// Struktur STO hardcode (Region > Area > STO). Isi `details` diisi dari real data.
const STO_STRUCTURE: { name: string; areas: { name: string; stos: string[] }[] }[] = [
  {
    name: "SOUTHERN",
    areas: [
      {
        name: "JAKPUS",
        stos: ["CID", "CPP", "GBC", "GBI", "KMY"],
      },
      {
        name: "JAKSEL",
        stos: ["BIN", "CPE", "JAG", "KAL", "KBY", "KBB", "KMG", "PSM", "TB", "TBE"],
      },
      {
        name: "JAKTIM",
        stos: ["CWA", "GAN", "JTN", "KLD", "KRG", "PDK", "PGB", "PGG", "PSR", "RMG"],
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// DETAIL MODAL COMPONENT
// ----------------------------------------------------------------------------

function DetailModal({ detail, onClose, isBinding }: { detail: BindingDetail; onClose: () => void; isBinding: boolean }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, px: 0, py: 0 });

  const fotoUrls = detail.fotoUrls || [];
  const hasPhotos = fotoUrls.length > 0;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : fotoUrls.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < fotoUrls.length - 1 ? prev + 1 : 0));
  };

  const handleImageLoad = (index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }));
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  React.useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoading({});
    setImageErrors({});
    setZoomUrl(null);
    setZoomScale(1);
    setZoomPos({ x: 0, y: 0 });
  }, [detail]);

  const openZoom = (url: string) => { setZoomUrl(url); setZoomScale(1); setZoomPos({ x: 0, y: 0 }); };
  const closeZoom = () => setZoomUrl(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomScale(s => Math.min(10, Math.max(1, s - e.deltaY * 0.005)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, px: zoomPos.x, py: zoomPos.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setZoomPos({ x: dragStart.current.px + e.clientX - dragStart.current.x, y: dragStart.current.py + e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => { isDragging.current = false; };

  return (
    <>
      {zoomUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={closeZoom}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoomScale > 1 ? "grab" : "zoom-out" }}
        >
          <img
            src={zoomUrl}
            alt="Zoom"
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: `translate(${zoomPos.x}px, ${zoomPos.y}px) scale(${zoomScale})`,
              transformOrigin: "center",
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              userSelect: "none",
              pointerEvents: "none",
              transition: isDragging.current ? "none" : "transform 0.1s",
            }}
            draggable={false}
          />
          <button
            onClick={closeZoom}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 text-lg"
          >✕</button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            Scroll untuk zoom · Drag untuk geser · Klik di luar untuk tutup
          </div>
        </div>
      )}
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Detail Tiket</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{detail.id}</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent transition">
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">
          <div className="px-5 py-4 grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Tanggal</p>
              <p className="text-sm text-foreground tabular-nums">{detail.tanggal}</p>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">Jenis</p>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={detail.jenis === "Lapsung" ? { background: "rgba(52,199,140,0.15)", color: "rgb(52,199,140)" } : { background: "rgba(99,155,255,0.15)", color: "rgb(99,155,255)" }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: detail.jenis === "Lapsung" ? "rgb(52,199,140)" : "rgb(99,155,255)" }} />
                {detail.jenis}
              </span>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Domain</p>
              <p className="text-sm text-foreground">{detail.domain}</p>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">No Tiket</p>
              <p className="text-sm font-mono text-foreground">{detail.noTiket}</p>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">No Service</p>
              <p className="text-sm font-mono text-foreground">{detail.noService}</p>
            </div>
            {isBinding ? (<>
              <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">STO Lama</p>
                <p className="text-sm text-foreground">{detail.stoLama}</p>
              </div>
              <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">STO Baru</p>
                <p className="text-sm text-foreground">{detail.stoBaru}</p>
              </div>
            </>) : (
              <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">STO</p>
                <p className="text-sm text-foreground">{detail.stoBaru}</p>
              </div>
            )}
            <div className="col-span-2 rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Alasan Binding</p>
              <p className="text-sm text-foreground">{detail.alasanBinding}</p>
            </div>
            
            <div className="col-span-2 rounded-lg bg-muted/40 border border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Foto Pendukung {hasPhotos ? `(${fotoUrls.length})` : ''}
                </p>
                {hasPhotos && (
                  <span className="text-xs text-muted-foreground">
                    {currentImageIndex + 1} / {fotoUrls.length}
                  </span>
                )}
              </div>

              {hasPhotos ? (
                <div>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-background/50 cursor-zoom-in" onClick={() => openZoom(fotoUrls[currentImageIndex])}>
                    {imageLoading[currentImageIndex] !== false && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"></div>
                          <span className="text-xs text-muted-foreground">Memuat foto...</span>
                        </div>
                      </div>
                    )}
                    {imageErrors[currentImageIndex] ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <svg className="mx-auto h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-1 text-xs">Gagal memuat foto</p>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={fotoUrls[currentImageIndex]}
                        alt={`Foto tiket ${detail.noTiket} - ${currentImageIndex + 1}`}
                        fill
                        className="object-contain"
                        onLoadingComplete={() => handleImageLoad(currentImageIndex)}
                        onError={() => handleImageError(currentImageIndex)}
                        sizes="(max-width: 768px) 100vw, 672px"
                        priority
                      />
                    )}
                    {!imageErrors[currentImageIndex] && (
                      <div className="absolute inset-0 cursor-zoom-in" onClick={() => openZoom(fotoUrls[currentImageIndex])} />
                    )}
                  </div>

                  {fotoUrls.length > 1 && (
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <button
                        onClick={handlePrevImage}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Prev
                      </button>
                      
                      <div className="flex gap-1.5 overflow-x-auto px-1 py-1 flex-1 justify-center">
                        {fotoUrls.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                              currentImageIndex === index
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-border hover:border-muted-foreground/50'
                            }`}
                          >
                            <Image
                              src={url}
                              alt={`Thumbnail ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleNextImage}
                        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        Next
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/20">
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-xs text-muted-foreground">Tidak ada foto</p>
                  </div>
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

// ----------------------------------------------------------------------------
// MAIN CONTENT COMPONENT
// ----------------------------------------------------------------------------

function SummarizeDetailContent({ session }: { session: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const stoKode = searchParams.get("sto");
  const type = searchParams.get("type") as "INC" | "Lapsung";
  const kategori = searchParams.get("kategori") || "";

  const domain = searchParams.get("domain") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const search = searchParams.get("search") || "";
  const modelLabel = searchParams.get("modelLabel") || "";

  const [activeDetail, setActiveDetail] = useState<BindingDetail | null>(null);
  const [allDetails, setAllDetails] = useState<BindingDetail[]>([]);
  const [page, setPage] = useState(0);
  const [modelLabels, setModelLabels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) return;
    let cancelled = false;
    fetchAllCaptureDetails()
      .then((rows) => { if (!cancelled) setAllDetails(rows); })
      .catch(() => { if (!cancelled) setAllDetails([]); });
    return () => { cancelled = true; };
  }, [session]);

  // Batch classify binding alasan when modelLabel filter is active
  useEffect(() => {
    if (!modelLabel || allDetails.length === 0) return;
    const binding = allDetails.filter(d => d.kategori === "Binding");
    if (binding.length === 0) return;
    fetch("/api/classify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texts: binding.map(d => d.alasanBinding) }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.results) {
          const map = new Map<string, string>();
          binding.forEach((d, i) => map.set(d.id, data.results[i]));
          setModelLabels(map);
        }
      })
      .catch(() => {});
  }, [allDetails, modelLabel]);
  
  // --- FILTERING DATA ---
  const details = useMemo(() => {
    if (!stoKode) return [];

    // Decode search parameter
    const decodedSearch = decodeURIComponent(search);
    
    // Cek apakah ini filter "LAINNYA"
    const isLainnya = searchParams.get("lainnya") === "true";

    // --- FILTER 1: STO ---
    let matchedDetails: BindingDetail[] = [];

    if (stoKode === "all") {
      matchedDetails = allDetails;
    } else {
      const stoList = stoKode.split(",").map(s => s.trim()).filter(s => s.length > 0);
      
      if (stoList.length > 1) {
        matchedDetails = allDetails.filter(
          (d) => stoList.includes(d.stoBaru)
        );
      } else if (stoList.length === 1) {
        matchedDetails = allDetails.filter(
          (d) => d.stoBaru === stoList[0]
        );
      } else {
        return [];
      }
    }

    // --- FILTER 2: KATEGORI (OR - data memiliki salah satu kategori) ---
    if (kategori) {
      const kategoriList = kategori.split(",").map(s => s.trim()).filter(s => s.length > 0);
      if (kategoriList.length > 0) {
        matchedDetails = matchedDetails.filter(d => 
          d.kategori && kategoriList.includes(d.kategori)
        );
      }
    }

    // --- FILTER 3: TYPE ---
    if (type) {
      matchedDetails = matchedDetails.filter(d => d.jenis === type);
    }

    // --- FILTER 4: LAINNYA (data yang TIDAK termasuk 5 kategori utama) ---
    if (isLainnya) {
      const mainKeywords = [
        "Mintol pindah odp",
        "pindah odp",
        "ODP LAMA",
        "ODP penuh",
        "ODP jarak",
        "Instalasi ulang",
        "Order PDA",
        "PDA rusak",
        "Order PDA baru",
        "PDA",
        "Instalasi ulang perangkat",
        "Pengamanan Pelanggan",
        "Pengamanan pelanggan",
        "Ganti ONT",
        "ONT rusak",
        "ONT tidak sesuai",
        "ONT",
        "Gamas",
        "Pedestrian",
        "Gamas/Pedestrian"
      ];
      
      matchedDetails = matchedDetails.filter(d => {
        const isMainCategory = mainKeywords.some(keyword => 
          d.alasanBinding.toLowerCase().includes(keyword.toLowerCase())
        );
        return !isMainCategory;
      });
    }

    // --- FILTER 5: MODEL LABEL atau SEARCH ---
    if (modelLabel && !isLainnya) {
      const getKwLabel = (alasan: string): string => {
        const a = alasan.toLowerCase();
        if (/pindah\s*odp|odp\s*lama|odp\s*baru|reboundary|reboundery/.test(a)) return "pindahOdp";
        if (/order\s*pda|pda\s*rusak|instalasi\s*ulang|psb|lapsung\s*psb/.test(a)) return "orderPda";
        if (/pengamanan|percepatan|reschedule|kunjungan|minta\s*hari|minta\s*besok|no\s*respon/.test(a)) return "pengamananPelanggan";
        if (/ganti\s*ont|ont\s*rusak|ont\s*lepas|pelurusan\s*onu|onu\s*id|ganti\s*gpon/.test(a)) return "gantiOnt";
        if (/gamas|pedestrian/.test(a)) return "gamasPedestrian";
        return "lainnya";
      };
      matchedDetails = matchedDetails.filter(d =>
        (modelLabels.get(d.id) ?? getKwLabel(d.alasanBinding)) === modelLabel
      );
    } else if (decodedSearch && !isLainnya) {
      matchedDetails = matchedDetails.filter(d =>
        d.alasanBinding.toLowerCase().includes(decodedSearch.toLowerCase())
      );
    }

    // --- FILTER 6: Domain, DateFrom, DateTo ---
    if (domain || dateFrom || dateTo) {
      const filterObj: Partial<CaptureFilters> = {};
      if (domain) filterObj.domain = domain;
      if (dateFrom) filterObj.dateFrom = dateFrom;
      if (dateTo) filterObj.dateTo = dateTo;
      
      matchedDetails = filterDetailsData(matchedDetails, filterObj);
    }

    return matchedDetails;
  }, [stoKode, type, kategori, domain, dateFrom, dateTo, search, modelLabel, modelLabels, searchParams, allDetails]);

  // Reset page saat filter/data berubah
  useEffect(() => { setPage(0); }, [details]);

  
  // Hitung STO yang aktif (memiliki data)
  const activeStoList = useMemo(() => {
    const stoSet = new Set<string>();
    details.forEach(d => stoSet.add(d.stoBaru));
    return Array.from(stoSet);
  }, [details]);

  const isLainnya = searchParams.get("lainnya") === "true";

  const getSearchDisplayName = (searchKeyword: string): string => {
    const mapping: Record<string, string> = {
      "Mintol pindah odp": "PINDAH ODP",
      "PDA": "ORDER PDA",
      "Pengamanan Pelanggan": "PENGAMANAN PELANGGAN",
      "ONT": "GANTI ONT",
      "Gamas": "GAMAS/PEDESTRIAN",
      "Lainnya": "LAINNYA",
    };
    return mapping[searchKeyword] || searchKeyword;
  };

  const generateFileName = (extension: string) => {
    if (dateFrom && dateTo) {
      return `data_ticket_${dateFrom}_${dateTo}.${extension}`;
    }
    if (dateFrom) {
      return `data_ticket_${dateFrom}.${extension}`;
    }
    const today = new Date().toISOString().slice(0, 10);
    return `data_ticket_${today}.${extension}`;
  };

  const exportToCSV = () => {
    if (details.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }

    const headers = [
      "Tanggal",
      "Jenis",
      "No Tiket",
      "No Service",
      ...(kategori === "Binding" ? ["STO Lama", "STO Baru"] : ["STO"]),
      "Domain",
      "Kategori",
      "Alasan Binding"
    ];

    const rows = details.map(d => {
      const dateObj = d.tanggalRaw;
      const tanggal = dateObj.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      return [
        `"${tanggal}"`,
        `"${d.jenis}"`,
        `"${d.noTiket}"`,
        `"${d.noService}"`,
        ...(kategori === "Binding" ? [`"${d.stoLama}"`, `"${d.stoBaru}"`] : [`"${d.stoBaru}"`]),
        `"${d.domain}"`,
        `"${d.kategori}"`,
        `"${d.alasanBinding.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', generateFileName('csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    if (details.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }

    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Data Tiket</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table {
            border-collapse: collapse;
            width: 100%;
            font-family: Arial, sans-serif;
            font-size: 11px;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            padding: 6px 8px;
            border: 1px solid #ccc;
            text-align: left;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #ccc;
            text-align: left;
          }
          .text-format {
            mso-number-format: "\\@";
          }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>No Tiket</th>
              <th>No Service</th>
              ${kategori === "Binding" ? "<th>STO Lama</th><th>STO Baru</th>" : "<th>STO</th>"}
              <th>Domain</th>
              <th>Kategori</th>
              <th>Alasan Binding</th>
            </tr>
          </thead>
          <tbody>
    `;

    details.forEach(d => {
      const dateObj = d.tanggalRaw;
      const tanggal = dateObj.toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      htmlContent += `
        <tr>
          <td>${tanggal}</td>
          <td>${d.jenis}</td>
          <td>${d.noTiket}</td>
          <td class="text-format">${d.noService}</td>
          ${kategori === "Binding" ? `<td>${d.stoLama}</td><td>${d.stoBaru}</td>` : `<td>${d.stoBaru}</td>`}
          <td>${d.domain}</td>
          <td>${d.kategori}</td>
          <td>${d.alasanBinding}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + htmlContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', generateFileName('xls'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get header info
  const getHeaderInfo = () => {
    if (!stoKode) return null;
    
    const decodedSearch = decodeURIComponent(search);
    const stoList = stoKode.split(",").map(s => s.trim()).filter(s => s.length > 0);
    const isAll = stoKode === "all";
    const isMultiple = stoList.length > 1;

    const MODEL_LABEL_DISPLAY: Record<string, string> = {
      pindahOdp: "Pindah ODP", orderPda: "Order PDA",
      pengamananPelanggan: "Pengamanan Pelanggan", gantiOnt: "Ganti ONT",
      gamasPedestrian: "Gamas/Pedestrian", lainnya: "Lainnya",
    };
    const modelLabelDisplay = modelLabel ? (MODEL_LABEL_DISPLAY[modelLabel] ?? modelLabel) : null;
    
    const typeLabel = type ? ` ${type}` : '';
    const kategoriLabel = kategori ? ` ${kategori}` : '';
    const filterLabel = `${typeLabel}${kategoriLabel}`.trim();
    
    const activeCount = activeStoList.length;
    const totalStos = stoList.length;
    const stoInfo = activeCount === totalStos 
      ? `${totalStos} STO` 
      : `${activeCount} dari ${totalStos} STO aktif`;

    const searchDisplayName = decodedSearch ? getSearchDisplayName(decodedSearch) : null;

    let title = "";
    let subtitle = "";
    let categoryName = "";
    
    if (isAll) {
      title = filterLabel ? `Semua Data ${filterLabel}` : "Semua Data";
      subtitle = `Menampilkan ${details.length} data dari ${stoInfo}`;
      categoryName = filterLabel || "Semua Data";
    } else if (isMultiple) {
      let regionName = "";
      let areaName = "";
      
      STO_STRUCTURE.forEach((region) => {
        region.areas.forEach((area) => {
          const areaStos = area.stos;
          if (stoList.every((s) => areaStos.includes(s)) && stoList.length === areaStos.length) {
            areaName = area.name;
          }
        });
        
        const regionStos = region.areas.flatMap((a) => a.stos);
        if (stoList.every((s) => regionStos.includes(s)) && stoList.length === regionStos.length) {
          regionName = region.name;
        }
      });
      
      const titleSuffix = modelLabelDisplay ? ` (${modelLabelDisplay})` : filterLabel ? ` (${filterLabel})` : '';
      
      if (regionName) {
        title = `Region ${regionName}${titleSuffix}`;
        subtitle = `Menampilkan ${details.length} data dari ${stoInfo}`;
        categoryName = regionName;
      } else if (areaName) {
        title = `Area ${areaName}${titleSuffix}`;
        subtitle = `Menampilkan ${details.length} data dari ${stoInfo}`;
        categoryName = areaName;
      } else {
        title = `${stoInfo}${titleSuffix}`;
        subtitle = `Menampilkan ${details.length} data dari ${stoInfo}`;
        categoryName = stoInfo;
      }
    } else {
      const stoName = stoList[0];
      const labelSuffix = modelLabelDisplay ?? (type && kategori ? `${type} ${kategori}` : type || kategori || null);
      if (labelSuffix) {
        title = `${labelSuffix} - ${stoName}`;
        subtitle = `Menampilkan ${details.length} data ${labelSuffix}`;
        categoryName = labelSuffix;
      } else {
        title = `STO ${stoName}`;
        subtitle = `Menampilkan ${details.length} data`;
        categoryName = stoName;
      }
    }

    if (searchDisplayName && !isLainnya) {
      categoryName = searchDisplayName;
    }

    if (isLainnya) {
      categoryName = "LAINNYA";
    }

    return {
      title,
      subtitle,
      accentColor: type === "INC" ? "rgb(59, 130, 246)" : "rgb(52, 199, 140)",
      stoInfo: stoInfo,
      totalData: details.length,
      search: decodedSearch,
      isLainnya: isLainnya,
      categoryName: categoryName,
      searchDisplayName: searchDisplayName
    };
  };

  if (!stoKode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-medium text-foreground">Parameter URL tidak lengkap.</p>
        <button onClick={() => router.back()} className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent">
          Kembali ke halaman sebelumnya
        </button>
      </div>
    );
  }

  const headerInfo = getHeaderInfo();
  const decodedSearch = decodeURIComponent(search);
  const stoList = stoKode.split(",").map(s => s.trim()).filter(s => s.length > 0);
  const isMultipleSto = stoList.length > 1 || stoKode === "all";

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      {activeDetail && (
        <DetailModal detail={activeDetail} onClose={() => setActiveDetail(null)} isBinding={kategori === "Binding"} />
      )}

      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.back()} 
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm hover:bg-accent transition-colors group"
              title="Kembali"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Excel
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 shadow-sm">
            <div 
              className="absolute top-0 left-0 right-0 h-1" 
              style={{ backgroundColor: headerInfo?.accentColor || "rgb(59, 130, 246)" }}
            />
            
            <div className="px-6 py-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {headerInfo?.title || "Detail Data"}
              </h1>
              
              <p className="text-sm text-muted-foreground mt-1.5">
                {headerInfo?.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">STO:</span>
                  <span className="font-medium text-foreground">{headerInfo?.stoInfo || `${stoList.length} terpilih`}</span>
                </div>
                
                <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">Total Data:</span>
                  <span className="font-medium text-foreground">{details.length}</span>
                </div>

                {headerInfo?.categoryName && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                    <span className="text-muted-foreground">Kategori:</span>
                    <span className="font-medium text-foreground">{headerInfo.categoryName}</span>
                  </div>
                )}

                {domain && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="font-medium text-foreground">{domain}</span>
                  </div>
                )}
                {(dateFrom || dateTo) && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                    <span className="text-muted-foreground">Periode:</span>
                    <span className="font-medium text-foreground">
                      {dateFrom || "..."} — {dateTo || "..."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-hidden bg-muted/30" style={{ borderTop: `4px solid ${headerInfo?.accentColor || "rgb(59, 130, 246)"}` }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {stoKode === "all" ? "Semua Data" : isMultipleSto ? `Data dari ${stoList.length} STO` : `Data Tiket`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  Total: <span className="font-semibold text-foreground">{details.length}</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm bg-card">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/40">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">Tanggal</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">Jenis</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">No Tiket</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">No Service</th>
                    {kategori === "Binding" ? (<>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">STO Lama</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">STO Baru</th>
                    </>) : (
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">STO</th>
                    )}
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">Domain</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase">Alasan</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground/80 whitespace-nowrap tracking-wider uppercase sticky right-0 bg-muted/40">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {details.length > 0 ? (
                    details.slice(page * 100, page * 100 + 100).map((d, idx) => (
                      <tr key={d.id} className={`border-b border-border/30 transition-colors hover:bg-accent/40 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap tabular-nums text-[11px]">{d.tanggal}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={d.jenis === "Lapsung" ? { background: "rgba(52,199,140,0.15)", color: "rgb(52,199,140)" } : { background: "rgba(99,155,255,0.15)", color: "rgb(99,155,255)" }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.jenis === "Lapsung" ? "rgb(52,199,140)" : "rgb(99,155,255)" }} />
                            {d.jenis}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap text-[11px]">{d.noTiket}</td>
                        <td className="px-3 py-2.5 font-mono font-medium text-foreground whitespace-nowrap text-[11px]">{d.noService}</td>
                        {kategori === "Binding" ? (<>
                          <td className="px-3 py-2.5 text-foreground whitespace-nowrap text-[11px]">{d.stoLama}</td>
                          <td className="px-3 py-2.5 text-foreground whitespace-nowrap text-[11px]">{d.stoBaru}</td>
                        </>) : (
                          <td className="px-3 py-2.5 text-foreground whitespace-nowrap text-[11px]">{d.stoBaru}</td>
                        )}
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-[11px]">{d.domain}</td>
                        <td className="px-3 py-2.5 text-foreground text-[11px] max-w-[150px]">
                          <span className="block truncate" title={d.alasanBinding}>{d.alasanBinding}</span>
                          {d.fotoUrls && d.fotoUrls.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/60">
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {d.fotoUrls.length}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center sticky right-0 bg-inherit">
                          <button 
                            onClick={() => setActiveDetail(d)} 
                            className="rounded-md px-3 py-1 text-[10px] font-semibold text-foreground border border-border bg-background hover:bg-accent shadow-sm transition-colors whitespace-nowrap"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <p className="text-sm font-medium">Data tiket tidak ditemukan</p>
                          <p className="text-xs">
                            {stoKode === "all" 
                              ? "Tidak ada data yang tersedia"
                              : isMultipleSto 
                                ? `Tidak ada data untuk STO: ${stoList.join(", ")}`
                                : `Tidak ada data untuk STO ${stoKode}${type ? ` dengan tipe ${type}` : ''}${kategori ? ` dan kategori ${kategori}` : ''}${isLainnya ? ' (kategori Lainnya)' : ''}${decodedSearch && !isLainnya ? ` dengan alasan "${decodedSearch}"` : ''}`
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {details.length > 100 && (
            <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
              <span className="text-[11px] text-muted-foreground">
                {page * 100 + 1}–{Math.min(page * 100 + 100, details.length)} dari {details.length} data
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-30 disabled:pointer-events-none"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  Sebelumnya
                </button>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {page + 1} / {Math.ceil(details.length / 100)}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(details.length / 100) - 1, p + 1))}
                  disabled={page >= Math.ceil(details.length / 100) - 1}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-30 disabled:pointer-events-none"
                >
                  Berikutnya
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// PAGE EXPORT
// ----------------------------------------------------------------------------

export default function SummarizePage() {
  const session = useAuthGuard();
  
  if (session === undefined) return <div className="flex min-h-screen items-center justify-center text-sm">Loading Auth...</div>;
  if (session === null) return null;

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm">Memuat tabel data...</div>}>
      <SummarizeDetailContent session={session} />
    </Suspense>
  );
}