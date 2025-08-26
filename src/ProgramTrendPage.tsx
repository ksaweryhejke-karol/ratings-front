// src/ProgramTrendPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { getAggregates, getMetrics } from "./lib/api";

type DayItem = { t: string; amr: number };

function fmtTime(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export default function ProgramTrendPage() {
  const [sp] = useSearchParams();
  const date = sp.get("date") || "";
  const slug = sp.get("slug") || "";
  const [lineup, setLineup] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [minutes, setMinutes] = useState<DayItem[]>([]);
  const [series, setSeries] = useState<{ date: string; amr?: number }[]>([]);
  const [avgType, setAvgType] = useState<"withBreaks"|"noBreaks">("noBreaks");

  // 1) wczorajszy lineup (żeby odczytać tytuł i metryki scalone)
  useEffect(() => {
    if (!date) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE}/programs?date=${date}`)
      .then(r => r.json())
      .then(d => setLineup(d.programs || []))
      .finally(() => setLoading(false));
  }, [date]);

  // 2) historia emisji (trend)
  useEffect(() => {
    if (!slug) return;
    fetch(`${import.meta.env.VITE_API_BASE}/program-history?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        const s = (d.series || []) as {date: string; amr?: number}[];
        setSeries(s);
      })
      .catch(() => setSeries([]));
  }, [slug]);

  // 3) 5-min tego dnia (podgląd retencji/peak)
  useEffect(() => {
    if (!date) return;
    getMetrics(date).then(d => setMinutes(d.points || []));
  }, [date]);

  const program = useMemo(() => lineup.find(p => (p.slug === slug)), [lineup, slug]);
  const chartTrend = useMemo(() => {
    return series.map(s => ({
      label: s.date,
      amr: s.amr ?? null,
    }));
  }, [series]);

  const chartMinutes = useMemo(() => {
    return minutes.map(p => ({
      t: new Date(p.t),
      label: new Date(p.t).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
      amr: p.amr,
    }));
  }, [minutes]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ opacity: 0.7 }}>← Wróć do dnia</Link>
      </div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>
        Trend: {program?.title || slug}
      </h1>
      <div style={{ opacity: 0.7, marginBottom: 16 }}>
        Dzień: {date || "—"} • okno 02:00 → 02:00
      </div>

      {/* SERIA EMISJI */}
      <section style={{ margin: "18px 0" }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Ostatnie emisje (AMR)</div>
        <div style={{ height: 260, background: "#0f172a", borderRadius: 12, padding: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: any) => [Number(v).toLocaleString("pl-PL"), "AMR"]}
                labelFormatter={(l) => `Data: ${l}`}
              />
              <Line type="monotone" dataKey="amr" dot strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* METRYKI EMISJI DNIA */}
      {program && (
        <section style={{ margin: "18px 0" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Dzisiejsza emisja (po scaleniu przerw)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <Card title="Start">{fmtTime(program.start)}</Card>
            <Card title="Koniec">{fmtTime(program.end)}</Card>
            <Card title="Czas [min]">{program.duration_min ?? "—"}</Card>
            <Card title="AMR">{program.amr?.toLocaleString("pl-PL") ?? "—"}</Card>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 12 }}>
            <Card title="SHR %">{program.shr_pct != null ? (program.shr_pct*100).toFixed(2) : "—"}</Card>
            <Card title="Break penalty">{program.break_penalty != null ? `${program.break_penalty}` : "—"}</Card>
            <Card title="Recovery [min]">{program.recovery_time ?? "—"}</Card>
            <Card title="Lead-in / out">{[program.lead_in_delta ?? "—", program.lead_out_delta ?? "—"].join(" / ")}</Card>
          </div>
        </section>
      )}

      {/* 5-MIN DNIA */}
      <section style={{ margin: "18px 0" }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Wykres 5-min (dzień)</div>
        <div style={{ height: 280, background: "#0f172a", borderRadius: 12, padding: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartMinutes}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" minTickGap={32} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: any) => [Number(v).toLocaleString("pl-PL"), "Widzowie"]}
                labelFormatter={(l) => `Czas: ${l}`}
              />
              <Line type="monotone" dataKey="amr" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
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
