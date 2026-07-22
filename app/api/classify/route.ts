import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

// Load model once at startup
let model: any = null;
function getModel() {
  if (!model) {
    const p = path.join(process.cwd(), "public", "model.json");
    model = JSON.parse(readFileSync(p, "utf-8"));
  }
  return model;
}

function predict(text: string, m: any): string {
  const { vocabulary, idf, coef, intercept, classes, ngram_range, sublinear_tf } = m;
  const [minN, maxN] = ngram_range;

  // tokenize + ngrams
  const tokens = text.toLowerCase().match(/[a-z0-9_]+/g) || [];
  const tf: Record<string, number> = {};
  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const g = tokens.slice(i, i + n).join(" ");
      tf[g] = (tf[g] || 0) + 1;
    }
  }

  // TF-IDF vector (sparse)
  const vec: number[] = new Array(idf.length).fill(0);
  for (const [g, cnt] of Object.entries(tf)) {
    if (g in vocabulary) {
      const idx = vocabulary[g];
      vec[idx] = (sublinear_tf ? Math.log(cnt) + 1 : cnt) * idf[idx];
    }
  }

  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  for (let i = 0; i < vec.length; i++) vec[i] /= norm;

  // Score per class
  const scores = classes.map((_: string, ci: number) => {
    let s = intercept[ci];
    for (let j = 0; j < vec.length; j++) if (vec[j]) s += coef[ci][j] * vec[j];
    return s;
  });

  const rawLabel = classes[scores.indexOf(Math.max(...scores))];

  // Map to camelCase keys used in UI
  const labelMap: Record<string, string> = {
    ganti_ont: "gantiOnt",
    order_pda: "orderPda",
    pengamanan_pelanggan: "pengamananPelanggan",
    pindah_odp: "pindahOdp",
  };
  return labelMap[rawLabel] ?? "lainnya";
}

export async function POST(req: NextRequest) {
  try {
    const { texts }: { texts: string[] } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0)
      return NextResponse.json({ results: [] });

    const m = getModel();
    const results = texts.map(t => predict(t, m));
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
