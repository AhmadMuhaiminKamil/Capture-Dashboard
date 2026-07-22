// app/table_detail/page.tsx

"use client";

import React, { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/lib/useAuthGuard";
import FilterBar from "@/components/FilterBar";
import NavBar from "@/components/NavBar";
import LoadingOverlay from "@/components/LoadingOverlay";
import { fetchAllCaptureDetails } from "@/lib/captureQueries";
import type { CaptureFilters } from "@/lib/types";
import {
  filterDetailsData,
  CATEGORIES_ALL,
  type Category,
  type TicketDetail,
  type BindingDetail
} from "@/lib/dummyData";

// ----------------------------------------------------------------------------
// TYPES & CONSTANTS
// ----------------------------------------------------------------------------

const CATEGORIES = CATEGORIES_ALL;

interface StoRow {
  kode: string;
  details: TicketDetail[];
}

interface AreaGroup {
  name: string;
  stos: StoRow[];
}

interface RegionGroup {
  name: string;
  areas: AreaGroup[];
}

type CountMap = Record<Category, number>;
type TicketCounts = { INC: CountMap; Lapsung: CountMap };

// ----------------------------------------------------------------------------
// DUMMY DATA STRUCTURE
// ----------------------------------------------------------------------------

const DEFAULT_FILTERS: CaptureFilters = {
  search: "",
  jenis: "",
  stoLama: "",
  stoBaru: "",
  domain: "",
  dateFrom: "",
  dateTo: "",
  kategori: "",
};

// Struktur hierarki hardcode (Region > Area > STO). Isi `details` diisi dari
// data real Supabase di dalam component, filter by stoBaru.
const STO_STRUCTURE: RegionGroup[] = [
  {
    name: "SOUTHERN",
    areas: [
      {
        name: "JAKPUS",
        stos: ["CID", "CPP", "GBC", "GBI", "KMY"].map(k => ({ kode: k, details: [] as TicketDetail[] })),
      },
      {
        name: "JAKSEL",
        stos: ["BIN", "CPE", "JAG", "KAL", "KBY", "KBB", "KMG", "PSM", "TB", "TBE"].map(k => ({ kode: k, details: [] as TicketDetail[] })),
      },
      {
        name: "JAKTIM",
        stos: ["CWA", "GAN", "JTN", "KLD", "KRG", "PDK", "PGB", "PGG", "PSR", "RMG"].map(k => ({ kode: k, details: [] as TicketDetail[] })),
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function createEmptyCounts(): TicketCounts {
  return {
    INC: { "Binding": 0, "GNO/REGFAIL": 0, "ROUTING": 0, "OG NOK": 0 },
    Lapsung: { "Binding": 0, "GNO/REGFAIL": 0, "ROUTING": 0, "OG NOK": 0 },
  };
}

function addCounts(a: TicketCounts, b: TicketCounts): TicketCounts {
  const res = createEmptyCounts();
  CATEGORIES.forEach((c) => {
    res.INC[c] = a.INC[c] + b.INC[c];
    res.Lapsung[c] = a.Lapsung[c] + b.Lapsung[c];
  });
  return res;
}

function getCountsFromDetails(details: TicketDetail[]): TicketCounts {
  const res = createEmptyCounts();
  details.forEach((d) => {
    res[d.jenis][d.kategori as Category] += 1;
  });
  return res;
}

function filterDetails(details: TicketDetail[], filters: CaptureFilters): TicketDetail[] {
  const filtered = filterDetailsData(details, filters);
  return filtered.map(d => ({
    ...d,
    alasan: d.alasanBinding
  }));
}

// Helper untuk build URL ke summarize
function buildSummarizeUrl(
  stoList: string[],
  filters: CaptureFilters,
  type?: "INC" | "Lapsung",
  kategori?: string
) {
  const params = new URLSearchParams();
  params.append("sto", stoList.join(","));
  
  // Kirim type jika ada (dari parameter)
  if (type) {
    params.append("type", type);
  }
  
  // Kirim kategori - PRIORITAS dari parameter, lalu dari filters
  const finalKategori = kategori || filters.kategori || undefined;
  if (finalKategori) {
    params.append("kategori", finalKategori);
  }
  
  // Kirim filter jenis dari filters jika ada dan tidak ada type dari parameter
  if (!type && filters.jenis) {
    params.append("type", filters.jenis);
  }
  
  // Kirim filter lainnya
  if (filters.domain) params.append("domain", filters.domain);
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);
  if (filters.search) params.append("search", filters.search);
  
  return `/summarize?${params.toString()}`;
}

// ----------------------------------------------------------------------------
// PAGE
// ----------------------------------------------------------------------------

export default function TableDetailPage() {
  const session = useAuthGuard();

  const [filters, setFilters] = useState<CaptureFilters>(DEFAULT_FILTERS);
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set());
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());

  // Data real dari Supabase (4 table), diisi via fetch.
  const [allDetails, setAllDetails] = useState<BindingDetail[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) return;
    let cancelled = false;
    setLoadingData(true);
    fetchAllCaptureDetails()
      .then((rows) => { if (!cancelled) setAllDetails(rows); })
      .catch(() => { if (!cancelled) setAllDetails([]); })
      .finally(() => { if (!cancelled) setLoadingData(false); });
    return () => { cancelled = true; };
  }, [session]);

  // Bangun hierarki Region>Area>STO dari STO_STRUCTURE, isi details dari real data.
  // STO yang tidak dikenal (tidak ada di STO_STRUCTURE) dikumpulkan ke area "Other" di SOUTHERN.
  const DUMMY_DATA = useMemo<RegionGroup[]>(() => {
    const bySto = new Map<string, TicketDetail[]>();
    allDetails.forEach((d) => {
      const list = bySto.get(d.stoBaru) || [];
      list.push({ ...d, alasan: d.alasanBinding });
      bySto.set(d.stoBaru, list);
    });
    const matched = new Set<string>();
    const result: RegionGroup[] = STO_STRUCTURE.map((region) => ({
      ...region,
      areas: region.areas.map((area) => ({
        ...area,
        stos: area.stos.map((sto) => {
          matched.add(sto.kode);
          return { ...sto, details: bySto.get(sto.kode) || [] };
        }),
      })),
    }));
    const unmatched = Array.from(bySto.keys()).filter((k) => !matched.has(k));
    if (unmatched.length > 0) {
      result[0].areas.push({
        name: "Other",
        stos: unmatched.map((k) => ({
          kode: k,
          details: bySto.get(k) || [],
        })),
      });
    }
    return result;
  }, [allDetails]);

  const stoOptions = useMemo(() => {
    const set = new Set<string>();
    STO_STRUCTURE.forEach((r) => r.areas.forEach((a) => a.stos.forEach((s) => set.add(s.kode))));
    return Array.from(set).sort();
  }, []);

  const kategoriOptions = useMemo(() => {
    return [...CATEGORIES];
  }, []);

  const hasDeepFilter = useMemo(() => {
    const { domain, dateFrom, dateTo, jenis, search, kategori } = filters;
    return !!(domain || dateFrom || dateTo || jenis || search || kategori);
  }, [filters]);

  const selectedStoList = useMemo(() => {
    if (!filters.stoBaru) return [];
    return filters.stoBaru.split(",").map(s => s.trim()).filter(s => s.length > 0);
  }, [filters.stoBaru]);

  const selectedKategoriList = useMemo(() => {
    if (!filters.kategori) return [];
    return filters.kategori.split(",").map(s => s.trim()).filter(s => s.length > 0);
  }, [filters.kategori]);

  const filteredData = useMemo(() => {
    const { stoBaru, kategori } = filters;

    const stoList = stoBaru ? stoBaru.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];
    const kategoriList = kategori ? kategori.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];

    return DUMMY_DATA.map((region) => {
      const areas = region.areas.map((area) => {
        const stos = area.stos
          .filter((sto) => {
            if (stoList.length > 0 && !stoList.includes(sto.kode)) return false;
            return true;
          })
          .map((sto) => {
            let fd = sto.details;
            if (kategoriList.length > 0) {
              fd = fd.filter(d => kategoriList.includes(d.kategori));
            }
            
            const filteredDetails = filterDetails(fd, filters);
            const counts = getCountsFromDetails(filteredDetails);
            const total = CATEGORIES.reduce((sum, c) => sum + counts.INC[c] + counts.Lapsung[c], 0);
            return { ...sto, details: filteredDetails, counts, total };
          })
          .filter((sto) => sto.total > 0 || !hasDeepFilter);
        return { ...area, stos };
      }).filter((area) => area.stos.length > 0);
      return { ...region, areas };
    }).filter((region) => region.areas.length > 0);
  }, [DUMMY_DATA, filters, hasDeepFilter]);

  // --- CEK KOLOM MANA YANG VISIBLE (MEMILIKI DATA) ---
  const visibleColumns = useMemo(() => {
    const hasData: Record<string, boolean> = {
      "INC-Binding": false,
      "INC-GNO/REGFAIL": false,
      "INC-ROUTING": false,
      "INC-OG NOK": false,
      "Lapsung-Binding": false,
      "Lapsung-GNO/REGFAIL": false,
      "Lapsung-ROUTING": false,
      "Lapsung-OG NOK": false,
    };

    filteredData.forEach((region) => {
      region.areas.forEach((area) => {
        area.stos.forEach((sto) => {
          CATEGORIES.forEach((c) => {
            if (sto.counts.INC[c] > 0) {
              hasData[`INC-${c}`] = true;
            }
            if (sto.counts.Lapsung[c] > 0) {
              hasData[`Lapsung-${c}`] = true;
            }
          });
        });
      });
    });

    return hasData;
  }, [filteredData]);

  const isColumnVisible = (jenis: "INC" | "Lapsung", kategori: Category) => {
    return visibleColumns[`${jenis}-${kategori}`];
  };

  const getVisibleCategories = (jenis: "INC" | "Lapsung") => {
    return CATEGORIES.filter(c => isColumnVisible(jenis, c));
  };

  const hasIncData = getVisibleCategories("INC").length > 0;
  const hasLapsungData = getVisibleCategories("Lapsung").length > 0;

  function toggleRegion(name: string) {
    setCollapsedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function toggleArea(name: string) {
    setCollapsedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  const numberedRows = useMemo(() => {
    let counter = 0;
    const map = new Map<string, number>();
    filteredData.forEach((region) => {
      region.areas.forEach((area) => {
        area.stos.forEach((sto) => {
          counter += 1;
          map.set(`${area.name}-${sto.kode}`, counter);
        });
      });
    });
    return map;
  }, [filteredData]);

  const grandTotal = useMemo(() => {
    return filteredData.reduce((accR, region) => {
      const regionSum = region.areas.reduce((accA, area) => {
        const areaSum = area.stos.reduce((accS, sto) => addCounts(accS, sto.counts), createEmptyCounts());
        return addCounts(accA, areaSum);
      }, createEmptyCounts());
      return addCounts(accR, regionSum);
    }, createEmptyCounts());
  }, [filteredData]);

  if (session === null) return null;

  const thBase = "border border-border px-3 py-2.5 font-medium text-muted-foreground/80 whitespace-nowrap text-xs tracking-wide uppercase";
  const tdBase = "border border-border px-3 py-2.5 text-center whitespace-nowrap text-white text-sm tabular-nums";
  const tdMuted = "border border-border px-3 py-2.5 text-center whitespace-nowrap text-white/30 text-sm";
  const tdClickable = "border border-border px-3 py-2.5 text-center whitespace-nowrap text-white text-sm tabular-nums cursor-pointer hover:bg-white/10 transition-colors";
  const groupRowClass = "bg-muted/70 font-semibold";

  const getRowTotal = (counts: TicketCounts) => CATEGORIES.reduce((s, c) => s + counts.INC[c] + counts.Lapsung[c], 0);

  // Render cell yang clickable - TOTAL
  const renderTotalCell = (count: number, stoKode: string) => {
    if (count === 0) return <span className="text-white/30">–</span>;
    
    const stoList = selectedStoList.length > 0 ? selectedStoList : [stoKode];
    const url = buildSummarizeUrl(stoList, filters);
    
    return (
      <Link 
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat semua data di ${stoKode} (${count} data)}`}
      >
        {count}
      </Link>
    );
  };

  // Render cell clickable - Kategori spesifik
  const renderClickableCell = (
    count: number,
    stoKode?: string,
    type?: "INC" | "Lapsung",
    kategori?: Category,
    isTotal: boolean = false
  ) => {
    if (count === 0) return <span className="text-white/30">–</span>;
    
    let url: string;
    if (isTotal && stoKode) {
      const stoList = selectedStoList.length > 0 ? selectedStoList : [stoKode];
      url = buildSummarizeUrl(stoList, filters);
    } else if (stoKode && type && kategori) {
      const stoList = selectedStoList.length > 0 ? selectedStoList : [stoKode];
      url = buildSummarizeUrl(stoList, filters, type, kategori);
    } else {
      return <span className="text-white">{count}</span>;
    }
    
    return (
      <Link 
        href={url} 
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat detail ${count} data`}
      >
        {count}
      </Link>
    );
  };

  // Render clickable region total
  const renderRegionTotal = (counts: TicketCounts, regionName: string) => {
    const total = getRowTotal(counts);
    if (total === 0) return <span className="text-white/30">–</span>;
    
    const region = DUMMY_DATA.find(r => r.name === regionName);
    if (!region) return <span className="text-white">{total}</span>;
    
    let stoList = region.areas.flatMap(a => a.stos.map(s => s.kode));
    if (selectedStoList.length > 0) {
      stoList = stoList.filter(s => selectedStoList.includes(s));
    }
    
    const url = buildSummarizeUrl(stoList, filters);
    
    return (
      <Link 
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat semua data di ${regionName} (${total} data)`}
      >
        {total}
      </Link>
    );
  };

  // Render clickable area total
  const renderAreaTotal = (counts: TicketCounts, areaName: string) => {
    const total = getRowTotal(counts);
    if (total === 0) return <span className="text-white/30">–</span>;
    
    let areaStos: string[] = [];
    DUMMY_DATA.forEach(region => {
      region.areas.forEach(area => {
        if (area.name === areaName) {
          areaStos = area.stos.map(s => s.kode);
        }
      });
    });
    
    if (selectedStoList.length > 0) {
      areaStos = areaStos.filter(s => selectedStoList.includes(s));
    }
    
    if (areaStos.length === 0) return <span className="text-white">{total}</span>;
    
    const url = buildSummarizeUrl(areaStos, filters);
    
    return (
      <Link 
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat semua data di ${areaName} (${total} data)`}
      >
        {total}
      </Link>
    );
  };

  // Render clickable category di level Area
  const renderAreaCategory = (
    count: number,
    areaName: string,
    type: "INC" | "Lapsung",
    kategori: Category
  ) => {
    if (count === 0) return <span className="text-white/30">–</span>;
    
    let areaStos: string[] = [];
    DUMMY_DATA.forEach(region => {
      region.areas.forEach(area => {
        if (area.name === areaName) {
          areaStos = area.stos.map(s => s.kode);
        }
      });
    });
    
    if (selectedStoList.length > 0) {
      areaStos = areaStos.filter(s => selectedStoList.includes(s));
    }
    
    if (areaStos.length === 0) return <span className="text-white">{count}</span>;
    
    const url = buildSummarizeUrl(areaStos, filters, type, kategori);
    
    return (
      <Link 
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat data ${type} ${kategori} di ${areaName} (${count} data)`}
      >
        {count}
      </Link>
    );
  };

  // Render clickable category di level Region
  const renderRegionCategory = (
    count: number,
    regionName: string,
    type: "INC" | "Lapsung",
    kategori: Category
  ) => {
    if (count === 0) return <span className="text-white/30">–</span>;
    
    const region = DUMMY_DATA.find(r => r.name === regionName);
    if (!region) return <span className="text-white">{count}</span>;
    
    let stoList = region.areas.flatMap(a => a.stos.map(s => s.kode));
    if (selectedStoList.length > 0) {
      stoList = stoList.filter(s => selectedStoList.includes(s));
    }
    
    if (stoList.length === 0) return <span className="text-white">{count}</span>;
    
    const url = buildSummarizeUrl(stoList, filters, type, kategori);
    
    return (
      <Link 
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat data ${type} ${kategori} di ${regionName} (${count} data)`}
      >
        {count}
      </Link>
    );
  };

  // Render clickable kategori cell di level grand total
  const renderGrandTotalCategory = (
    count: number,
    type: "INC" | "Lapsung",
    kategori: Category
  ) => {
    if (count === 0) return <span className="text-white/30">–</span>;
    
    const allStos = DUMMY_DATA.flatMap(r => r.areas.flatMap(a => a.stos.map(s => s.kode)));
    const stoList = selectedStoList.length > 0
      ? allStos.filter(s => selectedStoList.includes(s))
      : allStos;
    
    if (stoList.length === 0) return <span className="text-white">{count}</span>;
    
    const url = buildSummarizeUrl(stoList, filters, type, kategori);
    
    return (
      <Link 
        href={url}
        className="font-bold text-white hover:text-white/80 hover:underline transition-colors block text-center"
        title={`Lihat data ${type} ${kategori} dari seluruh STO (${count} data)`}
      >
        {count}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <NavBar right={
        <div className="flex items-center gap-1.5">
          {selectedStoList.length > 0 && (
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
              {selectedStoList.join(", ")}
            </span>
          )}
          {loadingData && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
        </div>
      } />

      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <FilterBar 
            filters={filters} 
            onChange={setFilters} 
            onReset={() => setFilters(DEFAULT_FILTERS)} 
            stoOptions={stoOptions}
            kategoriOptions={kategoriOptions}
          />
        </div>

        {filteredData.length === 0 && !loadingData && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <p className="text-sm font-medium text-foreground">Tidak ada data</p>
            <p className="text-xs text-muted-foreground">Coba ubah atau reset filter</p>
          </div>
        )}

        {loadingData && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* animated progress bar */}
            <div className="relative h-1 w-full bg-muted overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                style={{ width: "40%", animation: "slideProgress 1.4s ease-in-out infinite" }} />
            </div>
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              {/* orbital spinner */}
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" style={{ animationDuration: "1s" }} />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" style={{ animationDuration: "0.75s", animationDirection: "reverse" }} />
                <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" style={{ animationDuration: "0.5s" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Memuat data STO...</p>
                <p className="text-xs text-muted-foreground mt-1">Mengambil data dari semua tabel</p>
              </div>
            </div>
            <style>{`@keyframes slideProgress{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
          </div>
        )}

        {filteredData.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/80">
                  <tr>
                    <th rowSpan={2} className={`${thBase} text-center`}>No</th>
                    <th rowSpan={2} className={`${thBase} text-left`}>STO</th>
                    
                    {hasIncData && (
                      <th colSpan={getVisibleCategories("INC").length} className={`${thBase} text-center`}>INC</th>
                    )}
                    
                    {hasLapsungData && (
                      <th colSpan={getVisibleCategories("Lapsung").length} className={`${thBase} text-center`}>LAPSUNG</th>
                    )}
                    
                    <th rowSpan={2} className={`${thBase} text-center`}>Total</th>
                  </tr>
                  <tr>
                    {hasIncData && getVisibleCategories("INC").map((c) => (
                      <th key={`inc-th-${c}`} className={`${thBase} text-center`}>{c}</th>
                    ))}
                    
                    {hasLapsungData && getVisibleCategories("Lapsung").map((c) => (
                      <th key={`lap-th-${c}`} className={`${thBase} text-center`}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((region) => {
                    const regionCollapsed = collapsedRegions.has(region.name);
                    const regionCounts = region.areas.reduce((accA, area) => {
                      const areaSum = area.stos.reduce((accS, sto) => addCounts(accS, sto.counts), createEmptyCounts());
                      return addCounts(accA, areaSum);
                    }, createEmptyCounts());

                    return (
                      <Fragment key={region.name}>
                        <tr className={groupRowClass}>
                          <td className={`${tdBase} text-center`}>
                            <button 
                              onClick={() => toggleRegion(region.name)} 
                              className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-xs text-white hover:bg-white/10 transition-colors"
                            >
                              {regionCollapsed ? "+" : "−"}
                            </button>
                          </td>
                          <td className={`${tdBase} text-left font-semibold text-white`}>{region.name}</td>
                          
                          {hasIncData && getVisibleCategories("INC").map((c) => {
                            const val = regionCounts.INC[c];
                            return (
                              <td key={`r-inc-${c}`} className={val ? tdClickable : tdMuted}>
                                {val ? renderRegionCategory(val, region.name, "INC", c) : "–"}
                              </td>
                            );
                          })}
                          
                          {hasLapsungData && getVisibleCategories("Lapsung").map((c) => {
                            const val = regionCounts.Lapsung[c];
                            return (
                              <td key={`r-lap-${c}`} className={val ? tdClickable : tdMuted}>
                                {val ? renderRegionCategory(val, region.name, "Lapsung", c) : "–"}
                              </td>
                            );
                          })}
                          
                          <td className={`${tdBase} font-semibold`}>
                            {renderRegionTotal(regionCounts, region.name)}
                          </td>
                        </tr>

                        {!regionCollapsed &&
                          region.areas.map((area) => {
                            const areaCollapsed = collapsedAreas.has(area.name);
                            const areaCounts = area.stos.reduce((accS, sto) => addCounts(accS, sto.counts), createEmptyCounts());

                            return (
                              <Fragment key={area.name}>
                                <tr className={groupRowClass}>
                                  <td className={`${tdBase} text-center`}>
                                    <button 
                                      onClick={() => toggleArea(area.name)} 
                                      className="flex h-6 w-6 items-center justify-center rounded border border-border/60 text-xs text-white hover:bg-white/10 transition-colors"
                                    >
                                      {areaCollapsed ? "+" : "−"}
                                    </button>
                                  </td>
                                  <td className={`${tdBase} text-left font-semibold text-white pl-6`}>{area.name}</td>
                                  
                                  {hasIncData && getVisibleCategories("INC").map((c) => {
                                    const val = areaCounts.INC[c];
                                    return (
                                      <td key={`a-inc-${c}`} className={val ? tdClickable : tdMuted}>
                                        {val ? renderAreaCategory(val, area.name, "INC", c) : "–"}
                                      </td>
                                    );
                                  })}
                                  
                                  {hasLapsungData && getVisibleCategories("Lapsung").map((c) => {
                                    const val = areaCounts.Lapsung[c];
                                    return (
                                      <td key={`a-lap-${c}`} className={val ? tdClickable : tdMuted}>
                                        {val ? renderAreaCategory(val, area.name, "Lapsung", c) : "–"}
                                      </td>
                                    );
                                  })}
                                  
                                  <td className={`${tdBase} font-semibold`}>
                                    {renderAreaTotal(areaCounts, area.name)}
                                  </td>
                                </tr>

                                {!areaCollapsed &&
                                  area.stos.map((sto, idx) => {
                                    const rowNumber = numberedRows.get(`${area.name}-${sto.kode}`);
                                    return (
                                      <tr key={`${area.name}-${sto.kode}`} className="hover:bg-white/[0.02] transition-colors">
                                        <td className={tdBase}>{rowNumber}</td>
                                        <td className={`${tdBase} text-left pl-10`}>{sto.kode}</td>
                                        
                                        {hasIncData && getVisibleCategories("INC").map((c) => {
                                          const val = sto.counts.INC[c];
                                          return (
                                            <td key={`s-inc-${c}`} className={val ? tdClickable : tdMuted}>
                                              {val ? renderClickableCell(val, sto.kode, "INC", c) : "–"}
                                            </td>
                                          );
                                        })}
                                        
                                        {hasLapsungData && getVisibleCategories("Lapsung").map((c) => {
                                          const val = sto.counts.Lapsung[c];
                                          return (
                                            <td key={`s-lap-${c}`} className={val ? tdClickable : tdMuted}>
                                              {val ? renderClickableCell(val, sto.kode, "Lapsung", c) : "–"}
                                            </td>
                                          );
                                        })}
                                        
                                        <td className={tdBase}>
                                          {renderTotalCell(getRowTotal(sto.counts), sto.kode)}
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

                  {/* GRAND TOTAL ROW */}
                  <tr className="bg-muted/70 font-semibold border-t-2 border-border">
                    <td colSpan={2} className={`${tdBase} text-left font-bold text-white`}>GRAND TOTAL</td>
                    
                    {hasIncData && getVisibleCategories("INC").map((c) => {
                      const val = grandTotal.INC[c];
                      return (
                        <td key={`gt-inc-${c}`} className={val ? tdClickable : tdMuted}>
                          {val ? renderGrandTotalCategory(val, "INC", c) : "–"}
                        </td>
                      );
                    })}
                    
                    {hasLapsungData && getVisibleCategories("Lapsung").map((c) => {
                      const val = grandTotal.Lapsung[c];
                      return (
                        <td key={`gt-lap-${c}`} className={val ? tdClickable : tdMuted}>
                          {val ? renderGrandTotalCategory(val, "Lapsung", c) : "–"}
                        </td>
                      );
                    })}
                    
                    <td className={`${tdBase} font-bold`}>
                      {selectedStoList.length > 0 ? (
                        <Link 
                          href={buildSummarizeUrl(selectedStoList, filters)}
                          className="text-white hover:text-white/80 hover:underline transition-colors block text-center"
                          title={`Lihat semua data dari ${selectedStoList.join(", ")} (${getRowTotal(grandTotal)} data)`}
                        >
                          {getRowTotal(grandTotal)}
                        </Link>
                      ) : (
                        <Link 
                          href={buildSummarizeUrl(["all"], filters)}
                          className="text-white hover:text-white/80 hover:underline transition-colors block text-center"
                          title={`Lihat semua data (${getRowTotal(grandTotal)} data)`}
                        >
                          {getRowTotal(grandTotal)}
                        </Link>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
