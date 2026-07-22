import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

const SCRIPT = path.join(process.cwd(), "scripts", "infer.py");

const LABEL_MAP: Record<string, string> = {
  ganti_ont: "gantiOnt",
  order_pda: "orderPda",
  pengamanan_pelanggan: "pengamananPelanggan",
  pindah_odp: "pindahOdp",
};

export async function POST(req: NextRequest) {
  try {
    const { texts }: { texts: string[] } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0)
      return NextResponse.json({ results: [] });

    const labels = await new Promise<string[]>((resolve, reject) => {
      execFile("python3", [SCRIPT, ...texts], { maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
        if (err) return reject(err);
        try { resolve(JSON.parse(stdout.trim())); }
        catch { reject(new Error("Invalid JSON from infer.py")); }
      });
    });

    return NextResponse.json({ results: labels.map(l => LABEL_MAP[l] ?? "lainnya") });
  } catch (e: any) {
    console.error("[classify]", e.message);
    // fallback: return all lainnya so UI still works
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
