// src/pages/ResultsDashboard.jsx
// Simulation 1 conclusion screen (script Section 7).
//
// Participants see the four hidden variables revealed QUALITATIVELY only — High / Medium / Low, never
// numbers and never a ranking against other teams (1.9). Immediately after that reveal the screen shows
// "Simulation complete." and nothing else: no explanation, no framing. The facilitator delivers the
// rest live in the debrief.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API_BASE from "../config";
import "./ResultsDashboard.css";

const BAND_COLOR = {
  High: "#e5e9f2",
  Medium: "#e5e9f2",
  Low: "#e5e9f2",
};

export default function ResultsDashboard() {
  const [params] = useSearchParams();
  const runId = params.get("runId");
  const [reveal, setReveal] = useState(null);

  useEffect(() => {
    if (!runId) return;
    let stop = false;
    fetch(`${API_BASE}/api/runs/${runId}/reveal`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!stop && d?.reveal) setReveal(d.reveal);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [runId]);

  return (
    <div
      className="results-dashboard"
      style={{
        minHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {reveal && (
        <div style={{ width: "100%", maxWidth: 460, marginBottom: 48 }}>
          {reveal.map((r) => (
            <div
              key={r.construct}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "14px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontSize: 15, color: "#9aa4bd" }}>{r.label}</span>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: BAND_COLOR[r.band] || "#e5e9f2",
                }}
              >
                {r.band}
              </span>
            </div>
          ))}
        </div>
      )}

      <h1 style={{ fontWeight: 600, letterSpacing: "0.01em", margin: 0 }}>
        Simulation complete.
      </h1>
    </div>
  );
}
