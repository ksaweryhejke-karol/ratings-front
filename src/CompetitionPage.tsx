// src/CompetitionPage.tsx
import { useEffect, useState } from "react";

export default function CompetitionPage() {
  const [date, setDate] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/days`).then(r => r.json()).then(d => {
      const arr = d.days || [];
      setDays(arr);
      if (!date && arr.length) setDate(arr[arr.length-1]);
    });
  }, []);

  useEffect(() => {
    if (!date) return;
    fetch(`${import.meta.env.VITE_API_BASE}/compare?date=${date}`).then(r => r.json()).then(setData).catch(() => setData(null));
  }, [date]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Konkurencja — SHR% (dzień)</h1>
      <div style={{ opacity: 0.7, marginBottom: 16 }}>Data:&nbsp;
        <select value={date} onChange={e => setDate(e.target.value)} style={{ padding: 6, borderRadius: 8 }}>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {!data && <div>Brak danych…</div>}
      {data && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #233" }}>
                <th style={{ padding: 8 }}>Stacja</th>
                <th style={{ padding: 8 }}>SHR %</th>
                <th style={{ padding: 8 }}>AMR (opcjonalnie)</th>
              </tr>
            </thead>
            <tbody>
              {(data.stations || []).map((s: any) => (
                <tr key={s.name} style={{ borderBottom: "1px solid #1b2433" }}>
                  <td style={{ padding: 8 }}>{s.name}</td>
                  <td style={{ padding: 8 }}>{s.shr_pct != null ? (s.shr_pct*100).toFixed(2) : "—"}</td>
                  <td style={{ padding: 8 }}>{s.amr != null ? s.amr.toLocaleString("pl-PL") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
