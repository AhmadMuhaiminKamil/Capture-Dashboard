import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "CaptureBinding_Images";
const TABLES = [
  ["binding_tickets", "id"], ["gno_tickets", "id"], ["ognok_tickets", "id"], ["routing_tickets", "id"],
  ["binding_submit_log", "id"], ["capture_ticket_messages", "chat_id"], ["pending_photo_buffer", "pending_key"], ["photo_batch_buffer", "id"],
] as const;

const admin = createClient(URL, SERVICE_KEY);

async function listAllFiles() {
  const files: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(BUCKET).list("", { limit: 1000, offset });
    if (error) throw new Error(error.message);
    const names = (data ?? []).filter(file => file.name !== ".emptyFolderPlaceholder").map(file => file.name);
    files.push(...names);
    if (names.length < 1000) return files;
  }
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = auth.slice(7);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.confirmation !== "HAPUS SEMUA") return NextResponse.json({ error: "Konfirmasi tidak valid" }, { status: 400 });

  const result: { table: string; deleted: boolean; error?: string }[] = [];
  for (const [table, key] of TABLES) {
    const { error } = await admin.from(table as string).delete().not(key, "is", null);
    result.push({ table, deleted: !error, ...(error ? { error: error.message } : {}) });
    if (error) return NextResponse.json({ ok: false, result }, { status: 500 });
  }

  const files = await listAllFiles();
  for (let i = 0; i < files.length; i += 100) {
    const { error } = await admin.storage.from(BUCKET).remove(files.slice(i, i + 100));
    if (error) return NextResponse.json({ ok: false, result, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result, deletedFiles: files.length });
}
