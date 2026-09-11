import { useEffect } from "react";
import { createPortal } from "react-dom";
import { BAND_PLOT, ConstructBars, ConstructRadar, ordinal } from "./Sim1Charts";
import "./sim1Report.css";

// The report is set in Playfair Display + DM Sans, per the approved design. They are loaded when the
// report first opens rather than from index.html: the app itself is set in system fonts, and a
// render-blocking webfont on every page would be paid by every participant for a document most of
// them open once. Both hosts are already allowed by the CSP in vercel.json.
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap";

function useReportFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
    // Deliberately not removed on unmount: reopening the report should not refetch, and the
    // stylesheet is inert for the rest of the app, which never names these families.
  }, []);
}

const ROLE_LABELS = {
  CEO: "CEO",
  CFO: "CFO",
  CHRO: "CHRO",
  HEAD_OF_ENGINEERING: "Head of Engineering",
  OPERATIONS: "Head of Operations",
  PRODUCT: "Head of Product",
};
const ROLE_ORDER = ["CEO", "CFO", "CHRO", "HEAD_OF_ENGINEERING", "OPERATIONS", "PRODUCT"];

const SETB_ORDER = [
  "EARLY_SIGNAL_LEGITIMIZATION",
  "SILENCE_ACCUMULATION",
  "FRAMING_COMMITMENT",
  "AUTHORITY_CENTRALIZATION",
  "OPTION_SPACE_CONTRACTION",
];
const SETB_FULL = {
  EARLY_SIGNAL_LEGITIMIZATION: "Early Signal Legitimization",
  SILENCE_ACCUMULATION: "Silence Accumulation",
  FRAMING_COMMITMENT: "Framing Commitment",
  AUTHORITY_CENTRALIZATION: "Authority Centralization",
  OPTION_SPACE_CONTRACTION: "Option Space Contraction",
};
const SETB_ADVERSE = new Set([
  "SILENCE_ACCUMULATION",
  "FRAMING_COMMITMENT",
  "AUTHORITY_CENTRALIZATION",
  "OPTION_SPACE_CONTRACTION",
]);

const SETA_ORDER = [
  "stakeholder_trust",
  "organizational_risk",
  "execution_quality",
  "ethical_exposure",
];
const SETA_LABELS = {
  stakeholder_trust: "Stakeholder Trust",
  organizational_risk: "Organizational Risk",
  execution_quality: "Execution Quality",
  ethical_exposure: "Ethical Exposure",
};

const ROUND_TITLES = {
  1: "Weak Signal, Strong Incentives",
  2: "When Ambiguity Becomes Discussable",
  3: "When Alignment Meets Exposure",
  4: "Institutional Memory",
};

// The discussion prompt tagged to each round (script 1.10 / Section 8) — the same ones the
// interstitial shows in play, repeated here so the team can take them away.
const ROUND_PROMPTS = {
  1: "What made your framing feel defensible, given the same evidence every other team held?",
  2: "Did the team converge because the evidence supported it, or because disagreement felt costly?",
  3: "Whose interests were you protecting on the board agenda — the board's, the regulator's, or your own credibility?",
  4: "Was the whistle-channel inquiry treated as a data point or a threat?",
};

const SETB_GLOSSARY = {
  EARLY_SIGNAL_LEGITIMIZATION:
    "Whether a weak, deniable signal was given standing — named, owned and made discussable — before anything forced the issue.",
  SILENCE_ACCUMULATION:
    "Concern that was felt but not voiced. Silence is rarely a single choice; it compounds, and each unspoken round makes the next one easier.",
  FRAMING_COMMITMENT:
    "How tightly the organisation held its first description of the problem once that description became public inside the company.",
  AUTHORITY_CENTRALIZATION:
    "How far judgment collapsed upward — functions deferring to the CEO rather than exercising the authority their role already carried.",
  OPTION_SPACE_CONTRACTION:
    "How much room to act the team still had at the end. Early framing plus accumulated silence quietly removes choices long before anyone notices they are gone.",
};

const SETA_MEANING = {
  stakeholder_trust:
    "How much credibility the team still held with the people it had to answer to — the board, investors, its own staff.",
  organizational_risk:
    "How much unowned exposure the anomaly was still carrying by the end: not whether it got worse, but whether anyone formally held it.",
  execution_quality:
    "Whether the operational response actually resolved the pressure or simply absorbed it round after round.",
  ethical_exposure:
    "The gap between what the company said about Sentinel externally and what the room already knew internally.",
};

