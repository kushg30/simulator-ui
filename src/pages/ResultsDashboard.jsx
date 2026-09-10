// src/pages/ResultsDashboard.jsx
// Simulation 1 conclusion screen (script Section 7).
//
// Participants see the four hidden variables revealed QUALITATIVELY only — High / Medium / Low, never
// numbers and never a ranking against other teams (1.9). Immediately after that reveal the screen shows
// "Simulation complete." and nothing else: no explanation, no framing. The facilitator delivers the
// rest live in the debrief.
//
// The team's own report sits below that, as a deliberate second beat: it is the takeaway document, and
// it is fetched only when a participant asks for it so the reveal is not buried under it.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API_BASE from "../config";
import Sim1TeamReport from "../report/Sim1TeamReport";
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

  const [report, setReport] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState("");

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

  // Fetched on demand and cached, so reopening the report after closing it is instant.
  const openReport = async () => {
    if (report) {
      setReportOpen(true);
      return;
    }
    setReportBusy(true);
    setReportError("");
    try {
      const res = await fetch(`${API_BASE}/api/runs/${runId}/report`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Your report could not be loaded.");
      setReport(body);
      setReportOpen(true);
    } catch (e) {
      setReportError(e.message);
    } finally {
      setReportBusy(false);
    }
  };

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

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <button className="results-report-btn" onClick={openReport} disabled={reportBusy}>
          {reportBusy ? "Preparing your report…" : "View your team report"}
        </button>
        <div style={{ fontSize: 12.5, color: "#7c8698", marginTop: 12, maxWidth: 380 }}>
          Your full takeaway report — the roster, your four framings, your construct profile and the
          whole decision trail. Open it, then use <b>Download PDF</b> to keep a copy.
        </div>
        {reportError && (
          <div style={{ fontSize: 12.5, color: "#e5786a", marginTop: 12 }}>{reportError}</div>
        )}
      </div>

      {reportOpen && report && (
        <Sim1TeamReport data={report} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}
