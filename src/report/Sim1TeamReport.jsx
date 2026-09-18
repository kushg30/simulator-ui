import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CohortBars,
  ResultsRadar,
  TrajectoryChart,
  VariableLegend,
} from "./Sim1Charts";
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


// Two of the four were renamed by the final script, and one reversed direction: the
// organizational_risk column now carries Governance Accountability, where high is GOOD. The storage
// keys stay as they are so the recorded cohort sessions keep resolving.
const SETA_LABELS = {
  stakeholder_trust: "Stakeholder Trust",
  organizational_risk: "Governance Accountability",
  execution_quality: "Diagnostic Rigor",
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


// The results payload names the four variables with the script's short keys; the report has always
// keyed its labels and meanings by the engine's storage key. One map joins them, so the report and
// the Final Results Screen describe the same four things in the same words.
const KEY_TO_CONSTRUCT = {
  trust: "stakeholder_trust",
  governance: "organizational_risk",
  rigor: "execution_quality",
  exposure: "ethical_exposure",
};

const PROVENANCE =
  "Stakeholder Trust and Governance Accountability draw on Badaracco's writing on right-versus-right " +
  "decisions, where every option carries a real cost. Diagnostic Rigor and Ethical Exposure draw on " +
  "Bazerman and Tenbrunsel's research on why capable, well-intentioned people still miss what is in " +
  "front of them. None of these four is a certified psychometric instrument — they are a structured " +
  "way of asking the same four questions consistently across every decision the six of you made.";

const SETA_MEANING = {
  stakeholder_trust:
    "How much the people outside your leadership team believed you were being straight with them.",
  organizational_risk:
    "How clearly your team could always point to who owned a decision, and why.",
  execution_quality:
    "How often your team checked claims with evidence instead of assuming.",
  ethical_exposure:
    "How exposed your company would be if today's choices became public tomorrow.",
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
  const sheetRef = useRef(null); // the printable sheet, copied into the print iframe
  if (!data) return null;

  // Everything scored in this report comes from the SAME payload the Final Results Screen renders.
  // The two used to compute independently and disagreed with each other on the same team.
  const res = data.results || {};
  const resVars = res.variables || [];
  const labels = Object.fromEntries(
    Object.entries(KEY_TO_CONSTRUCT).map(([k, c]) => [k, SETA_LABELS[c]]),
  );
  const meaningOf = (k) => SETA_MEANING[KEY_TO_CONSTRUCT[k]];
  const cohortSize = res.teamCount || 0;

  const roster = [...(data.participants || [])].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );
  const rounds = data.rounds || [];
  const noResponses = data.noResponses || 0;

  // Strength / development read in the DIRECTION of each variable, not by raw size: on Ethical
  // Exposure — the one adverse variable — a low number is the good outcome. Each variable is scored
  // as how far along its OWN possible range the team landed, so four different ranges compare fairly.
  const scored = resVars
    .map((v) => {
      const span = (v.max ?? 0) - (v.min ?? 0);
      const pos = span > 0 ? ((v.points - v.min) / span) * 100 : 50;
      return { k: v.key, v, good: v.lowerIsBetter ? 100 - pos : pos };
    })
    .sort((a, b) => b.good - a.good);
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

  // Print / Save-as-PDF.
  //
  // Two things have to be true and both were broken:
  //
  //  - The PAGES must not be blank. The report is portalled into <body> inside a position:fixed,
  //    overflow:auto scrim over the dark app, and printing that lays out one viewport and takes it
  //    out of flow, so the output is empty. A first attempt printed a hidden 0x0 iframe instead —
  //    but a browser will not print a zero-size or visually hidden frame, and Chrome quietly falls
  //    back to printing the TOP document, which is the blank scrim again. The print surface has to
  //    be a real, laid-out, on-screen-sized document.
  //
  //  - The FILE must be named for the team. Chrome names the PDF after the title of the document it
  //    actually printed, which is why the fallback produced "CaseRun.pdf" — the parent page title.
  //
  // So: open the sheet as its own document, titled for the team, and print that. A window opened
  // from a click is not popup-blocked; if it is blocked anyway, fall back to an off-screen but
  // properly sized iframe, and set the parent title so even that names the file correctly.
  const printReport = () => {
    const safe = (s) => (s || "").trim().replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
    const fileName = `${safe(data.teamName) || "Team"}_Phoenix_AI_Judgment_Report`;
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Carry across THIS REPORT's rules and nothing else.
    //
    // Taking the app's whole stylesheet was what blanked the PDF: the Sim 2 report ships
    // `@media print { body > *:not(.rpt-scrim) { display: none } }`, it lands in the same bundle, and
    // it hid the Sim 1 scrim wholesale. Shipping only the rules that mention this report means no
    // unrelated stylesheet can reach the print document at all — including the next one somebody adds.
    //
    // Rules are inlined rather than linked because a <link> loads asynchronously and against the new
    // document's base URL, so the print could fire before the CSS arrived and print unstyled. Our own
    // stylesheets are same-origin, so cssRules reads fine; a cross-origin one (the webfonts) falls
    // back to a link and is covered by the font wait below.
    const MINE = /s1rpt/;
    const collect = (rules) =>
      Array.from(rules)
        .map((r) => {
          if (r.type === CSSRule.MEDIA_RULE) {
            const inner = collect(r.cssRules);
            return inner ? `@media ${r.conditionText}{${inner}}` : "";
          }
          if (r.type === CSSRule.FONT_FACE_RULE || r.type === CSSRule.PAGE_RULE) return r.cssText;
          return r.selectorText && MINE.test(r.selectorText) ? r.cssText : "";
        })
        .filter(Boolean)
        .join("\n");

    const styles = Array.from(document.styleSheets)
      .map((ss) => {
        try {
          const css = collect(ss.cssRules);
          return css ? `<style>${css}</style>` : "";
        } catch {
          // Cross-origin (the webfont stylesheet) — link it and let the font wait cover it.
          return ss.href ? `<link rel="stylesheet" href="${ss.href}">` : "";
        }
      })
      .join("");

    const html =
      `<!doctype html><html><head><meta charset="utf-8"><title>${fileName}</title>` +
      `<base href="${document.baseURI}">${styles}` +
      `<style>` +
      // The sheet IS the document here. It is still wrapped in .s1rpt-scrim because the app's own
      // print rules hide every body child that is NOT the scrim — a rule written for the live page,
      // where the scrim is what wraps the report. Dropping the wrapper made that rule hide the sheet
      // itself, which is what produced the blank PDF. Keeping the wrapper lets those rules do exactly
      // what they were written to do instead of fighting them.
      `html,body{background:#fff!important;margin:0!important;padding:0!important;` +
      `height:auto!important;overflow:visible!important;display:block!important}` +
      `.s1rpt-scrim{position:static!important;inset:auto!important;display:block!important;` +
      `background:#fff!important;padding:0!important;height:auto!important;` +
      `overflow:visible!important;backdrop-filter:none!important}` +
      `.s1rpt-toolbar{display:none!important}` +
      `.s1rpt{box-shadow:none!important;margin:0 auto!important;max-width:none!important;` +
      `border-radius:0!important;overflow:visible!important}` +
      `@page{margin:12mm}` +
      `@media print{.s1rpt{margin:0!important}}` +
      `</style></head><body><div class="s1rpt-scrim">${sheet.outerHTML}</div></body></html>`;

    // Wait for layout and webfonts before printing, or the first page lays out in the fallback face.
    const printDoc = (win, cleanup) => {
      const fire = () => {
        try {
          win.focus();
          win.print();
        } catch {
          /* the user can still print the open window by hand */
        }
        cleanup();
      };
      const fonts = win.document.fonts && win.document.fonts.ready;
      (fonts || Promise.resolve()).then(() => setTimeout(fire, 250)).catch(() => setTimeout(fire, 500));
    };

    const win = window.open("", "_blank", "width=900,height=1000");
    if (win && win.document) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      // Leave the window open after printing: if the user cancels the dialog, closing it would throw
      // away the rendered report and they would have nothing to retry from.
      printDoc(win, () => {});
      return;
    }

    // Popup blocked. Use an iframe that is off-screen but REAL — a full page wide and tall, never
    // display:none or visibility:hidden, or the browser prints the parent document instead.
    const prevTitle = document.title;
    document.title = fileName; // Chrome takes the PDF name from the top document in this path
    const frame = document.createElement("iframe");
    frame.setAttribute("title", fileName);
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:900px;height:1200px;border:0";
    frame.srcdoc = html;
    frame.onload = () =>
      printDoc(frame.contentWindow, () => {
        setTimeout(() => {
          frame.remove();
          document.title = prevTitle;
        }, 1000);
      });
    document.body.appendChild(frame);
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

      <div className="s1rpt" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
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
            Four variables ran underneath the whole simulation. You never saw them during play. Each
            one is shown as the points your team accumulated against the full range that was available
            on it, and the band those points fall into. These are the same figures as your results
            screen.
          </p>
          {resVars.map((v) => {
            const bad = v.band === (v.lowerIsBetter ? "High" : "Low");
            const filled = v.band === "High" ? 3 : v.band === "Medium" ? 2 : v.band === "Low" ? 1 : 0;
            return (
              <div className="band-row" key={v.key}>
                <div className="band-name">
                  {labels[v.key]}
                  <span>{v.lowerIsBetter ? "Higher is more exposed" : "Higher is stronger"}</span>
                </div>
                <div className="segs">
                  {[0, 1, 2].map((s) => (
                    <div key={s} className={`seg${s < filled ? " on" : ""}${bad ? " bad" : ""}`} />
                  ))}
                </div>
                <div>
                  <span className={`band-val${bad ? " bad" : ""}`}>{v.band || "—"}</span>
                  <span className="band-points">
                    {v.points > 0 ? `+${v.points}` : v.points}
                    <span className="band-range"> of {v.min} to {v.max}</span>
                  </span>
                  <div className="band-meaning">{meaningOf(v.key)}</div>
                </div>
              </div>
            );
          })}

          {/* The composite is the one number that ranks teams, so the report states how it is made
              rather than leaving a bare figure to be misread as a percentage or a mark out of 100. */}
          {res.composite != null && (
            <div className="composite-row">
              <div>
                <div className="composite-val serif">
                  {res.composite > 0 ? `+${res.composite}` : res.composite}
                </div>
                <div className="composite-cap">
                  composite score
                  {res.compositeMin != null && res.compositeMax != null
                    ? ` · range ${res.compositeMin} to ${res.compositeMax}`
                    : ""}
                </div>
              </div>
              {cohortSize > 1 && (
                <div>
                  <div className="composite-val serif">
                    {res.rank}
                    <span className="composite-of"> of {cohortSize}</span>
                  </div>
                  <div className="composite-cap">in your cohort</div>
                </div>
              )}
              <p className="note composite-note">
                The composite adds the three variables where more is better — Stakeholder Trust,
                Governance Accountability and Diagnostic Rigor — and subtracts Ethical Exposure, the
                one where more is worse. It is a signed total, not a percentage: a negative composite
                means the exposure your team took on outweighed the trust, accountability and rigor it
                built. Zero is the neutral line, not the floor.
              </p>
            </div>
          )}
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

        {/* ── WHICH ROUND SET THE RESULT ─────────────────────────────────── */}
        <section className="pad">
          <div className="sec-label">Which round set your result</div>
          <p className="note" style={{ margin: "-6px 0 12px" }}>
            Each line is a running total across the four rounds. A final number cannot show where it
            came from — this can.
          </p>
          <VariableLegend labels={labels} theme="light" />
          <div className="chart-wrap" style={{ marginTop: 8 }}>
            <TrajectoryChart trajectory={res.trajectory} labels={labels} theme="light" />
          </div>

          <div className="chart-wrap" style={{ marginTop: 18 }}>
            <ResultsRadar variables={resVars} labels={labels} size={300} theme="light" />
            <div className="chart-legend">
              <div>
                <b>Reading the shape.</b> Each axis is plotted against its OWN possible range, so a
                point near the rim means your team went as far as this simulation allowed on that
                variable — not that it scored 100.
              </div>
              <div>
                <b>Ethical Exposure is the one axis where far is bad.</b> On the other three, further
                out is the stronger outcome.
              </div>
            </div>
          </div>
        </section>

        {cohortSize > 1 && (
          <>
            <hr className="divide" />
            <section className="pad">
              <div className="sec-label">Your team against the cohort</div>
              <p className="note" style={{ margin: "-6px 0 12px" }}>
                Every team's composite score, ranked, with yours highlighted. No other team is named.
                The shape of the spread says more than the position does — a tight cluster means the
                cohort converged on the same reading of the same evidence.
              </p>
              <CohortBars cohort={res.cohort} theme="light" />
            </section>
          </>
        )}

        {res.framingCommitment && (
          <>
            <hr className="divide" />
            <section className="pad">
              <div className="sec-label">Framing commitment</div>
              <p className="note" style={{ margin: "-6px 0 12px" }}>
                The option your CEO chose each round, read as a pattern. This is descriptive only — it
                carries no score and does not affect your rank.
              </p>
              <div className="fc-row">
                <div className="fc-label serif">{res.framingCommitment.label}</div>
                <div className="fc-path">
                  {(res.framingCommitment.path || []).map((p, i) => (
                    <span key={i} className={`fc-step${p == null ? " gap" : ""}`}>
                      {p == null ? "—" : p}
                    </span>
                  ))}
                </div>
              </div>
              <p className="note" style={{ marginTop: 10 }}>{res.framingCommitment.note}</p>
            </section>
          </>
        )}

        <hr className="divide" />

        {/* ── GLOSSARY ───────────────────────────────────────────────────── */}
        <section className="pad">
          <div className="sec-label">What the four variables mean</div>
          <div className="gloss">
            {resVars.map((v) => (
              <div key={v.key}>
                <h4>{labels[v.key]}</h4>
                <div className="dir">
                  {v.lowerIsBetter ? "Higher is more concerning" : "Higher is stronger"}
                </div>
                <p>{meaningOf(v.key)}</p>
              </div>
            ))}
            <div>
              <h4>Reading the bands</h4>
              <div className="dir">Low · Medium · High</div>
              <p>
                Each band is a third of the range that variable could actually reach in this
                simulation, so Medium means the middle third of what was available — not a mark out of
                100.
              </p>
            </div>
            <div>
              <h4>Where these come from</h4>
              <div className="dir">Provenance</div>
              <p>{PROVENANCE}</p>
            </div>
          </div>
        </section>


        <hr className="divide" />

        {/* ── STRENGTH / DEVELOPMENT ─────────────────────────────────────── */}
        <section className="pad narr">
          <div className="sec-label">Where your trajectory was set</div>
          {strength && development && (
            <p>
              Your strongest variable was <b>{labels[strength.k]}</b> ({strength.v.band}
              {cohortSize > 1 ? `, in a cohort of ${cohortSize} teams` : ""}). The one to sit with is{" "}
              <b>{labels[development.k]}</b> ({development.v.band}) — {meaningOf(development.k).replace(/^How/, "how")}
            </p>
          )}
          <p>
            {noResponses > 0
              ? `Concern that is felt but not voiced is the quietest failure mode in this simulation. Your team let ${noResponses} decision${noResponses === 1 ? "" : "s"} expire unanswered — each one is a position the organisation took by default.`
              : "Your team answered every decision that reached it, which is what kept the option space open. Where a team goes quiet, the organisation still takes a position — just not one anybody chose."}
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
