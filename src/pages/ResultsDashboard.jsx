// src/pages/ResultsDashboard.jsx
// Simulation 1 results — the engine's four hidden variables (Set A), read live
// from the backend. These are the constructs the backend actually computes today
// (run_construct_state, via /team-results); the five behavioural constructs from
// the spec are a separate, not-yet-built engine.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API_BASE from "../config";
import "./ResultsDashboard.css";

// Backend construct keys -> display names, in the order we want to show them.
const CONSTRUCTS = [
  ["stakeholder_trust", "Stakeholder Trust"],
  ["organizational_risk", "Organizational Risk"],
  ["ethical_exposure", "Ethical Exposure"],
  ["execution_quality", "Execution Quality"],
];

function band(v) {
  if (v == null) return null;
  if (v >= 67) return "High";
  if (v >= 34) return "Medium";
  return "Low";
}

export default function ResultsDashboard() {
  const [params] = useSearchParams();
  const runId = params.get("runId");

  const [scores, setScores] = useState({}); // construct -> value
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/runs/${runId}/team-results`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then((rows) => {
        // rows: [["execution_quality", 62.0], ...]
        const map = {};
        (rows || []).forEach(([k, v]) => {
          map[k] = Math.round(Number(v));
        });
        setScores(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [runId]);

  if (!runId) {
    return (
      <div className="results-dashboard" style={{ padding: 24 }}>
        <h1>Results</h1>
        <p>Open this page from a completed run (no runId in the URL).</p>
      </div>
    );
  }

  return (
    <div className="results-dashboard" style={{ maxWidth: 820, margin: "40px auto", padding: 24 }}>
      <h1>Team results</h1>
      <p style={{ color: "#8b949e" }}>
        The engine's four hidden variables for this run, revealed as a level. Students see the level,
        not the number.
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#da3633" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ marginTop: 16 }}>
          {CONSTRUCTS.map(([key, label]) => {
            const v = scores[key];
            const b = band(v);
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 0",
                  borderBottom: "1px solid #263041",
                }}
              >
                <span style={{ minWidth: 190, fontWeight: 500 }}>{label}</span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: "#0b0f16",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: v == null ? 0 : `${v}%`,
                      background: "#3b82f6",
                    }}
                  />
                </div>
                <span style={{ minWidth: 120, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {v == null ? "—" : `${v} · ${b}`}
                </span>
              </div>
            );
          })}
          {Object.keys(scores).length === 0 && (
            <p style={{ color: "#8b949e" }}>
              No scores yet — they appear once the team has recorded decisions this round.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
