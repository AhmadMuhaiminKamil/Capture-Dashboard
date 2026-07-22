// app/kategori_binding/page.tsx
"use client";

import React, { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchAllCaptureDetails } from "@/lib/captureQueries";
import type { BindingDetail } from "@/lib/dummyData";

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface KategoriStoRow {
  kode: string;
  pindahOdp: number;
  orderPda: number;
  pengamananPelanggan: number;
  gantiOnt: number;
  gamasPedestrian: number;
  lainnya: number;
  total: number;
}

interface AreaGroup {
  name: string;
  stos: KategoriStoRow[];
}

interface RegionGroup {
  name: string;
  areas: AreaGroup[];
}

// ----------------------------------------------------------------------------
// DUMMY DATA - Sinkron dengan DUMMY_DETAILS
// ----------------------------------------------------------------------------

// Fungsi untuk menghitung data berdasarkan STO dan alasan dengan keyword yang lebih lengkap
function countDataByStoAndAlasan(stoKode: string, searchKeyword: string, details: BindingDetail[]): number {
  // Mapping keyword untuk setiap kategori - PASTIKAN SEMUA VARIASI TERTUTUPI
  const keywordMap: Record<string, string[]> = {
    "Mintol pindah odp": ["Mintol pindah odp", "pindah odp", "ODP LAMA", "ODP penuh", "ODP jarak"],
    "PDA": ["Instalasi ulang", "Order PDA", "PDA rusak", "Order PDA baru", "PDA", "Instalasi ulang perangkat"],
    "Pengamanan Pelanggan": ["Pengamanan Pelanggan", "Pengamanan pelanggan"],
    "ONT": ["Ganti ONT", "ONT rusak", "ONT tidak sesuai", "ONT"],
    "Gamas": ["Gamas", "Pedestrian", "Gamas/Pedestrian"],
  };
  
  const keywords = keywordMap[searchKeyword] || [searchKeyword];
  
  return details.filter(d => 
    d.stoBaru === stoKode && 
    d.kategori === "Binding" &&
    keywords.some(kw => d.alasanBinding.toLowerCase().includes(kw.toLowerCase()))
  ).length;
}

// Fungsi untuk menghitung total SEMUA data Binding (INC + Lapsung) di STO
function countTotalBindingBySto(stoKode: string, details: BindingDetail[]): number {
  return details.filter(d => 
    d.stoBaru === stoKode && 
    d.kategori === "Binding"
  ).length;
}

// Fungsi untuk menghitung data Binding yang TIDAK termasuk dalam 5 kategori utama
function countLainnyaBySto(stoKode: string, details: BindingDetail[]): number {
  const allKeywords = [
    "Mintol pindah odp", "pindah odp", "ODP LAMA", "ODP penuh", "ODP jarak",
    "Instalasi ulang", "Order PDA", "PDA rusak", "Order PDA baru", "PDA", "Instalasi ulang perangkat",
    "Pengamanan Pelanggan", "Pengamanan pelanggan",
    "Ganti ONT", "ONT rusak", "ONT tidak sesuai", "ONT",
    "Gamas", "Pedestrian", "Gamas/Pedestrian"
  ];
  
  const bindingData = details.filter(d => 
    d.stoBaru === stoKode && 
    d.kategori === "Binding"
  );
  
  const lainnya = bindingData.filter(d => {
    return !allKeywords.some(keyword => 
      d.alasanBinding.toLowerCase().includes(keyword.toLowerCase())
    );
  });
  
  return lainnya.length;
}

// Generate data STO dengan hitungan real dari data Supabase
const generateStoData = (kode: string, details: BindingDetail[]): KategoriStoRow => {
  const pindahOdp = countDataByStoAndAlasan(kode, "Mintol pindah odp", details);
  const orderPda = countDataByStoAndAlasan(kode, "PDA", details);
  const pengamananPelanggan = countDataByStoAndAlasan(kode, "Pengamanan Pelanggan", details);
  const gantiOnt = countDataByStoAndAlasan(kode, "ONT", details);
  const gamasPedestrian = countDataByStoAndAlasan(kode, "Gamas", details);
  const lainnya = countLainnyaBySto(kode, details);
  const total = countTotalBindingBySto(kode, details);
  
  return {
    kode,
    pindahOdp,
    orderPda,
    pengamananPelanggan,
    gantiOnt,
    gamasPedestrian,
    lainnya,
    total,
  };
};

