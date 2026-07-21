// lib/supabaseClient.ts
//
// ⚠️ PENTING: pakai ANON KEY di sini, JANGAN pakai SUPABASE_KEY (service role
// key) yang dipakai di bot.js! Service role key itu bypass semua RLS policy
// -- kalau dipakai di browser, SIAPA SAJA yang buka dashboard bisa akses
// data mentah-mentah tanpa perlu login sama sekali (key-nya keliatan di
// Network tab browser).
//
// Ambil ANON KEY dari: Supabase Dashboard > Project Settings > API > anon public
//
// .env.local kamu:
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set di .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);