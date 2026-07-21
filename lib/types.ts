// lib/types.ts

export interface CaptureTicket {
  id: string;
  created_at: string;
  telegram_user_id: number;
  telegram_username: string | null;
  telegram_chat_id: number;
  raw_text: string;
  photo_urls: string[] | null;
  jenis: string;
  nomor_tiket: string | null;
  no_service: string;
  clid_lama: string;
  clid_baru: string;
  sto_lama: string | null;
  sto_baru: string | null;
  domain: string;
  alasan_binding: string;
}

export interface CaptureFilters {
  search: string;
  jenis: string;
  stoLama: string;
  stoBaru: string; // Bisa berisi comma-separated values untuk multiple STO
  domain: string;
  dateFrom: string;
  dateTo: string;
  kategori?: string; // Tambahkan untuk multiple kategori
}

export const EMPTY_FILTERS: CaptureFilters = {
  search: "",
  jenis: "",
  stoLama: "",
  stoBaru: "",
  domain: "",
  dateFrom: "",
  dateTo: "",
  kategori: "",
};