// Generate area data
const generateAreaData = (areaName: string, stoCodes: string[], details: BindingDetail[]): AreaGroup => {
  return {
    name: areaName,
    stos: stoCodes.map(code => generateStoData(code, details)),
  };
};

// Generate region data
const generateRegionData = (regionName: string, areas: AreaGroup[]): RegionGroup => {
  return {
    name: regionName,
    areas,
  };
};

// Struktur STO hardcode (Region > Area > STO). Isi dihitung dari real data.
const STO_STRUCTURE: { name: string; areas: { name: string; stos: string[] }[] }[] = [
  {
    name: "SOUTHERN",
    areas: [
      { name: "JAKPUS", stos: ["CID", "CPP", "GBC", "GBI", "KMY"] },
      { name: "JAKSEL", stos: ["BIN", "CPE", "JAG", "KAL", "KBY", "KBB", "KMG", "PSM", "TB", "TBE"] },
      { name: "JAKTIM", stos: ["CWA", "GAN", "JTN", "KLD", "KRG", "PDK", "PGB", "PGG", "PSR", "RMG"] },
    ],
  },
];

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

type KategoriKey = "pindahOdp" | "orderPda" | "pengamananPelanggan" | "gantiOnt" | "gamasPedestrian" | "lainnya";

const KATEGORI_COLS: { key: KategoriKey; label: string; searchKeyword: string }[] = [
  { key: "pindahOdp",           label: "PINDAH ODP",             searchKeyword: "pindahOdp" },
  { key: "orderPda",            label: "ORDER PDA",              searchKeyword: "orderPda" },
  { key: "pengamananPelanggan", label: "PENGAMANAN PELANGGAN",   searchKeyword: "pengamananPelanggan" },
  { key: "gantiOnt",            label: "GANTI ONT",              searchKeyword: "gantiOnt" },
  { key: "gamasPedestrian",     label: "GAMAS/PEDESTRIAN",       searchKeyword: "gamasPedestrian" },
  { key: "lainnya",             label: "LAINNYA",                searchKeyword: "Lainnya" },
];

function sumStoRow(sto: KategoriStoRow): number {
  return sto.total;
}

function sumStos(stos: KategoriStoRow[]) {
  return stos.reduce(
    (acc, s) => ({
      pindahOdp:           acc.pindahOdp           + s.pindahOdp,
      orderPda:            acc.orderPda            + s.orderPda,
      pengamananPelanggan: acc.pengamananPelanggan + s.pengamananPelanggan,
      gantiOnt:            acc.gantiOnt            + s.gantiOnt,
      gamasPedestrian:     acc.gamasPedestrian     + s.gamasPedestrian,
      lainnya:             acc.lainnya             + s.lainnya,
      total:               acc.total               + s.total,
    }),
    { pindahOdp: 0, orderPda: 0, pengamananPelanggan: 0, gantiOnt: 0, gamasPedestrian: 0, lainnya: 0, total: 0 }
  );
}

function sumAreas(areas: AreaGroup[]) {
  return areas.reduce(
    (acc, a) => {
      const sub = sumStos(a.stos);
      return {
        pindahOdp:           acc.pindahOdp           + sub.pindahOdp,
        orderPda:            acc.orderPda            + sub.orderPda,
        pengamananPelanggan: acc.pengamananPelanggan + sub.pengamananPelanggan,
        gantiOnt:            acc.gantiOnt            + sub.gantiOnt,
        gamasPedestrian:     acc.gamasPedestrian     + sub.gamasPedestrian,
        lainnya:             acc.lainnya             + sub.lainnya,
        total:               acc.total               + sub.total,
      };
    },
    { pindahOdp: 0, orderPda: 0, pengamananPelanggan: 0, gantiOnt: 0, gamasPedestrian: 0, lainnya: 0, total: 0 }
  );
}

// Helper untuk build URL ke summarize - untuk kategori spesifik
// key → model label string (matches /api/classify output before LABEL_MAP)
const KEY_TO_MODEL: Record<string, string> = {
  pindahOdp: "pindah_odp",
  orderPda: "order_pda",
  pengamananPelanggan: "pengamanan_pelanggan",
  gantiOnt: "ganti_ont",
  gamasPedestrian: "gamasPedestrian", // keyword fallback, model not trained on this
  lainnya: "lainnya",
};

