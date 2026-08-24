import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DemoPage.css";

// A self-contained, front-end-only sample round. It never calls the real backend,
// scoring engine, or answer key — the grading below is canned and the scenario is a
// throwaway ("Northwind Traders"), NOT any of the five real Meridian rounds. This keeps
// every real round's content and answer private while still giving prospects the feel.

// Public, on-domain fictional sample (no PII) served from /public — safe for any visitor.
const SAMPLE_URL = "/sample-report.html";

const ROWS = [
  { id: "1001", product: "Notebook Set", qty: "40", rev: "₹92,000", flag: null },
  { id: "1002", product: "Office Chair", qty: "12", rev: '"1,75,000"', flag: "format" },
  { id: "1003", product: "Desk Lamp", qty: "30", rev: "₹41,400", flag: null },
  { id: "1003", product: "Desk Lamp", qty: "30", rev: "₹41,400", flag: "dup" },
  { id: "1004", product: "Standing Desk", qty: "8", rev: "—", flag: "incomplete" },
];

const CANDIDATES = [
  { id: "raw", label: "₹4,82,600", note: "the raw export total, exactly as it came" },
  { id: "dedup", label: "₹4,41,200", note: "after removing the duplicated order", correct: true },
  { id: "over", label: "₹3,90,000", note: "after dropping every row that looked odd" },
];

const ISSUES = [
  { id: "dup", label: "Duplicated rows", correct: true },
  { id: "format", label: "Improper number formatting", correct: true },
  { id: "incomplete", label: "Incomplete record (missing value)", correct: true },
  { id: "currency", label: "Currency mismatch", correct: false },
];

const LOCKED = [
  { name: "Data Trust", why: "Blends this round with your Round-3 reconciliation — one round is only part of it." },
  { name: "Insight Communication", why: "Scored on the Round-5 board synthesis your Team Lead writes." },
  { name: "Analytical Rigor", why: "Averaged across all five rounds, not a single call." },
  { name: "Judgment Calibration", why: "The pattern of confidence vs. correctness across the whole game." },
  { name: "Turnaround Discipline", why: "Ranked against the whole cohort playing the same case." },
  { name: "Team debrief & cohort ranking", why: "Your five roles compared side-by-side, and your team vs. the room." },
  { name: "Personalised takeaway report", why: "A full per-team report — see a real sample below." },
];

