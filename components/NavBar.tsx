"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/table_detail", label: "Table Detail" },
  { href: "/kategori_binding", label: "Kategori Binding" },
];

interface Props { right?: React.ReactNode; }

export default function NavBar({ right }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full px-3 py-2 sm:px-6 sm:py-2.5">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between rounded-2xl px-3 sm:px-4 shadow-xl"
        style={{ background: "rgba(10,15,30,0.88)", backdropFilter: "blur(20px)", border: "1px solid rgba(59,130,246,0.12)" }}>

        {/* Logo */}
        <Link href="/dashboard" className="group flex items-center gap-2 select-none">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
            style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6l3-3 3 3v6M3 21h18" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-wider uppercase text-white">Binding</span>
        </Link>

        {/* Center nav — desktop */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 sm:flex items-center gap-1 rounded-full p-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {LINKS.map(({ href, label }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className="px-4 py-1.5 text-[11px] font-medium rounded-full transition-all duration-200"
                style={{
                  color: active ? "#fff" : "rgba(148,163,184,0.9)",
                  background: active ? "linear-gradient(135deg,rgba(37,99,235,0.9),rgba(79,70,229,0.9))" : "transparent",
                }}>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: slot + hamburger */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">{right}</div>
          {/* Hamburger — mobile only */}
          <button className="flex sm:hidden h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
            onClick={() => setOpen(o => !o)}>
            {open
              ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden mx-3 mt-1 rounded-2xl overflow-hidden shadow-xl"
          style={{ background: "rgba(10,15,30,0.97)", border: "1px solid rgba(59,130,246,0.12)" }}>
          {LINKS.map(({ href, label }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  color: active ? "#60a5fa" : "rgba(148,163,184,0.9)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: active ? "rgba(59,130,246,0.08)" : "transparent",
                }}>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                {label}
              </Link>
            );
          })}
          {right && <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>{right}</div>}
        </div>
      )}
    </header>
  );
}