function buildUrl(stoKode: string, searchKeyword: string): string {
  const params = new URLSearchParams();
  params.append("sto", stoKode);
  params.append("kategori", "Binding");
  if (searchKeyword === "Lainnya") {
    params.append("lainnya", "true");
  } else {
    params.append("modelLabel", searchKeyword);
  }
  return `/summarize?${params.toString()}`;
}

// Helper untuk build URL multiple STO - untuk kategori spesifik
function buildMultipleStoUrl(stoList: string[], searchKeyword: string): string {
  const params = new URLSearchParams();
  params.append("sto", stoList.join(","));
  params.append("kategori", "Binding");
  
  if (searchKeyword === "Lainnya") {
    params.append("lainnya", "true");
  } else {
    params.append("modelLabel", searchKeyword);
  }
  return `/summarize?${params.toString()}`;
}

// Helper untuk build URL Total Binding
function buildTotalUrl(stoKode: string): string {
  const params = new URLSearchParams();
  params.append("sto", stoKode);
  params.append("kategori", "Binding");
  return `/summarize?${params.toString()}`;
}

// Helper untuk build URL Total Binding per Area
function buildTotalAreaUrl(areaStos: string[]): string {
  const params = new URLSearchParams();
  params.append("sto", areaStos.join(","));
  params.append("kategori", "Binding");
  return `/summarize?${params.toString()}`;
}

// Helper untuk build URL Total Binding per Region
function buildTotalRegionUrl(stoList: string[]): string {
  const params = new URLSearchParams();
  params.append("sto", stoList.join(","));
  params.append("kategori", "Binding");
  return `/summarize?${params.toString()}`;
}

// ----------------------------------------------------------------------------
// PAGE
// ----------------------------------------------------------------------------

