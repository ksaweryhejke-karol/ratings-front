import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Scatter, ScatterChart
} from "recharts";

const API = import.meta.env.VITE_API_BASE ?? "";

type TrendItem = {
  date: string;
  amr?: number | null;
  avg_excl_breaks?: number | null;
  avg_incl_breaks?: number | null;
  rank_amr?: number | null;
  points_minutes?: number | null;
  shr_pct?: number | null;
};

type TrendResponse = { slug: string; days: number; items: TrendItem[] };

function movingAverage(nums: number[], w = 7): (number | undefined)[] {
  const out: (number | undefined)[] = new Array(nums.length).fill(undefined);
  const buf: number[] = [];
  let sum = 0;
  let valid = 0;
  for (let i = 0; i < nums.length; i++) {
    const v = nums[i];
    buf.push(v);
    if (Number.isFinite(v)) { sum += v; valid++; }
    if (buf.length > w) {
      const removed = buf.shift()!;
      if (Number.isFinite(removed)) { sum -= removed; valid--; }
    }
    out[i] = valid ? (sum / valid) : undefined;
  }
  return out;
}

export default function ProgramTrendPage() {
  const qs = new URLSearchParams(window.location.search);
  const [slug, setSlug] = useState<string>(qs.get("slug") || "");
  const [days, setDays] = useState<number>(Number(qs.get("days") || "56") || 56);
  const [mode, setMode] = useState<"excl" | "incl">("excl");
  const [raw, setRaw] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setErr(null);
    fetch(`${API}/program-trend?slug=${encodeURIComponent(slug)}&days=${days}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<TrendResponse>; })
      .then(json => { setRaw(Array.isArray(json.items) ? json.items : []); })
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [slug, days]);

  const rows = useMemo(() => {
    return raw.map((it: any) => {
      const yCore = typeof it.amr === "number" ? it.amr : null;
      const yEx = typeof it.avg_excl_breaks === "number" ? it.avg_excl_breaks : null;
      const yIn = typeof it.avg_incl_breaks === "number" ? it.avg_incl_breaks : null;
      const y = yCore ?? (mode === "excl" ? yEx : yIn) ?? yEx ?? yIn;
      return { date: String(it.date), amr: y ?? null };
    });
  }, [raw, mode]);

  const chartData = useMemo(() => {
    const n = rows.map(r => (typeof r.amr === "number" ? r.amr : NaN));
    const ma7 = movingAverage(n, 7);
    return rows.map((r, i) => ({
      date: r.date,
      amr: Number.isFinite(n[i]) ? n[i] : undefined,
      ma7: ma7[i],
    }));
  }, [rows]);

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Trend programu {slug && <span className="text-cyan-400">({slug})</span>}
        </h1>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-sm text-white/70">Slug programu</span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value.trim())}
              className="mt-1 w-full bg-transparent outline-none border border-white/20 rounded-xl px-3 py-2"
              placeholder="np. serwis-informacyjny"
            />
          </label>

          <label className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-sm text-white/70">Liczba emisji (dni)</span>
            <input
              type="number" min={7} max={180} value={days}
              onChange={e => setDays(Math.max(7, Math.min(180, Number(e.target.value) || 56)))}
              className="mt-1 w-full bg-transparent outline-none border border-white/20 rounded-xl px-3 py-2"
            />
          </label>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-sm text-white/70">Status</span>
            <div className="mt-1 text-white/90">{loading ? "Ładowanie…" : `Wczytano ${raw.length} emisji`}</div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-4 border border-cyan-500/20 shadow-[0_0_60px_rgba(34,211,238,0.15)]">
          <h2 className="text-lg font-medium mb-2">AMR (emisja) + MA7</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 6" stroke="#2b3344" />
                <XAxis dataKey="date" tick={{ fill: "#9fb3c8" }} />
                <YAxis tick={{ fill: "#9fb3c8" }} />
                <Tooltip
                  contentStyle={{ background: "#0b1220", border: "1px solid #224", borderRadius: 12 }}
                  labelStyle={{ color: "#cce4ff" }}
                  formatter={(v: any, n: any) => [typeof v === "number" ? Math.round(v) : v, n === "ma7" ? "MA7" : "AMR"]}
                />
                <Line type="monotone" dataKey="ma7" stroke="#22d3ee" dot={false} strokeWidth={2} />
                <ScatterChart>
                  <Scatter data={chartData} dataKey="amr" fill="#93c5fd" />
                </ScatterChart>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-white/70">
            Kropki: pojedyncze emisje (AMR). Linia: ruchoma średnia z 7 emisji (MA7).
          </p>
        </div>
      </div>
    </div>
  );
}
