// src/pages/ResultsDashboard.jsx
// Simulation 1 completion screen.
//
// Simulator 1 is deliberately score-free for students: the four hidden variables
// (Set A) and the qualitative High/Medium/Low reveal are faculty-only, shown in
// the facilitator console at /faculty. This page therefore only confirms the
// round is complete and points participants to the facilitated debrief — it no
// longer renders any scores.
import "./ResultsDashboard.css";

export default function ResultsDashboard() {
  return (
    <div className="results-dashboard" style={{ maxWidth: 640, margin: "12vh auto", padding: 24 }}>
      <h1>Round complete</h1>
      <p style={{ color: "#8b949e", lineHeight: 1.6, marginTop: 12 }}>
        Thank you — your team's decisions have been recorded.
      </p>
      <p style={{ color: "#8b949e", lineHeight: 1.6, marginTop: 10 }}>
        Simulation 1 has no scoreboard for participants by design. Your facilitator will walk the
        cohort through the results — how weak signals were treated, where judgment collapsed upward,
        and how the room's option space narrowed — in the debrief.
      </p>
      <p style={{ color: "#8b949e", lineHeight: 1.6, marginTop: 10 }}>
        Nothing more is needed from you here.
      </p>
    </div>
  );
}
