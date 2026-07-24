import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MGMT = process.env.SUPABASE_ACCESS_TOKEN!;
const REF = URL.match(/https:\/\/([^.]+)/)?.[1] ?? "";

const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const sb = createClient(URL, KEY);
const TABLES = ["binding_tickets", "gno_tickets", "ognok_tickets", "routing_tickets"];
const LIMIT_BYTES = 536870912;

async function tableCount(table: string) {
  const r = await fetch(`${URL}/rest/v1/${table}?select=id&limit=0`, { headers: { ...h, Prefer: "count=exact" } });
  return parseInt((r.headers.get("content-range") ?? "0/0").split("/")[1] || "0", 10);
}

export async function GET() {
  const [dbRows, bucketRes, counts] = await Promise.all([
    fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${MGMT}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "select sum(pg_database_size(datname))::bigint as total from pg_database" }),
    }).then(r => r.json()),
    fetch(`${URL}/storage/v1/object/list/CaptureBinding_Images`, {
      method: "POST", headers: h, body: JSON.stringify({ limit: 1000, offset: 0, prefix: "" }),
    }).then(r => r.json()),
    Promise.all(TABLES.map(t => tableCount(t).then(rows => ({ table: t, rows })))),
  ]);

  const dbBytes = Number(Array.isArray(dbRows) ? dbRows[0]?.total ?? 0 : 0);
  const files: any[] = Array.isArray(bucketRes) ? bucketRes : [];
  const bucketBytes = files.reduce((s, f) => s + (f?.metadata?.size ?? 0), 0);
  const totalRows = counts.reduce((s, t) => s + t.rows, 0);
  const pct = (dbBytes / LIMIT_BYTES) * 100;
  const status = pct >= 90 ? "critical" : pct >= 80 ? "warning" : pct >= 70 ? "caution" : "safe";

  return NextResponse.json({
    dbBytes, bucketBytes, totalRows, limitBytes: LIMIT_BYTES,
    pct: Math.round(pct * 10) / 10, status,
    tables: counts, bucketFiles: files.length,
    fetchedAt: new Date().toISOString(),
  });
}
