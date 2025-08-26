import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const API = import.meta.env.VITE_API_BASE ?? "";

type CompetitionResponse = {
  date: string;
  channels: { name: string; shr_pct: number }[];
};

export default function CompetitionPage() {
  const qs = new URLSearchParams(window.location.search);
  const [date, setDate] = useState<string>(qs.get("date") || "");
  const [rows, setRows] = useState<{ name: string; shr_pct: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const url = date ? `${API}/competition?date=${encodeURIComponent(date)}` : `${API}/competition`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<CompetitionResponse>; })
      .then(json => {
        const chans = (json.channels || []).map(x => ({
          name: String(x.name),
          shr_pct: Number(x.shr_pct || 0),
        }));
        setRows(chans);
      })
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [date]);

  const top = useMemo(() => rows.slice(0, 8), [rows]);

  return (
    <div className="max-w-5xl mx-auto p-4 text-slate-100">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">Konkurencja — SHR% 4+</h1>

      <div className="flex items-center gap-2 mb-4">
        <input
          className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 outline-none"
          placeholder="Data (YYYY-MM-DD) — puste = ostatnia"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {loading && <div className="opacity-70">Ładowanie…</div>}
      {err && <div className="text-red-400">Błąd: {err}</div>}

      {!loading && !err && (
        <>
          <div className="h-72 md:h-96 rounded-2xl p-4 bg-slate-900/60 ring-1 ring-slate-800 shadow-lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => `${Math.round(v * 100)}%`} width={60} />
                <Tooltip formatter={(v: any) => [`${(Number(v) * 100).toFixed(2)}%`, "SHR"]} />
                <Bar dataKey="shr_pct" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6">
            <table className="w-full text-sm">
              <thead className="text-left opacity-70">
                <tr>
                  <th className="py-2">Stacja</th>
                  <th className="py-2">SHR%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-800/60">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2">{(r.shr_pct * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
