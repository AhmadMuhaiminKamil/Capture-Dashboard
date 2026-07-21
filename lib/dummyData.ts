// lib/dummyData.ts
export const CATEGORIES_ALL = ["Binding", "GNO/REGFAIL", "ROUTING", "OG NOK"] as const;
export type Category = typeof CATEGORIES_ALL[number];

export interface BindingDetail {
  id: string;
  tanggal: string;
  tanggalRaw: Date;
  jenis: "INC" | "Lapsung";
  kategori: string;
  noTiket: string;
  noService: string;
  stoLama: string;
  stoBaru: string;
  domain: string;
  alasanBinding: string;
  fotoUrl?: string;
  fotoUrls?: string[];
}

export interface TicketDetail extends BindingDetail {
  alasan: string;
}

const DOMAINS = ["@telkom.net", "@gmail.com", "@yahoo.com", "@indihome.co.id"];

export const STOS_LIST = [
  "CID", "CPP", "GBC", "GBI", "KMY",
  "BIN", "CPE", "JAG", "KAL", "KBY", "KMG", "PSM", "TBE",
  "CWA", "GAN", "JTN", "KLD", "KRG", "PDK", "PGB", "PGG", "PSR", "RMG",
];

// Helper untuk generate random number dengan seed
let seed = 42;
const seededRandom = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const seededRandomInt = (min: number, max: number) => {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
};

// Helper untuk generate random date di bulan Juli 2026
const randomDate = (seedVal: number) => {
  const day = seededRandomInt(1, 31);
  const hour = seededRandomInt(0, 23);
  const minute = seededRandomInt(0, 59);
  const second = seededRandomInt(0, 59);
  return new Date(2026, 6, day, hour, minute, second);
};

// Helper untuk generate multiple foto (1-6 foto)
const generateFotoUrls = (seed: number, count: number): string[] => {
  const urls: string[] = [];
  const numPhotos = seededRandomInt(1, Math.min(count, 6));
  for (let i = 0; i < numPhotos; i++) {
    urls.push(`https://picsum.photos/seed/${seed + i}/400/300`);
  }
  return urls;
};

// Generate DUMMY_DETAILS
export const DUMMY_DETAILS: BindingDetail[] = [];
let counter = 1;

// Reset seed untuk konsistensi
seed = 42;

