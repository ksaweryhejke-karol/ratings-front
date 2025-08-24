import { useEffect, useMemo, useState } from "react";
import { listDays, getAggregates, getMetrics } from "./lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function fmtTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export default function ProgramyPage() {
  const [days, setDays] = useState<string[]>([]);
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [aggr, setAggr] = useState<any>(null);
  const [points, setPoints] = useState<{ t: string; amr: number }[]>([]);

  useEffect(() => {
    (async () => {
      const d = await listDays();
      setDays(d);
      setDate(d[0] ?? "");
    })();
  }, []);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    Promise.all([getAggregates(date), getMetrics(date)])
      .then(([a, m]) => {
        setAggr(a);
        setPoints(m.points || []);
      })
      .finally(() => setLoading(false));
  }, [date]);

  const chartData = useMemo(
    () =>
      points.map(p => ({
        t: new Date(p.t),
        label: new Date(p.t).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
        amr: p.amr,
      })),
    [points]
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Nielsen — Programy & 5-min</h1>
      <div style={{ opacity: 0.7, marginBottom: 16 }}>Okno: 02:00 → 02:00 (Europe/Warsaw)</div>

      <label style={{ display: "inline-block", marginRight: 12 }}>
        Data:&nbsp;
        <select value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: 6, borderRadius: 8 }}>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>

      {aggr && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, margin: "16px 0" }}>
          <Card title="Peak viewers">{aggr.topline?.peak_viewers?.toLocaleString("pl-PL")}</Card>
          <Card title="Average viewers">{aggr.topline?.average_viewers?.toLocaleString("pl-PL")}</Card>
          <Card title="Points (minutes)">{aggr.topline?.points_minutes}</Card>
          <Card title="SHR %">{aggr.topline?.shr_pct != null ? (aggr.topline.shr_pct*100).toFixed(2) : "—"}</Card>
        </div>
      )}

      <Section title="Wykres 5-min">
        <div style={{ height: 280, background: "#0f172a", borderRadius: 12, padding: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" minTickGap={32} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: any) => [Number(v).toLocaleString("pl-PL"), "Widzowie"]}
                labelFormatter={(l) => `Czas: ${l}`}
              />
              <Line type="monotone" dataKey="amr" dot={false} strokeWidth={2} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Programy (po scaleniu przerw ≤ MERGE_BREAK_MIN)">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #233" }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Tytuł</th>
                <th style={{ padding: 8 }}>Start</th>
                <th style={{ padding: 8 }}>Koniec</th>
                <th style={{ padding: 8 }}>Czas [min]</th>
                <th style={{ padding: 8 }}>AMR</th>
                <th style={{ padding: 8 }}>SHR %</th>
              </tr>
            </thead>
            <tbody>
              {(aggr?.program_line || []).map((p: any, i: number) => (
                <tr key={p.slug || i} style={{ borderBottom: "1px solid #1b2433" }}>
                  <td style={{ padding: 8 }}>{p.rank_amr ?? i+1}</td>
                  <td style={{ padding: 8 }}>{p.title}</td>
                  <td style={{ padding: 8 }}>{fmtTime(p.start)}</td>
                  <td style={{ padding: 8 }}>{fmtTime(p.end)}</td>
                  <td style={{ padding: 8 }}>{p.duration_min ?? "—"}</td>
                  <td style={{ padding: 8 }}>{p.amr?.toLocaleString("pl-PL") ?? "—"}</td>
                  <td style={{ padding: 8 }}>{p.shr_pct != null ? (p.shr_pct*100).toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {loading && <div style={{ marginTop: 12, opacity: 0.7 }}>Ładowanie…</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <div style={{ background: "#0f172a", padding: 12, borderRadius: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 20 }}>{children}</div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div style={{ margin: "18px 0" }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}
