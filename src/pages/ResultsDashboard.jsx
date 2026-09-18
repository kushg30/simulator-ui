// src/pages/ResultsDashboard.jsx
//
// The Final Results Screen (script section 8), shown to every participant once Round 4 ends.
//
// This is the one moment the simulation stops withholding. During play no score, band or rank is
// ever visible; here all of it lands at once, in the order the script lays out: the four variables,
// the cohort's shape, the trajectory that shows WHICH round set the result, where the variables come
// from, the Framing Commitment pattern, the composite and rank, the four framings as a plain record,
// how this maps to real practice, and finally "Simulation complete."
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API_BASE from "../config";
import Sim1TeamReport from "../report/Sim1TeamReport";
import { useSim } from "../simConfig";
import { CohortBars, ResultsRadar, TrajectoryChart, VariableLegend } from "../report/Sim1Charts";
import "./ResultsDashboard.css";

// The engine's four storage keys, in the order section 8 lists them. The results payload uses the
// script's own short names; the simulation's config supplies the display label, so a simulation that
// renames a variable does not need this file changed.
const KEY_TO_CONSTRUCT = {
  trust: "stakeholder_trust",
  governance: "organizational_risk",
  rigor: "execution_quality",
  exposure: "ethical_exposure",
};

// Fixed text, exactly as section 8 specifies. Never generated, never varied per team.
const PROVENANCE =
  "Stakeholder Trust and Governance Accountability draw on Badaracco's writing on right-versus-right " +
  "decisions, where every option carries a real cost. Diagnostic Rigor and Ethical Exposure draw on " +
  "Bazerman and Tenbrunsel's research on why capable, well-intentioned people still miss what is in " +
  "front of them. None of these four scores is a certified psychometric instrument, they are a " +
  "structured way of asking the same four questions consistently across fifty-plus decisions, " +
  "explained in full in the facilitator debrief.";

const INDUSTRY =
  "Real organizations track AI governance using frameworks such as NIST's AI Risk Management " +
  "Framework (Govern, Map, Measure, Manage) and Gartner's AI TRiSM model (AI Governance, Runtime " +
  "Inspection and Enforcement, Information Governance, and Infrastructure Security). Your four scores " +
  "map loosely onto the same territory: Governance Accountability to Govern, Diagnostic Rigor to " +
  "Measure, Stakeholder Trust and Ethical Exposure to how well an organization's AI Governance and " +
  "Runtime Enforcement layers actually work in practice, not just on paper.";

