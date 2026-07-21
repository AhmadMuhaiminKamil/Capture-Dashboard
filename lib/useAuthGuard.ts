// lib/useAuthGuard.ts
//
// Guard sederhana sisi client: cek session Supabase, redirect ke /login
// kalau belum login. Cukup buat internal tool kayak ini; kalau nanti mau
// lebih ketat (proteksi di server sebelum halaman ke-render sama sekali),
// bisa upgrade ke middleware.ts pakai @supabase/ssr.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

// undefined = masih loading, null = tidak ada session (lagi redirect),
// Session = sudah login
export function useAuthGuard(): Session | null | undefined {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setSession(data.session);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        router.replace("/login");
      } else {
        setSession(newSession);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  return session;
}