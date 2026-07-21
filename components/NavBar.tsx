"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/table_detail", label: "Table Detail" },
  { href: "/kategori_binding", label: "Kategori Binding" },
];

interface Props { right?: React.ReactNode; }

export default function NavBar({ right }: Props) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 w-full px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex h-11 max-w-7xl items-center justify-between rounded-2xl border border-white/[0.08] px-4 shadow-lg backdrop-blur-md" style={{ background: "rgba(15,23,42,0.92)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/40">
            <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6l3-3 3 3v6M3 21h18" />
            </svg>
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-white select-none">Binding</span>
        </div>

        {/* Center nav pill */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 sm:flex items-center gap-0.5 rounded-full border border-white/[0.08] px-1.5 py-1" style={{ background: "rgba(255,255,255,0.05)" }}>
          {LINKS.map(({ href, label }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={`rounded-full px-3.5 py-1 text-[11px] font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right slot */}
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
