"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-18v6h8V3h-8z" },
  { href: "/table_detail", label: "Summarize", icon: "M4 5h16M4 12h16M4 19h16" },
  { href: "/kategori_binding", label: "Kategori Binding", icon: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" },
  { href: "/storage", label: "Storage", icon: "M4 5h16v14H4zM8 9h8M8 13h5" },
];

interface Props { right?: React.ReactNode; }

function Icon({ path, className = "h-5 w-5" }: { path: string; className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>;
}

export default function NavBar({ right }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<{ email: string; initials: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email ?? "";
      const username = email.split("@")[0];
      setAccount(username ? { email: username, initials: username.slice(0, 2).toUpperCase() } : null);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 shadow-2xl backdrop-blur-xl sm:flex">
        <Link href="/dashboard" className="group mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/30 transition-transform group-hover:scale-105">
            <Icon path="M9 17v-6l3-3 3 3v6M3 21h18" className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">Binding</p><p className="text-[11px] text-muted-foreground">Capture Dashboard</p></div>
        </Link>

        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Menu</p>
        <nav className="space-y-1">
          {LINKS.map(({ href, label, icon }) => (
            <Link key={href} href={href} className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${active(href) ? "bg-primary/15 text-primary shadow-inner shadow-primary/5" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"}`}>
              {active(href) && <span className="absolute -left-4 h-7 w-1 rounded-r-full bg-primary" />}
              <Icon path={icon} className={`h-5 w-5 ${active(href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-border bg-foreground/[0.04] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">{account?.initials ?? ".."}</div>
              <div className="min-w-0"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Signed in</p><p className="truncate text-xs text-foreground">{account?.email ?? "Loading..."}</p></div>
            </div>
            <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/10 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Icon path="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" className="h-4 w-4" /> Logout</button>
          </div>
        </div>
      </aside>

      {/* Mobile navigation — unchanged behavior */}
      <header className="sticky top-0 z-40 w-full px-3 py-2 sm:hidden">
        <div className="mx-auto flex h-12 items-center justify-between rounded-xl border border-sidebar-border bg-sidebar/90 px-3 shadow-xl backdrop-blur-xl">
          <Link href="/dashboard" className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600"><Icon path="M9 17v-6l3-3 3 3v6M3 21h18" className="h-3.5 w-3.5 text-white" /></div><span className="text-sm font-bold uppercase tracking-wider text-foreground">Binding</span></Link>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.06] text-foreground" onClick={() => setOpen(o => !o)} aria-label="Buka menu"><Icon path={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} className="h-4 w-4" /></button>
        </div>
      </header>
      {open && <div className="mx-3 mt-1 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar/95 shadow-xl sm:hidden">
        {LINKS.map(({ href, label, icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 border-b border-border px-4 py-3 text-sm font-medium ${active(href) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Icon path={icon} className="h-4 w-4" />{label}</Link>)}
        {right && <div className="border-t border-border px-4 py-3">{right}</div>}
      </div>}
    </>
  );
}
