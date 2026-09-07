// src/pages/ResultsDashboard.jsx
// Simulation 1 completion screen.
//
// Per script Section 7, the terminal broadcast to participants is exactly "Simulation complete."
// and nothing else — no scores, no framing. The four hidden variables (Set A) and the qualitative
// High/Medium/Low reveal stay faculty-only, shown in the facilitator console at /faculty; the
// facilitator delivers everything else live in the debrief.
import "./ResultsDashboard.css";

export default function ResultsDashboard() {
  return (
    <div
      className="results-dashboard"
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <h1 style={{ fontWeight: 600, letterSpacing: "0.01em" }}>Simulation complete.</h1>
    </div>
  );
}
