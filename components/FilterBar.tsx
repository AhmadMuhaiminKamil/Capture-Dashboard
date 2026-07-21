// components/FilterBar.tsx
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { CaptureFilters } from "@/lib/types";

interface FilterBarProps {
  filters: CaptureFilters;
  onChange: (filters: CaptureFilters) => void;
  onReset: () => void;
  stoOptions?: string[];
  kategoriOptions?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const MONTH_FULL  = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAY_LABEL   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const KATEGORI_OPTIONS = ["Binding", "GNO/REGFAIL", "ROUTING", "OG NOK"];
const JENIS_OPTIONS = ["INC", "Lapsung"];
const DOMAIN_OPTIONS = ["@telkom.net", "@gmail.com", "@yahoo.com", "@indihome.co.id"];

function pad2(n: number) { return String(n).padStart(2, "0"); }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad2(m)}-${pad2(d)}`; }
function parseDate(s: string): { y: number; m: number; d: number } | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function calendarDays(y: number, m: number): (number | null)[] {
  const first = new Date(y, m - 1, 1).getDay();
  const days  = daysInMonth(y, m);
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}
function todayStr() {
  const n = new Date();
  return toDateStr(n.getFullYear(), n.getMonth() + 1, n.getDate());
}
function formatDisplay(dateStr: string) {
  const p = parseDate(dateStr);
  if (!p) return "";
  return `${p.d} ${MONTH_SHORT[p.m - 1]} ${p.y}`;
}
function isSameDay(a: string, b: string) { return a === b; }
function isBetween(d: string, from: string, to: string) { return d > from && d < to; }

// ─── Sub-components ──────────────────────────────────────────────────────────

interface CalendarPanelProps {
  picking: "from" | "to";
  dateFrom: string;
  dateTo: string;
  onSelectDay: (dateStr: string) => void;
}

function CalendarPanel({ picking, dateFrom, dateTo, onSelectDay }: CalendarPanelProps) {
  const today = todayStr();
  const initDate = parseDate(picking === "from" ? (dateFrom || today) : (dateTo || today));
  const [viewY, setViewY] = useState(initDate?.y ?? new Date().getFullYear());
  const [viewM, setViewM] = useState(initDate?.m ?? new Date().getMonth() + 1);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const cells = calendarDays(viewY, viewM);

  function prevMonth() {
    if (viewM === 1) { setViewM(12); setViewY(y => y - 1); }
    else setViewM(m => m - 1);
  }
  function nextMonth() {
    if (viewM === 12) { setViewM(1); setViewY(y => y + 1); }
    else setViewM(m => m + 1);
  }

  function dayClass(d: number) {
    const str = toDateStr(viewY, viewM, d);
    const isFrom    = dateFrom && isSameDay(str, dateFrom);
    const isTo      = dateTo   && isSameDay(str, dateTo);
    const inRange   = dateFrom && dateTo && isBetween(str, dateFrom, dateTo);
    const isToday   = isSameDay(str, today);
    const isInvalid = picking === "to" && dateFrom && str < dateFrom;

    if (isFrom || isTo)
      return "bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm";
    if (inRange)
      return "bg-primary/15 text-primary font-medium rounded-none";
    if (isToday)
      return "ring-2 ring-primary/40 ring-offset-1 rounded-lg font-semibold text-primary";
    if (isInvalid)
      return "text-muted-foreground/30 cursor-not-allowed";
    return "text-foreground hover:bg-accent rounded-lg";
  }

  return (
    <div className="w-72 select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <button
          type="button"
          onClick={() => setShowMonthPicker(v => !v)}
          className="text-sm font-semibold text-foreground hover:text-primary transition px-2 py-1 rounded-lg hover:bg-accent"
        >
          {MONTH_FULL[viewM - 1]} {viewY}
        </button>

        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {showMonthPicker ? (
        <div className="animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setViewY(y => y - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-sm font-bold text-foreground">{viewY}</span>
            <button type="button" onClick={() => setViewY(y => y + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {MONTH_SHORT.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => { setViewM(idx + 1); setShowMonthPicker(false); }}
                className={`py-1.5 rounded-lg text-xs font-medium transition ${viewM === idx + 1 ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-accent"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABEL.map(l => (
              <div key={l} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{l}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;
              const str = toDateStr(viewY, viewM, d);
              const isInvalid = picking === "to" && dateFrom && str < dateFrom;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!!isInvalid}
                  onClick={() => onSelectDay(str)}
                  className={`h-8 w-full text-sm transition ${dayClass(d)}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Multi-Select Dropdown ───────────────────────────────────────────────────

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  tagColor?: string;
}

function MultiSelect({ 
  label, 
  options, 
  selected, 
  onChange, 
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  tagColor = "primary"
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter(s => s !== option));
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const tagColors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    purple: "bg-purple-500/10 text-purple-600",
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-green-500/10 text-green-600",
    orange: "bg-orange-500/10 text-orange-600",
    red: "bg-red-500/10 text-red-600",
  };

  const tagClass = tagColors[tagColor] || tagColors.primary;

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
      </label>
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex min-h-[38px] w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:border-muted-foreground/50 transition-colors">
          <span className="truncate text-xs">
            {selected.length === 0 
              ? placeholder
              : `${selected.length} terpilih`}
          </span>
          <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(item => (
            <span key={item} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tagClass}`}>
              {item}
              <button 
                onClick={(e) => { e.stopPropagation(); removeOption(item); }}
                className="hover:text-destructive transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-border/50">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Tidak ada opsi</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                  onClick={(e) => { e.stopPropagation(); toggleOption(option); }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>{option}</span>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border/50 p-2 flex gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); selectAll(); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Pilih Semua
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Hapus Semua
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main FilterBar ───────────────────────────────────────────────────────────