export default function KategoriBindingPage() {
  const session = useAuthGuard();

  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set());
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());

  // Data real dari Supabase (binding_tickets)
  const [allDetails, setAllDetails] = useState<BindingDetail[]>([]);
  const [modelLabels, setModelLabels] = useState<Map<string, string>>(new Map());
  const [loadingData, setLoadingData] = useState(true);
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) return;
    let cancelled = false;
    setLoadingData(true);
    fetchAllCaptureDetails()
      .then((rows) => { if (!cancelled) { setAllDetails(rows); setLoadingData(false); } })
      .catch(() => { if (!cancelled) { setAllDetails([]); setLoadingData(false); } });
    return () => { cancelled = true; };
  }, [session]);

  // Batch classify all binding alasan texts via ONNX model
  useEffect(() => {
    if (allDetails.length === 0) return;
    const bindingTexts = allDetails
      .filter(d => d.kategori === "Binding")
      .map(d => ({ id: d.id, text: d.alasanBinding }));
    if (bindingTexts.length === 0) return;
    setClassifying(true);
    fetch("/api/classify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texts: bindingTexts.map(x => x.text) }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.results) {
          const map = new Map<string, string>();
          bindingTexts.forEach((x, i) => map.set(x.id, data.results[i]));
          setModelLabels(map);
        }
        setClassifying(false);
      })
      .catch(() => { setClassifying(false); });
  }, [allDetails]);

  // Helper lookup model label; fallback ke keyword matching (Vercel/no-python)
  const getLabel = (d: BindingDetail): string => {
    const ml = modelLabels.get(d.id);
    if (ml) return ml;
    // keyword fallback — covers when /api/classify unavailable (Vercel no Python)
    const a = d.alasanBinding.toLowerCase();
    if (/pindah\s*odp|odp\s*lama|odp\s*baru|reboundary|reboundery/.test(a)) return "pindahOdp";
    if (/order\s*pda|pda\s*rusak|instalasi\s*ulang|psb|lapsung\s*psb/.test(a)) return "orderPda";
    if (/pengamanan|percepatan|reschedule|rescheduled|kunjungan|minta\s*hari|minta\s*besok|no\s*respon/.test(a)) return "pengamananPelanggan";
    if (/ganti\s*ont|ont\s*rusak|ont\s*lepas|pelurusan\s*onu|onu\s*id|ganti\s*gpon/.test(a)) return "gantiOnt";
    if (/gamas|pedestrian/.test(a)) return "gamasPedestrian";
    return "lainnya";
  };

  // Build count map per STO dari allDetails + modelLabels
  const buildStoCounts = (stoKode: string): KategoriStoRow => {
    const binding = allDetails.filter(
      d => d.stoBaru === stoKode && d.kategori === "Binding"
    );
    const counts: Record<string, number> = {
      pindahOdp: 0, orderPda: 0, pengamananPelanggan: 0,
      gantiOnt: 0, gamasPedestrian: 0, lainnya: 0,
    };
    binding.forEach(d => {
      counts[getLabel(d)] = (counts[getLabel(d)] ?? 0) + 1;
    });
    return {
      kode: stoKode,
      ...counts,
      total: binding.length,
    } as KategoriStoRow;
  };

  // Bangun hierarki dari STO_STRUCTURE, isi counts dari real data.
  const DUMMY_DATA = useMemo<RegionGroup[]>(() => {
    return STO_STRUCTURE.map((region) => ({
      name: region.name,
      areas: region.areas.map((area) => ({
        name: area.name,
        stos: area.stos.map((kode) => buildStoCounts(kode)),
      })),
    }));
  }, [allDetails, modelLabels]);

  function toggleRegion(name: string) {
    setCollapsedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function toggleArea(name: string) {
    setCollapsedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  const numberedRows = useMemo(() => {
    let counter = 0;
    const map = new Map<string, number>();
    DUMMY_DATA.forEach((region) =>
      region.areas.forEach((area) =>
        area.stos.forEach((sto) => {
          counter += 1;
          map.set(`${area.name}-${sto.kode}`, counter);
        })
      )
    );
    return map;
  }, []);

  const grandTotal = useMemo(() => {
    return DUMMY_DATA.reduce(
      (acc, region) => {
        const sub = sumAreas(region.areas);
        return {
          pindahOdp: acc.pindahOdp + sub.pindahOdp,
          orderPda: acc.orderPda + sub.orderPda,
          pengamananPelanggan: acc.pengamananPelanggan + sub.pengamananPelanggan,
          gantiOnt: acc.gantiOnt + sub.gantiOnt,
          gamasPedestrian: acc.gamasPedestrian + sub.gamasPedestrian,
          lainnya: acc.lainnya + sub.lainnya,
          total: acc.total + sub.total,
        };
      },
      { pindahOdp: 0, orderPda: 0, pengamananPelanggan: 0, gantiOnt: 0, gamasPedestrian: 0, lainnya: 0, total: 0 }
    );
  }, [DUMMY_DATA]);

  if (session === null) return null;

  const thBase =
    "border border-border px-3 py-2.5 font-medium text-muted-foreground/80 whitespace-nowrap text-xs tracking-wide uppercase text-center";
  const tdBase =
    "border border-border px-3 py-2.5 text-center whitespace-nowrap text-white text-sm";
  const tdMuted =
    "border border-border px-3 py-2.5 text-center whitespace-nowrap text-white/30 text-sm";
  const tdClickable =
    "border border-border px-3 py-2.5 text-center whitespace-nowrap text-white text-sm cursor-pointer hover:bg-white/10 transition-colors";
  const groupRowClass = "bg-muted/70 font-semibold";

  // Helper render clickable cell - STO Level
  const renderClickableCell = (count: number, stoKode: string, searchKeyword: string) => {
    if (count === 0) {
      return <span className="text-white/30">–</span>;
    }

    const url = buildUrl(stoKode, searchKeyword);

    return (
      <Link
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat detail ${count} data dengan alasan "${searchKeyword}" di ${stoKode}`}
      >
        {count}
      </Link>
    );
  };

  // Render clickable area total per kategori
  const renderAreaCategory = (count: number, areaName: string, searchKeyword: string) => {
    if (count === 0) {
      return <span className="text-white/30">–</span>;
    }

    let areaStos: string[] = [];
    DUMMY_DATA.forEach((region) => {
      region.areas.forEach((area) => {
        if (area.name === areaName) {
          areaStos = area.stos.map((s) => s.kode);
        }
      });
    });

    if (areaStos.length === 0) {
      return <span className="text-white">{count}</span>;
    }

    const url = buildMultipleStoUrl(areaStos, searchKeyword);

    return (
      <Link
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat detail ${count} data dengan alasan "${searchKeyword}" di ${areaName}`}
      >
        {count}
      </Link>
    );
  };

  // Render clickable region total per kategori
  const renderRegionCategory = (count: number, regionName: string, searchKeyword: string) => {
    if (count === 0) {
      return <span className="text-white/30">–</span>;
    }

    const region = DUMMY_DATA.find((r) => r.name === regionName);
    if (!region) {
      return <span className="text-white">{count}</span>;
    }

    const stoList = region.areas.flatMap((a) => a.stos.map((s) => s.kode));
    const url = buildMultipleStoUrl(stoList, searchKeyword);

    return (
      <Link
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat detail ${count} data dengan alasan "${searchKeyword}" di ${regionName}`}
      >
        {count}
      </Link>
    );
  };

  // Render clickable total (per STO)
  const renderTotalCell = (count: number, stoKode: string) => {
    if (count === 0) {
      return <span className="text-white/30">–</span>;
    }

    const url = buildTotalUrl(stoKode);

    return (
      <Link
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat semua data Binding di ${stoKode} (${count} data)`}
      >
        {count}
      </Link>
    );
  };

  // Render total area
  const renderAreaTotal = (count: number, areaName: string) => {
    if (count === 0) {
      return <span className="text-white/30">–</span>;
    }

    let areaStos: string[] = [];
    DUMMY_DATA.forEach((region) => {
      region.areas.forEach((area) => {
        if (area.name === areaName) {
          areaStos = area.stos.map((s) => s.kode);
        }
      });
    });

    if (areaStos.length === 0) {
      return <span className="text-white">{count}</span>;
    }

    const url = buildTotalAreaUrl(areaStos);

    return (
      <Link
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat semua data Binding di ${areaName} (${count} data)`}
      >
        {count}
      </Link>
    );
  };

  // Render total region
  const renderRegionTotal = (count: number, regionName: string) => {
    if (count === 0) {
      return <span className="text-white/30">–</span>;
    }

    const region = DUMMY_DATA.find((r) => r.name === regionName);
    if (!region) {
      return <span className="text-white">{count}</span>;
    }

    const stoList = region.areas.flatMap((a) => a.stos.map((s) => s.kode));
    const url = buildTotalRegionUrl(stoList);

    return (
      <Link
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat semua data Binding di ${regionName} (${count} data)`}
      >
        {count}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
          {(loadingData || classifying) ? (
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="relative h-1 w-full bg-muted overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                  style={{ width: "40%", animation: "slideProgress 1.4s ease-in-out infinite" }} />
              </div>
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div className="relative h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" style={{ animationDuration: "1s" }} />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" style={{ animationDuration: "0.75s", animationDirection: "reverse" }} />
                  <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" style={{ animationDuration: "0.5s" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {loadingData ? "Memuat data binding..." : "Mengklasifikasi dengan model AI..."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {loadingData ? "Mengambil data dari database" : "Model sedang menganalisis alasan binding"}
                  </p>
                </div>
              </div>
              <style>{`@keyframes slideProgress{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/80">
                <tr>
                  <th rowSpan={2} className={`${thBase} text-center`}>
                    No
                  </th>
                  <th rowSpan={2} className={`${thBase} text-left`}>
                    STO
                  </th>
                  <th colSpan={KATEGORI_COLS.length} className={`${thBase} text-center`}>
                    KATEGORI BINDING
                  </th>
                  <th rowSpan={2} className={`${thBase} text-center`}>
                    Total
                  </th>
                </tr>
                <tr>
                  {KATEGORI_COLS.map((col) => (
                    <th key={col.key} className={`${thBase} text-center`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {DUMMY_DATA.map((region) => {
                  const regionCollapsed = collapsedRegions.has(region.name);
                  const regionSum = sumAreas(region.areas);
                  const regionTotal = regionSum.total;

                  return (
                    <Fragment key={region.name}>
                      {/* Region row */}
                      <tr className={groupRowClass}>
                        <td className={`${tdBase} text-center`}>
                          <button
                            onClick={() => toggleRegion(region.name)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-xs text-white hover:bg-white/10 transition-colors"
                          >
                            {regionCollapsed ? "+" : "−"}
                          </button>
                        </td>
                        <td className={`${tdBase} text-left font-semibold text-white`}>
                          {region.name}
                        </td>
                        {KATEGORI_COLS.map((col) => {
                          const val = regionSum[col.key];
                          return (
                            <td key={col.key} className={val ? tdClickable : tdMuted}>
                              {val ? renderRegionCategory(val, region.name, col.searchKeyword) : "–"}
                            </td>
                          );
                        })}
                        <td className={`${tdBase} font-semibold`}>
                          {renderRegionTotal(regionTotal, region.name)}
                        </td>
                      </tr>

                      {!regionCollapsed &&
                        region.areas.map((area) => {
                          const areaCollapsed = collapsedAreas.has(area.name);
                          const areaSum = sumStos(area.stos);
                          const areaTotal = areaSum.total;

                          return (
                            <Fragment key={area.name}>
                              {/* Area row */}
                              <tr className={groupRowClass}>
                                <td className={`${tdBase} text-center`}>
                                  <button
                                    onClick={() => toggleArea(area.name)}
                                    className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-xs text-white hover:bg-white/10 transition-colors"
                                  >
                                    {areaCollapsed ? "+" : "−"}
                                  </button>
                                </td>
                                <td className={`${tdBase} text-left font-semibold text-white pl-6`}>
                                  {area.name}
                                </td>
                                {KATEGORI_COLS.map((col) => {
                                  const val = areaSum[col.key];
                                  return (
                                    <td key={col.key} className={val ? tdClickable : tdMuted}>
                                      {val ? renderAreaCategory(val, area.name, col.searchKeyword) : "–"}
                                    </td>
                                  );
                                })}
                                <td className={`${tdBase} font-semibold`}>
                                  {renderAreaTotal(areaTotal, area.name)}
                                </td>
                              </tr>

                              {!areaCollapsed &&
                                area.stos.map((sto) => {
                                  const no = numberedRows.get(`${area.name}-${sto.kode}`);
                                  const total = sto.total;

                                  return (
                                    <tr
                                      key={`${area.name}-${sto.kode}`}
                                      className="transition-colors hover:bg-white/5"
                                    >
                                      <td className={`${tdBase} text-center text-white/70`}>
                                        {no}
                                      </td>
                                      <td className={`${tdBase} text-left pl-10`}>
                                        <span className="font-medium text-white">{sto.kode}</span>
                                      </td>
                                      {KATEGORI_COLS.map((col) => {
                                        const val = sto[col.key];
                                        return (
                                          <td key={col.key} className={val ? tdClickable : tdMuted}>
                                            {val ? renderClickableCell(val, sto.kode, col.searchKeyword) : "–"}
                                          </td>
                                        );
                                      })}
                                      <td className={`${tdBase} font-medium`}>
                                        {renderTotalCell(total, sto.kode)}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </Fragment>
                          );
                        })}
                    </Fragment>
                  );
                })}

                {/* Grand Total */}
                <tr className="bg-muted/80 font-semibold border-t-2 border-border">
                  <td
                    className={`${tdBase} text-left text-white/60 text-xs uppercase tracking-wide`}
                    colSpan={2}
                  >
                    Grand Total
                  </td>
                  {KATEGORI_COLS.map((col) => {
                    const val = grandTotal[col.key];
                    if (!val) return <td key={col.key} className={tdMuted}>–</td>;
                    const allStos = STO_STRUCTURE.flatMap(r => r.areas.flatMap(a => a.stos));
                    const url = col.searchKeyword === "Lainnya"
                      ? `/summarize?sto=${allStos.join(",")}&kategori=Binding&lainnya=true`
                      : `/summarize?sto=${allStos.join(",")}&kategori=Binding&modelLabel=${col.searchKeyword}`;
                    return (
                      <td key={col.key} className={tdClickable}>
                        <Link href={url} className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
                          title={`Lihat ${val} data ${col.label}`}>
                          {val}
                        </Link>
                      </td>
                    );
                  })}
                  <td className={`${tdBase} font-bold text-lg`}>
                    <Link
                      href={`/summarize?sto=all&kategori=Binding`}
                      className="text-white hover:text-white/80 hover:underline transition-colors block text-center"
                      title={`Lihat semua data Binding (${grandTotal.total} data)`}
                    >
                      {grandTotal.total}
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          )}
      </div>
    </div>
  );
}