// Buat data Lapsung untuk SEMUA kategori
STOS_LIST.forEach((kode) => {
  CATEGORIES_ALL.forEach((kategori) => {
    const count = seededRandomInt(5, 15);
    
    for (let i = 0; i < count; i++) {
      const date = randomDate(counter + i);
      const hasFoto = seededRandom() > 0.5;
      
      let alasan = "";
      if (kategori === "Binding") {
        const alasanList = [
          "Mintol pindah odp ODP LAMA rusak",
          "Instalasi ulang perangkat",
          "Pengamanan Pelanggan",
          "Ganti ONT",
          "Gamas",
          "Order PDA baru",
          "PDA rusak",
          "ONT rusak",
          "Pedestrian",
          "Pelanggan minta ganti IP",
          "Reschedule",
        ];
        alasan = alasanList[i % alasanList.length];
      } else if (kategori === "GNO/REGFAIL") {
        const alasanList = [
          "Gangguan jaringan distribusi",
          "Perbaikan jaringan backbone",
          "Konfigurasi ulang VLAN",
          "Gangguan sinyal",
          "Redaman tinggi",
          "Konektor kotor",
        ];
        alasan = alasanList[i % alasanList.length];
      } else if (kategori === "ROUTING") {
        const alasanList = [
          "Migrasi pelanggan ke ODP baru",
          "Gangguan fisik kabel optik",
          "Routing error",
          "IP conflict",
          "VLAN mismatch",
        ];
        alasan = alasanList[i % alasanList.length];
      } else if (kategori === "OG NOK") {
        const alasanList = [
          "Kabel putus akibat proyek galian",
          "ODP penuh tidak ada port",
          "Kabel terbakar",
          "Konektor kotor",
          "Power supply mati",
        ];
        alasan = alasanList[i % alasanList.length];
      }
      
      DUMMY_DETAILS.push({
        id: `Lapsung-${kode}-${String(counter).padStart(4, "0")}`,
        tanggal: date.toLocaleString("id-ID", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
        tanggalRaw: date,
        jenis: "Lapsung",
        kategori: kategori,
        noTiket: `LAP-${kode}-${String(counter).padStart(4, "0")}`,
        noService: `1221${String(10000000 + counter * 77 + i).slice(0, 8)}`,
        stoLama: kode,
        stoBaru: kode,
        domain: DOMAINS[counter % DOMAINS.length],
        alasanBinding: alasan,
        fotoUrls: hasFoto ? generateFotoUrls(counter + i, 6) : undefined,
      });
      counter++;
    }
  });
});

// Buat data INC untuk SEMUA kategori - PERBAIKAN!
STOS_LIST.forEach((kode) => {
  CATEGORIES_ALL.forEach((kategori) => {
    const count = seededRandomInt(5, 15);
    
    for (let i = 0; i < count; i++) {
      const date = randomDate(counter + i);
      const hasFoto = seededRandom() > 0.5;
      
      let alasan = "";
      if (kategori === "Binding") {
        const alasanList = [
          "Mintol pindah odp ODP LAMA rusak",
          "Instalasi ulang perangkat",
          "Pengamanan Pelanggan",
          "Ganti ONT",
          "Gamas",
          "Order PDA baru",
          "PDA rusak",
          "ONT rusak",
          "Pedestrian",
        ];
        alasan = alasanList[i % alasanList.length];
      } else if (kategori === "GNO/REGFAIL") {
        const alasanList = [
          "Gangguan jaringan distribusi",
          "Perbaikan jaringan backbone",
          "Konfigurasi ulang VLAN",
          "Gangguan sinyal",
          "Redaman tinggi",
        ];
        alasan = alasanList[i % alasanList.length];
      } else if (kategori === "ROUTING") {
        const alasanList = [
          "Migrasi pelanggan ke ODP baru",
          "Gangguan fisik kabel optik",
          "Routing error",
          "IP conflict",
        ];
        alasan = alasanList[i % alasanList.length];
      } else if (kategori === "OG NOK") {
        const alasanList = [
          "Kabel putus akibat proyek galian",
          "ODP penuh tidak ada port",
          "Kabel terbakar",
          "Konektor kotor",
        ];
        alasan = alasanList[i % alasanList.length];
      }
      
      DUMMY_DETAILS.push({
        id: `INC-${kode}-${String(counter).padStart(4, "0")}`,
        tanggal: date.toLocaleString("id-ID", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
        tanggalRaw: date,
        jenis: "INC",
        kategori: kategori,
        noTiket: `INC-${kode}-${String(counter).padStart(4, "0")}`,
        noService: `1221${String(10000000 + counter * 77 + i).slice(0, 8)}`,
        stoLama: kode,
        stoBaru: kode,
        domain: DOMAINS[counter % DOMAINS.length],
        alasanBinding: alasan,
        fotoUrls: hasFoto ? generateFotoUrls(counter + i, 6) : undefined,
      });
      counter++;
    }
  });
});

// Helper functions untuk filter
export function toLocalMs(dateStr: string, endOfDay = false): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(
    y,
    m - 1,
    d,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  ).getTime();
}

export function filterDetailsData(
  details: BindingDetail[],
  filters: { jenis?: string; domain?: string; dateFrom?: string; dateTo?: string; search?: string }
): BindingDetail[] {
  const { jenis, domain, dateFrom, dateTo, search } = filters;

  const dateFromMs = dateFrom ? toLocalMs(dateFrom) : null;
  const dateToMs   = dateTo   ? toLocalMs(dateTo, true) : null;

  return details.filter((d) => {
    if (jenis && d.jenis !== jenis) return false;
    if (domain && d.domain !== domain) return false;

    const ts = d.tanggalRaw.getTime();
    if (dateFromMs !== null && ts < dateFromMs) return false;
    if (dateToMs   !== null && ts > dateToMs)   return false;

    if (search) {
      const q = search.toLowerCase();
      if (!d.alasanBinding.toLowerCase().includes(q)) {
        if (
          !d.noTiket.toLowerCase().includes(q) &&
          !d.noService.toLowerCase().includes(q) &&
          !d.stoLama.toLowerCase().includes(q) &&
          !d.stoBaru.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
    }
    return true;
  });
}

export function getStoDetails(kode: string): TicketDetail[] {
  const details = DUMMY_DETAILS.filter((d) => d.stoBaru === kode);
  return details.map(d => ({
    ...d,
    alasan: d.alasanBinding
  }));
}