export default function FilterBar({ 
  filters, 
  onChange, 
  onReset, 
  stoOptions = [],
  kategoriOptions = KATEGORI_OPTIONS
}: FilterBarProps) {
  const today = todayStr();
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || today);
  const [dateTo, setDateTo] = useState(filters.dateTo || today);
  const [activePicker, setActivePicker] = useState<"from" | "to" | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Parse selected STO dan Kategori dari filters
  const selectedStos = useMemo(() => {
    if (!filters.stoBaru) return [];
    return filters.stoBaru.split(",").map(s => s.trim()).filter(Boolean);
  }, [filters.stoBaru]);

  const selectedKategoris = useMemo(() => {
    if (!filters.kategori) return [];
    return filters.kategori.split(",").map(s => s.trim()).filter(Boolean);
  }, [filters.kategori]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setActivePicker(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!filters.dateFrom && !filters.dateTo) {
      onChange({ ...filters, dateFrom: today, dateTo: today });
    }
  }, []);

  function applyDates(from: string, to: string) {
    onChange({ ...filters, dateFrom: from, dateTo: to });
  }

  function handleSelectDay(dateStr: string) {
    if (activePicker === "from") {
      const newFrom = dateStr;
      const newTo = dateTo < dateStr ? dateStr : dateTo;
      setDateFrom(newFrom);
      setDateTo(newTo);
      applyDates(newFrom, newTo);
      setActivePicker("to");
    } else {
      setDateTo(dateStr);
      applyDates(dateFrom, dateStr);
      setActivePicker(null);
    }
  }

  function handleReset() {
    setDateFrom(today);
    setDateTo(today);
    setActivePicker(null);
    onReset();
  }

  function update<K extends keyof CaptureFilters>(key: K, value: CaptureFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function updateStos(stos: string[]) {
    update("stoBaru", stos.join(","));
  }

  function updateKategoris(kategoris: string[]) {
    update("kategori", kategoris.join(","));
  }

  const activeCount = [
    filters.search,
    filters.jenis,
    filters.stoBaru,
    filters.kategori,
    filters.domain,
    filters.dateFrom,
  ].filter(Boolean).length;

  const labelClass = "text-xs font-medium text-muted-foreground";
  const controlClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

  const isSameDate = dateFrom === dateTo;
  const rangeLabel = isSameDate
    ? formatDisplay(dateFrom)
    : `${formatDisplay(dateFrom)} – ${formatDisplay(dateTo)}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Filter Data</h2>
            {activeCount > 0 && (
              <p className="text-xs text-muted-foreground">{activeCount} filter aktif</p>
            )}
          </div>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset Filter
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          placeholder="Cari No Service / No Tiket / Alasan..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className={`${controlClass} pl-9`}
        />
      </div>

      {/* Grid filter utama */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Jenis */}
        <div className="space-y-1.5">
          <label className={labelClass}>Jenis Tiket</label>
          <select
            value={filters.jenis}
            onChange={(e) => update("jenis", e.target.value)}
            className={controlClass}
          >
            <option value="">Semua Jenis</option>
            {JENIS_OPTIONS.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        {/* STO - Multi Select */}
        <div className="space-y-1.5">
          <MultiSelect
            label="STO"
            options={stoOptions}
            selected={selectedStos}
            onChange={updateStos}
            placeholder="Pilih STO..."
            searchPlaceholder="Cari STO..."
            tagColor="primary"
          />
        </div>

        {/* Kategori - Multi Select */}
        <div className="space-y-1.5">
          <MultiSelect
            label="Kategori"
            options={kategoriOptions}
            selected={selectedKategoris}
            onChange={updateKategoris}
            placeholder="Pilih Kategori..."
            searchPlaceholder="Cari Kategori..."
            tagColor="purple"
          />
        </div>

        {/* Domain */}
        <div className="space-y-1.5">
          <label className={labelClass}>Domain</label>
          <select
            value={filters.domain}
            onChange={(e) => update("domain", e.target.value)}
            className={controlClass}
          >
            <option value="">Semua Domain</option>
            {DOMAIN_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="text-sm font-medium text-foreground">Rentang Tanggal</span>
        </div>

        <div ref={pickerRef} className="relative">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className={labelClass}>Dari Tanggal</label>
              <button
                type="button"
                onClick={() => setActivePicker(p => p === "from" ? null : "from")}
                className={`${controlClass} flex items-center gap-2 text-left transition ${activePicker === "from" ? "border-ring ring-2 ring-ring/30" : ""}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-muted-foreground">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span className={dateFrom ? "text-foreground text-xs" : "text-muted-foreground text-xs"}>
                  {dateFrom ? formatDisplay(dateFrom) : "Pilih tanggal"}
                </span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Sampai Tanggal</label>
              <button
                type="button"
                onClick={() => setActivePicker(p => p === "to" ? null : "to")}
                className={`${controlClass} flex items-center gap-2 text-left transition ${activePicker === "to" ? "border-ring ring-2 ring-ring/30" : ""}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-muted-foreground">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span className={dateTo ? "text-foreground text-xs" : "text-muted-foreground text-xs"}>
                  {dateTo ? formatDisplay(dateTo) : "Pilih tanggal"}
                </span>
              </button>
            </div>
          </div>

          {(dateFrom || dateTo) && (
            <p className="mt-2 text-xs text-muted-foreground">
              Menampilkan:{" "}
              <span className="font-medium text-foreground">{rangeLabel}</span>
            </p>
          )}

          {activePicker && (
            <div className="absolute left-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-4 shadow-2xl animate-in fade-in-0 slide-in-from-top-2 duration-150">
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-primary/8 px-3 py-2">
                <div className={`h-2 w-2 rounded-full ${activePicker === "from" ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`}/>
                <span className="text-xs text-muted-foreground">
                  {activePicker === "from" ? "Pilih tanggal mulai" : "Pilih tanggal akhir"}
                </span>
                <div className={`ml-auto h-2 w-2 rounded-full ${activePicker === "to" ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`}/>
              </div>

              <CalendarPanel
                picking={activePicker}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onSelectDay={handleSelectDay}
              />

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                {[
                  { label: "Hari Ini", action: () => { const t=todayStr(); setDateFrom(t); setDateTo(t); applyDates(t,t); setActivePicker(null); } },
                  { label: "7 Hari Terakhir", action: () => { const t=new Date(); const f=new Date(t); f.setDate(t.getDate()-6); const fs=toDateStr(f.getFullYear(),f.getMonth()+1,f.getDate()); const ts=toDateStr(t.getFullYear(),t.getMonth()+1,t.getDate()); setDateFrom(fs); setDateTo(ts); applyDates(fs,ts); setActivePicker(null); } },
                  { label: "Bulan Ini", action: () => { const t=new Date(); const fs=toDateStr(t.getFullYear(),t.getMonth()+1,1); const ts=toDateStr(t.getFullYear(),t.getMonth()+1,daysInMonth(t.getFullYear(),t.getMonth()+1)); setDateFrom(fs); setDateTo(ts); applyDates(fs,ts); setActivePicker(null); } },
                  { label: "Bulan Lalu", action: () => { const t=new Date(); const pm=t.getMonth()===0?12:t.getMonth(); const py=t.getMonth()===0?t.getFullYear()-1:t.getFullYear(); const fs=toDateStr(py,pm,1); const ts=toDateStr(py,pm,daysInMonth(py,pm)); setDateFrom(fs); setDateTo(ts); applyDates(fs,ts); setActivePicker(null); } },
                ].map(s => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={s.action}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground border border-border"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {(selectedStos.length > 0 || selectedKategoris.length > 0 || filters.jenis || filters.domain) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          {selectedStos.length > 0 && (
            <span className="text-xs text-muted-foreground">
              STO: <span className="font-medium text-foreground">{selectedStos.join(", ")}</span>
            </span>
          )}
          {selectedKategoris.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Kategori: <span className="font-medium text-foreground">{selectedKategoris.join(", ")}</span>
            </span>
          )}
          {filters.jenis && (
            <span className="text-xs text-muted-foreground">
              Jenis: <span className="font-medium text-foreground">{filters.jenis}</span>
            </span>
          )}
          {filters.domain && (
            <span className="text-xs text-muted-foreground">
              Domain: <span className="font-medium text-foreground">{filters.domain}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}