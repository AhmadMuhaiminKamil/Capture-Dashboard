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
      {/* outer glow line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none" />

      <div
        className="mx-auto flex h-12 max-w-7xl items-center justify-between rounded-2xl px-4 shadow-xl"
        style={{
          background: "rgba(10,15,30,0.88)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(59,130,246,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="group flex items-center gap-2.5 select-none">
          <div
            className="relative flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)", boxShadow: "0 0 0 0 rgba(59,130,246,0.4)" }}
          >
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6l3-3 3 3v6M3 21h18" />
            </svg>
            {/* pulse ring */}
            <span className="absolute inset-0 rounded-xl animate-ping opacity-20" style={{ background: "#3b82f6" }} />
          </div>
          <span className="text-sm font-bold tracking-wider uppercase text-white transition-colors duration-200 group-hover:text-blue-300">
            Binding
          </span>
        </Link>

        {/* Center nav */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 sm:flex items-center gap-1 rounded-full p-1"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {LINKS.map(({ href, label }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className="relative group px-4 py-1.5 text-[11px] font-medium rounded-full transition-all duration-200 overflow-hidden"
                style={{
                  color: active ? "#fff" : "rgba(148,163,184,0.9)",
                  background: active ? "linear-gradient(135deg,rgba(37,99,235,0.9),rgba(79,70,229,0.9))" : "transparent",
                  boxShadow: active ? "0 2px 12px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                }}
              >
                {/* shimmer on hover (inactive only) */}
                {!active && (
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                )}
                {/* hover bg */}
                {!active && (
                  <span className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ background: "rgba(255,255,255,0.06)" }} />
                )}
                <span className="relative flex items-center gap-1.5">
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" style={{ animationDuration: "2s" }} />
                  )}
                  {label}
                </span>
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