/**
 * The Simulator 1 team report.
 *
 * ONE document, two audiences: the facilitator opens it per team from the console, the team opens it
 * from the results screen once the simulation ends, and both see exactly the same thing. It carries
 * no other team's name — a team sees its own rank within the cohort, never the ordered list.
 *
 * Everything here is qualitative by design. Set A and Set B are reported as bands, and the narrative
 * is assembled from what the team actually did rather than from a score. What is deliberately NOT
 * here: the per-decision trail and the framework map. Both are scenario and course IP, and a report
 * is a downloadable file — the facilitator reads that detail in the console, behind the token.
 */
export default function Sim1TeamReport({ data, onClose, sample = false }) {
  useReportFonts();
  if (!data) return null;

  const setB = data.setB || {};
  const constructNodes = setB.constructs || {};
  // The payload carries the BAND only — the 0-100 value behind it is a scoring internal that never
  // leaves the server. Plot the band's midpoint: the profile reads the same, and every label in this
  // report is a band anyway.
  const values = {};
  SETB_ORDER.forEach((c) => {
    const node = constructNodes[c];
    values[c] = node?.value ?? BAND_PLOT[node?.band] ?? 50;
  });
  const standing = data.standing?.constructs || {};
  const cohortSize = data.standing?.teamCount || 0;

  const roster = [...(data.participants || [])].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );
  const rounds = data.rounds || [];
  const noResponses = data.noResponses || 0;

  const bandOf = (v) => (v >= 67 ? "High" : v >= 34 ? "Medium" : "Low");
  const isBad = (c, v) => (SETB_ADVERSE.has(c) ? v >= 67 : v < 34);

  // Strength / development read in the DIRECTION of each construct, not by raw size.
  const scored = SETB_ORDER.map((c) => ({
    c,
    v: values[c],
    // Normalise every construct so that higher always means "did better".
    good: SETB_ADVERSE.has(c) ? 100 - values[c] : values[c],
  })).sort((a, b) => b.good - a.good);
  const strength = scored[0];
  const development = scored[scored.length - 1];

  const when = (ts) => {
    if (!ts) return "—";
    const iso = /[zZ]|[+-]\d{2}:\d{2}$/.test(ts) ? ts : `${ts}Z`;
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Print / Save-as-PDF: name the document so the saved file is meaningful (the browser's print
  // header uses it too), then restore the previous title.
  const printReport = () => {
    const safe = (s) => (s || "").trim().replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
    const prev = document.title;
    document.title = `${safe(data.teamName) || "Team"}_Phoenix_AI_Judgment_Report`;
    window.addEventListener("afterprint", () => { document.title = prev; }, { once: true });
    window.print();
  };

  return createPortal(
    <div className="s1rpt-scrim" onClick={onClose}>
      <div className="s1rpt-toolbar" onClick={(e) => e.stopPropagation()}>
        <span>Team report · {data.teamName}</span>
        <div>
          <button onClick={printReport}>Download PDF</button>
          <button className="ghost" onClick={onClose}>Close</button>
        </div>
      </div>

      <div className="s1rpt" onClick={(e) => e.stopPropagation()}>
        <div className="mast">
          <div className="brand">
            CaseRun<small>Phoenix AI Judgment · ANP Phoenix</small>
          </div>
          {sample && <div className="note">Sample</div>}
        </div>

        <div className="pad">
          <h1 className="title serif">{data.teamName}</h1>
          <div className="subtitle">
            When Can You Trust What Your AI Just Told You? — a leadership judgment simulation in the AI era
          </div>
          <div className="meta-row">
            <div className="meta"><b>Session</b>{when(data.startedAt)}</div>
            <div className="meta"><b>Format</b>4 rounds · 60 minutes</div>
            <div className="meta"><b>Decisions recorded</b>{data.decisionsAnswered ?? 0}</div>
            {cohortSize > 1 && <div className="meta"><b>Cohort</b>{cohortSize} teams</div>}
          </div>
        </div>

        <hr className="divide" />

        <div className="pad">
          <p className="lead">
            The four framing decisions your CEO made are all defensible readings of the same ambiguous
            evidence — leaders genuinely disagree about them. What this report shows is{" "}
            <em>what your team's choices added up to</em>: the posture you settled into, how early it
            set, and what it left you exposed to.
          </p>
        </div>

        <hr className="divide" />

        {/* ── ROSTER ─────────────────────────────────────────────────────── */}
        <section className="pad">
          <div className="sec-label">Team roster</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: "34%" }}>Participant</th>
                <th>Role</th>
                <th>Decisions taken</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((p, i) => (
                <tr key={i}>
                  <td>{p.name || "—"}</td>
                  <td>{ROLE_LABELS[p.role] || p.role}</td>
                  <td>
                    {p.answered} of {p.addressed}
                    {p.noResponses > 0 && (
                      <span className="pill none" style={{ marginLeft: 8 }}>
                        {p.noResponses} no response
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note" style={{ marginTop: 12 }}>
            A decision not submitted before its artifact expired is recorded as <b>No Response</b> — its
            own outcome, never folded into one of the options.{" "}
            {noResponses === 0
              ? "Your team answered every decision that reached it."
              : `${noResponses} went unanswered across the team.`}
          </p>
        </section>

        <hr className="divide" />

        {/* ── SET A ──────────────────────────────────────────────────────── */}
        <section className="pad">
          <div className="sec-label">Where your team ended</div>
          <p className="note" style={{ margin: "-6px 0 16px" }}>
            Four variables ran underneath the whole simulation. You never saw them during play. They are
            reported as bands, not numbers — the band is the finding; a decimal would imply a precision
            this does not have.
          </p>
          {SETA_ORDER.map((c) => {
            const node = data.setA?.[c] || {};
            const adverse = node.adverse;
            const b = node.band;
            const bad = b === (adverse ? "High" : "Low");
            const filled = b === "High" ? 3 : b === "Medium" ? 2 : b === "Low" ? 1 : 0;
            return (
              <div className="band-row" key={c}>
                <div className="band-name">
                  {SETA_LABELS[c]}
                  <span>{adverse ? "Higher is more exposed" : "Higher is stronger"}</span>
                </div>
                <div className="segs">
                  {[0, 1, 2].map((s) => (
                    <div key={s} className={`seg${s < filled ? " on" : ""}${bad ? " bad" : ""}`} />
                  ))}
                </div>
                <div>
                  <span className={`band-val${bad ? " bad" : ""}`}>{b || "—"}</span>
                  <div className="band-meaning">{SETA_MEANING[c]}</div>
                </div>
              </div>
            );
          })}
        </section>

        <hr className="divide" />

        {/* ── THE SPINE ──────────────────────────────────────────────────── */}
        <section className="pad">
          <div className="sec-label">How your team framed it, round by round</div>
          <p className="note" style={{ margin: "-6px 0 4px" }}>
            Each round ended with one framing decision, submitted by the CEO on behalf of the team. Read
            down the column: this is the story your team told itself about the same unchanged anomaly.
          </p>
          {rounds.map((r) => (
            <div className="round" key={r.round}>
              <div className="round-head">
                <span className="round-no serif">{String(r.round).padStart(2, "0")}</span>
                <span className="round-title">{ROUND_TITLES[r.round]}</span>
              </div>
              <div className={`framing${r.submitted ? "" : " missed"}`}>
                <b>Your framing</b>
                {r.submitted
                  ? r.framing
                  : "No framing was submitted before the round closed — the round ended on the clock with the previous framing still standing."}
              </div>
            </div>
          ))}
        </section>

        <hr className="divide" />

        {/* ── SET B PROFILE + RADAR ──────────────────────────────────────── */}
        <section className="pad">
          <div className="sec-label">Leadership construct profile</div>
          <p className="note" style={{ margin: "-6px 0 16px" }}>
            Five constructs describe <em>how</em> your team handled ambiguity, drawn from every decision
            the six of you made — not only the CEO's four.
          </p>

          <div className="chart-wrap" style={{ marginBottom: 10 }}>
            <ConstructRadar
              values={values}
              labels={SETB_FULL}
              adverse={SETB_ADVERSE}
              size={280}
            />
            <div className="chart-legend">
              <div>
                <b>Reading the shape.</b> Each axis runs 0 at the centre to 100 at the rim. A shape that
                reaches far on the four adverse axes is not a strong profile — it is a team whose options
                narrowed.
              </div>
              <div>
                Only <b>Early Signal Legitimization</b> is favourable when it reaches the rim. The other
                four describe pressure building against you.
              </div>
              {cohortSize > 1 && (
                <div>Ranks below are against the {cohortSize} teams in your cohort.</div>
              )}
            </div>
          </div>

          <ConstructBars
            values={values}
            labels={SETB_FULL}
            adverse={SETB_ADVERSE}
            standing={standing}
          />

          <p className="note" style={{ marginTop: 16 }}>
            <b>Dominant pattern: {setB.dominantPattern || "—"}.</b> Option Space Contraction is not
            measured directly — it compounds from accumulated Silence and Framing Commitment.
            {setB.effects?.escalationForeclosed
              ? " Your team crossed the Round-1 silence threshold, the point after which escalation starts costing more than it saves."
              : " Your team stayed below the Round-1 silence threshold, so escalation remained available throughout."}
          </p>
          {(setB.insights || []).map((s, i) => (
            <p className="note" key={i} style={{ marginTop: 6 }}>• {s}</p>
          ))}
        </section>

        <hr className="divide" />

        {/* ── GLOSSARY ───────────────────────────────────────────────────── */}
        <section className="pad">
          <div className="sec-label">What the five constructs mean</div>
          <div className="gloss">
            {SETB_ORDER.map((c) => (
              <div key={c}>
                <h4>{SETB_FULL[c]}</h4>
                <div className="dir">
                  {SETB_ADVERSE.has(c) ? "Higher is more concerning" : "Higher is stronger"}
                </div>
                <p>{SETB_GLOSSARY[c]}</p>
              </div>
            ))}
            <div>
              <h4>Reading the bands</h4>
              <div className="dir">Low · Medium · High</div>
              <p>
                Bands, not scores. Only Early Signal Legitimization is favourable when high; the other
                four describe pressure that builds against you.
              </p>
            </div>
          </div>
        </section>


        <hr className="divide" />

        {/* ── STRENGTH / DEVELOPMENT ─────────────────────────────────────── */}
        <section className="pad narr">
          <div className="sec-label">Where your trajectory was set</div>
          <p>
            Your strongest dimension was <b>{SETB_FULL[strength.c]}</b> ({bandOf(strength.v)}
            {standing[strength.c]?.outOf > 1
              ? `, ${ordinal(standing[strength.c].rank)} of ${standing[strength.c].outOf} in the cohort`
              : ""}
            ). The one to sit with is <b>{SETB_FULL[development.c]}</b> ({bandOf(development.v)}
            {standing[development.c]?.outOf > 1
              ? `, ${ordinal(standing[development.c].rank)} of ${standing[development.c].outOf}`
              : ""}
            ) — {SETB_GLOSSARY[development.c].toLowerCase()}
          </p>
          <p>
            {isBad("SILENCE_ACCUMULATION", values.SILENCE_ACCUMULATION) || noResponses > 0
              ? `Concern that is felt but not voiced is the quietest failure mode in this simulation. ${
                  noResponses > 0
                    ? `Your team let ${noResponses} decision${noResponses === 1 ? "" : "s"} expire unanswered — each one is a position the organisation took by default.`
                    : "Watch where your team held back rather than where it acted."
                }`
              : "Your team kept raising things rather than absorbing them, which is what kept the option space open."}
          </p>
          <p>
            Nothing here required anyone to behave badly. The anomaly never worsened, no customer
            complained, and every individual decision was defensible on its own. That is the point worth
            carrying out of the room.
          </p>
        </section>

        <hr className="divide" />

        {/* ── PROMPTS ────────────────────────────────────────────────────── */}
        <section className="pad">
          <div className="sec-label">Questions to sit with</div>
          <ol className="prompts">
            {[1, 2, 3, 4].map((n) => (
              <li key={n}>
                <b>Round {n} · {ROUND_TITLES[n]}</b>
                {ROUND_PROMPTS[n]}
              </li>
            ))}
          </ol>
        </section>


        <div className="foot">
          CaseRun measures how leadership teams handle ambiguity. Your facilitator walks through the
          cohort patterns in the live debrief. © CaseRun.
        </div>
      </div>
    </div>,
    document.body,
  );
}