export default function ResultsDashboard() {
  const [params] = useSearchParams();
  const runId = params.get("runId");
  const sim = useSim();

  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const [report, setReport] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (!runId) return;
    let stop = false;
    fetch(`${API_BASE}/api/runs/${runId}/results`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || "Results could not be loaded.");
        return body;
      })
      .then((d) => { if (!stop) setResults(d); })
      .catch((e) => { if (!stop) setError(e.message); });
    return () => { stop = true; };
  }, [runId]);

  const openReport = async () => {
    if (report) { setReportOpen(true); return; }
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

  // Display label and meaning come from the simulation's own config, so this screen is correct for
  // any simulation running on this engine, not just the one it was written for.
  const cfgFor = (key) =>
    (sim.reveal || []).find((c) => c.construct === KEY_TO_CONSTRUCT[key]) || {};
  const labelFor = (key) => cfgFor(key).label || key;
  const labels = Object.fromEntries(Object.keys(KEY_TO_CONSTRUCT).map((k) => [k, labelFor(k)]));

  const vars = results?.variables || [];
  const fc = results?.framingCommitment;

  return (
    <div className="results-dashboard res-page">
      <div className="res-shell">
        <div className="res-eyebrow">Final results</div>
        <h1 className="res-title">{results?.teamName || "Your team"}</h1>

        {error && <p className="res-error">{error}</p>}
        {!results && !error && <p className="res-loading">Preparing your results…</p>}

        {results && (
          <>
            {/* ── 1. the four variables ─────────────────────────────────── */}
            <section className="res-block">
              <h2>Where your team ended</h2>
              <div className="res-var-grid">
                {vars.map((v) => (
                  <div className="res-var" key={v.key}>
                    <div className="res-var-head">
                      <span className="res-var-name">{labelFor(v.key)}</span>
                      <span className={`res-band res-band-${(v.band || "").toLowerCase()}`}>{v.band}</span>
                    </div>
                    <div className="res-var-points">
                      {v.points > 0 ? `+${v.points}` : v.points}
                      <span className="res-var-range">of {v.min} to {v.max}</span>
                    </div>
                    <p className="res-var-meaning">{cfgFor(v.key).meaning}</p>
                    {v.lowerIsBetter && <div className="res-var-flag">Lower is better</div>}
                  </div>
                ))}
              </div>
            </section>

            {/* ── 2. the cohort's shape ─────────────────────────────────── */}
            {results.cohort?.length > 1 && (
              <section className="res-block">
                <h2>Your team against the cohort</h2>
                <p className="res-sub">
                  Every team's composite score, ranked. Yours is highlighted — the shape of the spread
                  says more than the position does.
                </p>
                <CohortBars cohort={results.cohort} />
              </section>
            )}

            {/* ── 3. trajectory + radar ─────────────────────────────────── */}
            <section className="res-block">
              <h2>Which round set your result</h2>
              <p className="res-sub">
                Each line is a running total. A final number cannot show where it came from — this can.
              </p>
              <VariableLegend labels={labels} />
              <div className="res-charts">
                <div className="res-chart-main">
                  <TrajectoryChart trajectory={results.trajectory} labels={labels} />
                </div>
                <div className="res-chart-side">
                  <ResultsRadar variables={vars} labels={labels} />
                  <div className="res-chart-cap">Your profile, each axis against its own possible range.</div>
                </div>
              </div>
            </section>

            {/* ── 4. where the variables come from ──────────────────────── */}
            <section className="res-block res-note-block">
              <h2>Where these four come from</h2>
              <p className="res-prose">{PROVENANCE}</p>
            </section>

            {/* ── 5. Framing Commitment — descriptive, never scored ─────── */}
            {fc && (
              <section className="res-block">
                <h2>Framing Commitment</h2>
                <div className="res-fc">
                  <div className="res-fc-label">{fc.label}</div>
                  <div className="res-fc-path">
                    {(fc.path || []).map((p, i) => (
                      <span key={i} className={`res-fc-step${p == null ? " gap" : ""}`}>
                        {p == null ? "—" : p}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="res-sub">{fc.note}</p>
                <p className="res-sub">
                  This is the option number your CEO chose each round, and it is descriptive only — it
                  carries no score and does not affect your rank.
                </p>
              </section>
            )}

            {/* ── 6. composite and rank ─────────────────────────────────── */}
            <section className="res-block res-composite">
              <div>
                <div className="res-composite-value">{results.composite}</div>
                <div className="res-composite-label">composite score</div>
              </div>
              {results.teamCount > 1 && (
                <div>
                  <div className="res-composite-value">
                    {results.rank}<span className="res-of"> of {results.teamCount}</span>
                  </div>
                  <div className="res-composite-label">in this cohort</div>
                </div>
              )}
            </section>

            {/* ── 7. the four framings, as a record ─────────────────────── */}
            <section className="res-block">
              <h2>What your CEO decided, round by round</h2>
              <p className="res-sub">
                These four decisions were never scored. There was no correct answer to any of them —
                they are here for reflection, not evaluation.
              </p>
              <div className="res-framings">
                {(results.framings || []).map((f) => (
                  <div className="res-framing" key={f.round}>
                    <div className="res-framing-round">Round {f.round}</div>
                    <div className={`res-framing-text${f.submitted ? "" : " missed"}`}>
                      {f.submitted ? f.label : "No decision submitted"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 8. how this maps to real practice ─────────────────────── */}
            <section className="res-block res-note-block">
              <h2>How this maps to real practice</h2>
              <p className="res-prose">{INDUSTRY}</p>
            </section>
          </>
        )}

        {/* ── 9. the broadcast, directly below everything above ────────── */}
        <div className="res-complete">Simulation complete.</div>

        <div className="res-report">
          <button className="results-report-btn" onClick={openReport} disabled={reportBusy}>
            {reportBusy ? "Preparing your report…" : "View your team report"}
          </button>
          <div className="res-report-note">
            Your full takeaway report — the roster, your four framings and your construct profile.
            Open it, then use <b>Download PDF</b> to keep a copy.
          </div>
          {reportError && <div className="res-error">{reportError}</div>}
        </div>
      </div>

      {reportOpen && report && (
        <Sim1TeamReport data={report} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}