export default function DemoPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("intro");
  const [revenue, setRevenue] = useState(null);
  const [issues, setIssues] = useState({});
  const [confidence, setConfidence] = useState(null);
  const [result, setResult] = useState(null);

  const toggleIssue = (id) => setIssues((s) => ({ ...s, [id]: !s[id] }));

  const grade = () => {
    const revCorrect = revenue === "dedup";
    const chosen = Object.keys(issues).filter((k) => issues[k]);
    const correctPicked = chosen.filter((id) => ISSUES.find((i) => i.id === id)?.correct).length;
    const wrongPicked = chosen.filter((id) => !ISSUES.find((i) => i.id === id)?.correct).length;
    const issueFrac = Math.max(0, Math.min(1, correctPicked / 3 - wrongPicked * 0.2));
    const outcome = Math.round(50 * (revCorrect ? 1 : 0) + 50 * issueFrac);
    const rigor = Math.round(40 + 55 * issueFrac + (revCorrect ? 5 : 0));

    let calib;
    const good = outcome >= 70;
    if (confidence === "HIGH") calib = good
      ? { verdict: "Well calibrated", note: "You claimed HIGH and the number held up — confident and correct." }
      : { verdict: "Overconfident", note: "You claimed HIGH, but the number didn't hold. Confidence should track the evidence." };
    else if (confidence === "LOW") calib = good
      ? { verdict: "Underconfident", note: "You were right but hedged LOW — trust a number you can defend." }
      : { verdict: "Appropriately cautious", note: "You flagged low confidence on a shaky number — reasonable." };
    else calib = { verdict: "Reasonably calibrated", note: "A MEDIUM call — defensible either way here." };

    setResult({ outcome, revCorrect, correctPicked, wrongPicked, rigor, calib, dataTrust: Math.round(outcome * 0.45) });
    setStep("result");
    window.scrollTo(0, 0);
  };

  const canSubmit = revenue && confidence;

  return (
    <div className="demo">
      <div className="demo-shell">
        <div className="demo-top">
          <span className="demo-brand">CaseRun</span>
          <span className="demo-tag">Sample round · no sign-in</span>
        </div>

        {step === "intro" && (
          <div className="demo-card demo-intro">
            <div className="demo-eyebrow">Data Analytics Simulation · a 2-minute taste</div>
            <h1>Can the numbers be trusted?</h1>
            <p>
              In the full simulation, five analysts spend 90 minutes turning a raw, unchecked data feed
              into a Quarterly Business Review the Board can trust. Here's <b>one analyst's round</b>, on a
              sample dataset, so you can feel how it plays.
            </p>
            <p className="demo-role">
              You are the <b>Data Quality Analyst</b> at <b>Northwind Traders</b>. A sales export just landed —
              and something's off.
            </p>
            <button className="demo-btn" onClick={() => setStep("play")}>Start the round →</button>
            <p className="demo-fineprint">Sample data only. This is not one of the real simulation rounds.</p>
          </div>
        )}

        {step === "play" && (
          <div className="demo-card">
            <div className="demo-eyebrow">Round 1 · Trust the Feed</div>
            <h2>Audit the sales export</h2>
            <p className="demo-lede">
              Below is the raw export. Spot what's wrong, then decide which revenue total the Board can trust.
            </p>

            <div className="demo-table-wrap">
              <table className="demo-table">
                <thead><tr><th>Order</th><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
                <tbody>
                  {ROWS.map((r, i) => (
                    <tr key={i} className={r.flag ? "flagged" : ""}>
                      <td>{r.id}</td><td>{r.product}</td><td>{r.qty}</td><td>{r.rev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="demo-q">
              <label className="demo-q-label">1 · Which data issues do you see? <span>(select all that apply)</span></label>
              <div className="demo-checks">
                {ISSUES.map((i) => (
                  <button key={i.id} className={`demo-chk ${issues[i.id] ? "on" : ""}`} onClick={() => toggleIssue(i.id)}>
                    <span className="demo-box">{issues[i.id] ? "✓" : ""}</span>{i.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="demo-q">
              <label className="demo-q-label">2 · Which revenue total can the Board trust?</label>
              <div className="demo-opts">
                {CANDIDATES.map((c) => (
                  <button key={c.id} className={`demo-opt ${revenue === c.id ? "on" : ""}`} onClick={() => setRevenue(c.id)}>
                    <span className="demo-opt-val">{c.label}</span>
                    <span className="demo-opt-note">{c.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="demo-q">
              <label className="demo-q-label">3 · How confident are you?</label>
              <div className="demo-conf">
                {["LOW", "MEDIUM", "HIGH"].map((c) => (
                  <button key={c} className={`demo-conf-btn ${confidence === c ? "on" : ""}`} onClick={() => setConfidence(c)}>{c}</button>
                ))}
              </div>
            </div>

            <button className="demo-btn" disabled={!canSubmit} onClick={grade}>Submit the round →</button>
            {!canSubmit && <p className="demo-fineprint">Pick a revenue total and a confidence level to submit.</p>}
          </div>
        )}

        {step === "result" && result && (
          <>
            <div className="demo-card demo-result">
              <div className="demo-eyebrow">Round 1 · your result</div>
              <div className="demo-outcome">
                <div className="demo-score">{result.outcome}<small>%</small></div>
                <div className="demo-outcome-txt">
                  <b>Round outcome</b>
                  <p>
                    Revenue: {result.revCorrect ? "correct — you removed the duplicate ✓" : "not quite — the trustworthy total removes the one duplicated order."}<br />
                    Data issues: you caught {result.correctPicked} of 3{result.wrongPicked ? `, and flagged ${result.wrongPicked} that wasn't real` : ""}.
                  </p>
                </div>
              </div>

              <div className="demo-provisional">
                <div className="demo-prov-title">What this one round can tell you</div>
                <div className="demo-prov-grid">
                  <div className="demo-prov">
                    <span className="demo-prov-l">Analytical Rigor <em>(this round)</em></span>
                    <span className="demo-prov-v">{result.rigor}<small>/100</small></span>
                  </div>
                  <div className="demo-prov">
                    <span className="demo-prov-l">Data Trust <em>(R1 contribution)</em></span>
                    <span className="demo-prov-v">{result.dataTrust}<small>/100</small></span>
                  </div>
                  <div className="demo-prov demo-prov-wide">
                    <span className="demo-prov-l">Judgment Calibration <em>(this round)</em></span>
                    <span className="demo-prov-v small">{result.calib.verdict}</span>
                    <span className="demo-prov-note">{result.calib.note}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="demo-card demo-locked-card">
              <div className="demo-eyebrow">The full picture — unlocked in the complete simulation</div>
              <p className="demo-lede">
                One round is a taste. Your real leadership profile is built across all five rounds, with your
                team, and against the whole cohort:
              </p>
              <div className="demo-locked-grid">
                {LOCKED.map((l) => (
                  <div className="demo-locked" key={l.name}>
                    <div className="demo-lock-top"><span className="demo-lock-ico">🔒</span><span className="demo-lock-name">{l.name}</span></div>
                    <div className="demo-lock-why">{l.why}</div>
                  </div>
                ))}
              </div>
              <div className="demo-cta">
                <a className="demo-btn" href={SAMPLE_URL} target="_blank" rel="noreferrer">See a real team report →</a>
                <button className="demo-btn ghost" onClick={() => navigate("/")}>Book a workshop</button>
              </div>
            </div>

            <button className="demo-restart" onClick={() => { setStep("intro"); setRevenue(null); setIssues({}); setConfidence(null); setResult(null); }}>
              ↻ Play the sample round again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
