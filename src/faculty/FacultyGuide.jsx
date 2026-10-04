import { useRef, useState } from "react";
import Collapsible from "./Collapsible";
import "./facultyGuide.css";

/**
 * The facilitation guide for Phoenix AI Judgment — the document a facilitator reads before the
 * session and keeps open during it.
 *
 * <p>Lives behind the facilitator token for the same reason the debrief does: section 2 states what
 * the simulation is actually testing, and section 6 gives the scoring model outright. A student who
 * read either would know that silence is penalised and that the anomaly never worsens, which is the
 * whole thing the design withholds.
 *
 * <p>Sim 1 (60 minutes) and Sim 3 (20 minutes) run identical content on different clocks, so the
 * run sheet is parameterised by build rather than duplicated — one set of teaching notes, two sets
 * of timings.
 */

const ROLES = [
  ["CEO", "Owns the round-ending framing. The only seat that submits it."],
  ["CFO", "Carries the cost and guidance pressure. Bonus tied to rollout speed."],
  ["CHRO", "Sees the culture signals — who feels able to raise a concern."],
  ["Head of Engineering", "Closest to the anomaly, and the least confident about it."],
  ["Head of Operations", "Watches the override queue climb."],
  ["Head of Product", "Holds the client relationships that cite Sentinel by name."],
];

/**
 * Per-round structure, read off the seeded content. `feed` is when the last artifact of the round
 * lands; `framing` is when the CEO's round-ending decision opens.
 */
const BUILDS = {
  sim1: {
    label: "Sim 1 — 60 minutes",
    path: "caserun.in/sim1",
    total: 60,
    rounds: [
      { n: 1, mins: 17, artifacts: 16, decisions: 14, feed: 8, framing: 13 },
      { n: 2, mins: 16, artifacts: 16, decisions: 13, feed: 8, framing: 12 },
      { n: 3, mins: 14, artifacts: 14, decisions: 14, feed: 7, framing: 11 },
      { n: 4, mins: 13, artifacts: 13, decisions: 13, feed: 6, framing: 10 },
    ],
  },
  sim3: {
    label: "Sim 3 — 20 minutes",
    path: "caserun.in/sim3",
    total: 20,
    rounds: [
      { n: 1, mins: 6, artifacts: 16, decisions: 14, feed: 3, framing: 4 },
      { n: 2, mins: 5, artifacts: 16, decisions: 13, feed: 2, framing: 3 },
      { n: 3, mins: 5, artifacts: 14, decisions: 14, feed: 3, framing: 4 },
      { n: 4, mins: 4, artifacts: 13, decisions: 13, feed: 1, framing: 2 },
    ],
  },
};

/** Round titles, the beat each one plays, and what to listen for while it runs. */
const ROUNDS = [
  {
    n: 1,
    title: "Weak Signal, Strong Incentives",
    beat:
      "A CRO note reaches everyone: Sentinel has produced anomaly flags that do not match its own " +
      "stated reasoning. No customer complaint, no loss, no breach, nothing over the escalation " +
      "threshold. Each role then receives private information shaped by their own incentives.",
    watch: [
      "Who speaks first. In most teams that person's framing becomes the team's framing.",
      "Whether Engineering's doubt actually reaches the CEO, or stays inside Engineering.",
      "Whether anyone asks what \"AI inaccuracy\" means here. No two functions are using the same definition, and nobody usually notices.",
      "How fast the room moves to a decision. Speed here is the finding, not efficiency.",
    ],
    framings: [
      "This is a technical monitoring matter — Engineering owns it, no broader leadership framing needed.",
      "This is a commercial risk to the rollout — leadership owns it as a speed problem, framed around protecting the timeline.",
      "This is a governance matter — leadership owns it as a trust problem, framed around what happens if it's wrong later.",
    ],
    prompt:
      "Compare CEO framings across teams. What made the “technical monitoring matter” framing feel defensible to some teams and not others, given the same information?",
  },
  {
    n: 2,
    title: "When Ambiguity Becomes Discussable",
    beat:
      "The override queue keeps climbing. A cross-functional thread shows the functions describing " +
      "the same thing differently. The Leadership Alignment Meeting lands in everyone's feed — but " +
      "only the CEO can answer it.",
    watch: [
      "The Leadership Alignment Meeting is the tell: everyone sees it, one person answers it. Does the team discuss it, or does the CEO just click?",
      "Whether anyone revisits Round 1's framing now that the language has visibly diverged.",
      "The CHRO's signal that people are asking whether it is safe to keep raising this. Teams that skip past it usually score low on Trust later.",
      "Whether “nothing has changed” is being used as evidence. Nothing changing is not the same as nothing being there.",
    ],
    framings: [
      "Contained operational matter — hold the language. Nothing has technically changed since Round 1.",
      "Structured reporting, no escalation — treat this as a process gap to fix, not a risk finding.",
      "Governance oversight, formal documentation — put it on record now, before someone outside the company does.",
    ],
    prompt:
      "Did the team converge because the evidence supported it, or because disagreement felt costly? Who spoke first, and did that shape the outcome?",
  },
  {
    n: 3,
    title: "When Alignment Meets Exposure",
    beat:
      "Attention arrives from outside: a regulator pre-read, an investor asking the same question a " +
      "second time, the item appearing on a board agenda. The anomaly itself is unchanged.",
    watch: [
      "The central question of the whole simulation: is the framing changing because the evidence changed, or because someone outside started watching?",
      "Teams that escalate here almost always say it is “new information.” Press them — what is new is the audience.",
      "Whether the team can still name who owns the decision. By Round 3 many cannot.",
      "Language drift between what is said internally and what is written for the regulator.",
    ],
    framings: [
      "Maintain internal monitoring posture — two rounds of stable signal; changing course now would be reacting to attention, not evidence.",
      "Formalize reporting without escalation — add rigor to the process without declaring a finding we don't have.",
      "Elevate documentation and board visibility now — the pattern of repeated outside questions is itself the signal, even if the anomaly hasn't changed.",
    ],
    prompt:
      "Whose interests were you protecting on the board agenda — the board's, the regulator's, or your own credibility? Name the trade-off explicitly.",
  },
  {
    n: 4,
    title: "Institutional Memory",
    beat:
      "A whistle-channel inquiry arrives, alongside a retrospective asking the team to characterise " +
      "its own four rounds. The CEO's final decision is the team's verdict on itself.",
    watch: [
      "Whether the whistle-channel inquiry is treated as a data point or as a threat. This is the clearest read on the culture the team built.",
      "Whether the team's self-assessment matches what they actually did. Most teams rate themselves more coherent than their own trail shows.",
      "Who, if anyone, says “we should have escalated in Round 1.”",
    ],
    framings: [
      "Call it an appropriate, proportional response — the team read weak signals correctly and didn't overreact to noise.",
      "Call it fragmented alignment — different functions read the same signals differently, and the team never fully reconciled that.",
      "Call it under-recognized governance exposure — across four rounds the organization had enough signal to act sooner, and the incentive structure made sure nobody did.",
    ],
    prompt:
      "Was the whistle-channel inquiry treated as a data point or a threat? What does that reveal about the AI culture the team built over three prior rounds?",
  },
];

const VARIABLES = [
  ["Stakeholder Trust", "-17 to +19", "How much the people outside the leadership team believed they were being told the truth. Falls when external answers are smoother than internal ones."],
  ["Governance Accountability", "-20 to +26", "Whether the team could always point to who owned a decision, and why. Rises with naming an owner, falls when things resolve by default."],
  ["Diagnostic Rigor", "-12 to +15", "How often claims were checked against evidence rather than assumed. The variable most damaged by “it hasn't changed” reasoning."],
  ["Ethical Exposure", "-14 to +15", "How exposed the company would be if today's choices became public tomorrow. The only variable where a HIGH number is the bad outcome."],
];

const PATTERNS = [
  ["Anchored", "One framing held for most or all of the simulation. Ask whether that was conviction or commitment — and what would have had to happen for them to move."],
  ["Escalating", "Framing moved toward formal governance ownership as rounds progressed. Ask what triggered each step: new evidence, or new attention?"],
  ["De-escalating", "The team stepped back from an earlier, more formal framing. Rare and worth time — ask who pushed for it and what the argument was."],
  ["Responsive", "Framing moved without one clear direction. Ask whether that was adaptation to each round, or the absence of a position."],
  ["Incomplete", "Two or more rounds have no submitted framing. Treat as its own finding: the organization still took a position, just not one anyone chose."],
];

const FRAMEWORKS = [
  ["Ansoff — weak signals", "Round 1. A signal below the threshold of certainty still carries information."],
  ["Vaughan — normalization of deviance", "Rounds 1-2. Each round the anomaly goes unaddressed, it becomes more normal to leave it unaddressed."],
  ["Edmondson — psychological safety", "Round 1 and the Round 4 whistle channel. Whether raising a concern felt survivable."],
  ["Weick — sensemaking", "Round 2. The framing the organization commits to becomes the reality it then defends."],
  ["Janis — groupthink", "Round 2. Convergence that comes from the cost of disagreement, not from evidence."],
  ["Three Lines of Defense", "Round 3. Who owns risk, who oversees it, who assures it — and whether the team can still say."],
  ["Badaracco — right-versus-right", "Throughout. Every option carries a real cost; none is costless."],
  ["Bazerman & Tenbrunsel — ethical fading", "Throughout. Why capable, well-intentioned people miss what is in front of them."],
  ["NIST AI RMF · Gartner AI TRiSM", "The close. Govern / Map / Measure / Manage maps onto the four variables for the “what does this look like in practice” question."],
];

const TROUBLESHOOTING = [
  ["A team cannot start — “unable to start”", "Every role seat must be filled before a run begins. Open the team's Roles screen: a seat showing as free is the blocker, not the button."],
  ["A student closed their tab", "They rejoin on the same simulation link and pick their seat again. Their participant record and everything they have already answered survive."],
  ["A round went wrong and needs redoing", "Restart last round in the console. It clears that round's recorded decisions for that team and reopens it — use it before the round ends, not after the simulation completes."],
  ["A team is behind and needs a moment", "Pause that team, or pause the whole class. Paused time never counts against the round clock, so nobody loses feed time."],
  ["The first click of the session is slow", "The backend sleeps when idle. Open the console and load the overview about five minutes before the session so it is warm when students arrive."],
  ["Someone joined the wrong team", "Terminate that team's run and re-form it. Terminating shows every member a clear session-ended screen rather than leaving them on a dead clock."],
];

const QUESTIONS = [
  ["“What was the right answer?”", "There isn't one, and that is the design, not a dodge. What is measured is whether the team could say who owned a decision, whether it checked claims against evidence, whether it was straight with people outside the room, and how exposed it left the company. Any of the three framings can score well or badly depending on how the rest of the team behaved around it."],
  ["“Why did No Response score worse than a bad choice?”", "Because in the real version it is worse. Not answering is still a position — the organization proceeds as though nothing was raised — but nobody has to own it. A No Response is scored as the worst outcome that decision offered on every variable it could have moved."],
  ["“Could we see our score during the simulation?”", "No, deliberately. A visible score turns the exercise into optimising a number instead of making a judgment. Everything is revealed at once on the results screen at the end."],
  ["“Did our individual decisions matter, or only the CEO's?”", "All six seats, every round. The CEO's four framings are recorded as a pattern but are never scored. Every other decision the six of you made is."],
  ["“The anomaly never actually got worse — was that a trick?”", "It is the point. No new facts arrive proving harm. What changes across the four rounds is who is paying attention. If a team's framing moved, it is worth asking what moved it."],
];

export default function FacultyGuide() {
  const [build, setBuild] = useState("sim1");
  const sheetRef = useRef(null);
  const cfg = BUILDS[build];

  /**
   * Print to a separate window rather than the live page.
   *
   * The console's own print stylesheet hides every body child that is not a report scrim, so
   * printing this page directly produces blank paper. Rather than add another exception to that
   * rule — the pattern that produced the blank-PDF bug in the first place — the guide is written
   * into its own document carrying only its own rules, where no other stylesheet can reach it.
   */
  const print = () => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const MINE = /fguide/;
    const collect = (rules) =>
      Array.from(rules)
        .map((r) => {
          if (r.type === CSSRule.MEDIA_RULE) {
            const inner = collect(r.cssRules);
            return inner ? `@media ${r.conditionText}{${inner}}` : "";
          }
          if (r.type === CSSRule.PAGE_RULE) return r.cssText;
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
          return "";
        }
      })
      .join("");

    const title = `Phoenix_AI_Judgment_Facilitation_Guide_${build === "sim1" ? "60min" : "20min"}`;
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${styles}` +
        `<style>html,body{background:#fff!important;margin:0!important;padding:0!important}` +
        `.fguide{color:#111!important;background:#fff!important;max-width:none!important;padding:0!important}` +
        `.fguide details{display:block!important}` +
        `.fguide .fguide-noprint{display:none!important}` +
        `@page{margin:14mm}</style></head><body>${sheet.outerHTML}</body></html>`
    );
    win.document.close();
    const fire = () => {
      win.focus();
      win.print();
    };
    if (win.document.readyState === "complete") setTimeout(fire, 120);
    else win.addEventListener("load", () => setTimeout(fire, 120));
  };

  const rounds = ROUNDS.map((r) => ({ ...r, ...cfg.rounds.find((x) => x.n === r.n) }));

  return (
    <div>
      <div className="f-row fguide-noprint" style={{ marginBottom: 14, alignItems: "center" }}>
        <button className={build === "sim1" ? "" : "f-ghost"} onClick={() => setBuild("sim1")}>
          {BUILDS.sim1.label}
        </button>
        <button className={build === "sim3" ? "" : "f-ghost"} onClick={() => setBuild("sim3")}>
          {BUILDS.sim3.label}
        </button>
        <button className="f-ghost" onClick={print} style={{ marginLeft: "auto" }}>
          Print / Save as PDF
        </button>
      </div>

      <div className="fguide" ref={sheetRef}>
        <div className="fguide-mast">
          <div className="fguide-eyebrow">Facilitation guide · facilitator only</div>
          <h1>Phoenix AI Judgment</h1>
          <p className="fguide-lede">
            A six-role leadership simulation about a GenAI system that produces anomaly flags it
            cannot fully explain. Nothing breaks. The question is what an organization does with a
            signal that never forces its hand.
          </p>
          <div className="fguide-meta">
            <span><b>{cfg.total} min</b> total play</span>
            <span><b>4</b> rounds</span>
            <span><b>6</b> participants per team</span>
            <span><b>63</b> artifacts · <b>54</b> scored decisions</span>
            <span><b>{cfg.path}</b></span>
          </div>
        </div>

        {/* ── 1 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>1 · Before the session</h2>
          <div className="fguide-grid">
            <div>
              <h4>The seats</h4>
              <dl className="fguide-dl">
                {ROLES.map(([r, d]) => (
                  <div key={r}><dt>{r}</dt><dd>{d}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <h4>Setup checklist</h4>
              <ol className="fguide-ol">
                <li>Open <b>/faculty</b> and load the overview about five minutes early — it wakes the backend so the first student click is not the slow one.</li>
                <li>Share the link <b>{cfg.path}</b> and the access code. The code is a gate against passers-by, not a security control.</li>
                <li>Students form teams of six: one creates the team and reads out the 4-digit join code, the rest join and pick a seat.</li>
                <li>Confirm every team shows six filled seats. A team with an empty seat cannot start.</li>
                <li>Start the round from the console when the room is ready.</li>
              </ol>
              <p className="fguide-note">
                Teams run on their own clocks once started, so they do not need to begin in the same
                second — but a whole-class start makes the debrief easier to run.
              </p>
            </div>
          </div>
        </section>

        {/* ── 2 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>2 · What this simulation is actually testing</h2>
          <p className="fguide-warn">
            Faculty only. If participants read this section before playing, the exercise stops working.
          </p>
          <ul className="fguide-ul">
            <li>
              <b>The anomaly never worsens.</b> Across all four rounds no new fact arrives proving
              harm. What changes is who is paying attention — Engineering, then the organization,
              then a regulator and an investor, then the whistle channel. Any framing change a team
              makes is therefore a response to <em>attention</em>, and that is the thing to surface
              in the debrief.
            </li>
            <li>
              <b>Every individual decision is defensible.</b> Nobody has to behave badly for a team
              to end up exposed. That is the point worth carrying out of the room, and it is why the
              debrief should never be run as a reveal of who got it wrong.
            </li>
            <li>
              <b>Silence is scored as the worst outcome available.</b> Not as neutral. A decision that
              expires unanswered is recorded as No Response and takes the worst value that decision
              offered on every variable it could have moved — because an organization that does not
              answer still proceeds, it just does so without anyone owning it.
            </li>
            <li>
              <b>Every round's framing runs the same ladder.</b> Option 1 contains, option 2 reports,
              option 3 governs. Reading a team's four choices as a sequence of 1s, 2s and 3s is the
              fastest way to see the shape of what they did — which is exactly what the Framing
              Commitment pattern on the results screen does.
            </li>
            <li>
              <b>There is no winning answer.</b> Option 3 every round is not a high score. A team that
              escalates immediately and never checks anything still scores poorly on Diagnostic Rigor.
            </li>
          </ul>
        </section>

        {/* ── 3 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>3 · Run sheet</h2>
          <p className="fguide-note">
            All offsets are measured from the start of that round, not the session. Each round has its
            own T+0.
          </p>
          {rounds.map((r) => (
            <div className="fguide-round" key={r.n}>
              <div className="fguide-round-head">
                <span className="fguide-round-no">Round {r.n}</span>
                <span className="fguide-round-title">{r.title}</span>
                <span className="fguide-round-facts">
                  {r.mins} min · {r.artifacts} artifacts · feed ends T+{r.feed} · CEO framing opens T+{r.framing}
                </span>
              </div>
              <p className="fguide-beat">{r.beat}</p>
              <h5>What to watch for</h5>
              <ul className="fguide-ul">
                {r.watch.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
              <h5>The CEO's three framings</h5>
              <ol className="fguide-framings">
                {r.framings.map((f, i) => <li key={i}>{f}</li>)}
              </ol>
            </div>
          ))}
        </section>

        {/* ── 4 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>4 · Controls during play</h2>
          <dl className="fguide-dl fguide-dl-wide">
            <div><dt>Pause / Resume</dt><dd>One team or the whole class. Paused time never counts against the round clock, so pausing to settle a room costs nobody feed time. Decisions are refused server-side while paused.</dd></div>
            <div><dt>News interrupt</dt><dd>A full-screen external-news modal to every seat, holding the clock about 25 seconds. The sharpest tool you have for raising pressure mid-round. Leaves no inbox entry — it is atmosphere, not an artifact.</dd></div>
            <div><dt>Delay artifact</dt><dd>Pushes one artifact later for a team that is behind.</dd></div>
            <div><dt>Bypass artifact / round</dt><dd>Skips content for a team that has lost time. Use sparingly: a bypassed decision is not scored, which changes what their results mean.</dd></div>
            <div><dt>Inject</dt><dd>Adds an artifact from the catalogue or free text, for a team that needs a nudge or a scenario you want to steer.</dd></div>
            <div><dt>Restart last round</dt><dd>Clears that round's decisions for a team and reopens it. For when a round genuinely went wrong — not for a team that simply did badly.</dd></div>
            <div><dt>Terminate</dt><dd>Ends a team's session and shows them a clear ended screen rather than leaving them on a dead clock.</dd></div>
          </dl>
        </section>

        {/* ── 5 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>5 · Running the debrief</h2>
          <p className="fguide-note">
            Allow 30 minutes. This is where the learning happens — the play is only the material.
          </p>
          <ol className="fguide-ol">
            <li><b>Ask before you show.</b> Before projecting anything, ask two or three CEOs what they framed Round 1 as and why. Get the reasoning on the table while it is still theirs.</li>
            <li><b>Walk the four rounds</b> using the prompts below, one per round.</li>
            <li><b>Then open the results screen</b> and read the trajectory chart, not the final number. The question is which round set the result.</li>
            <li><b>Close on the design point:</b> nothing broke, nobody behaved badly, and the exposure was still real.</li>
          </ol>

          <h4>Discussion prompt, by round</h4>
          <dl className="fguide-dl fguide-dl-wide">
            {ROUNDS.map((r) => (
              <div key={r.n}><dt>Round {r.n}</dt><dd>{r.prompt}</dd></div>
            ))}
          </dl>

          <h4>Reading the results screen with them</h4>
          <dl className="fguide-dl fguide-dl-wide">
            {VARIABLES.map(([name, range, meaning]) => (
              <div key={name}><dt>{name} <span className="fguide-range">{range}</span></dt><dd>{meaning}</dd></div>
            ))}
          </dl>
          <p className="fguide-note">
            Bands are thirds of the range actually achievable in this simulation, not a mark out of
            100. A composite is <b>Trust + Governance + Rigor − Exposure</b>, so it is a signed total
            running roughly <b>−64 to +74</b>: zero is the neutral line, not the floor. A negative
            composite means the exposure the team took on outweighed what it built.
          </p>

          <h4>Framing Commitment — what to say about each pattern</h4>
          <dl className="fguide-dl fguide-dl-wide">
            {PATTERNS.map(([name, note]) => (
              <div key={name}><dt>{name}</dt><dd>{note}</dd></div>
            ))}
          </dl>
          <p className="fguide-note">
            The pattern is descriptive only — it carries no score and does not affect rank. Say so, or
            a team will read it as a grade.
          </p>
        </section>

        {/* ── 6 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>6 · The scoring model</h2>
          <p className="fguide-warn">Faculty only.</p>
          <ul className="fguide-ul">
            <li>Each of the six seats is scored on its own decisions; the team total is the sum. The CEO's four framings are recorded but never scored.</li>
            <li>Each option moves up to four variables by roughly one point each. Totals are summed across all six participants and all four rounds.</li>
            <li>A No Response takes the worst available value on every variable that decision could have moved — lowest for Trust, Governance and Rigor, highest for Ethical Exposure.</li>
            <li>Bands are thirds of the achievable range for that variable, computed from the authored option table rather than a fixed threshold — so editing the scenario moves the bands with it.</li>
            <li>Ethical Exposure is the only variable where a high value is the adverse reading. Everywhere else, higher is better.</li>
            <li>Cohort rank uses the composite, scored identically to each team's own number, so a team's bar and its own figure always agree.</li>
          </ul>
        </section>

        {/* ── 7 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>7 · Framework map</h2>
          <dl className="fguide-dl fguide-dl-wide">
            {FRAMEWORKS.map(([name, where]) => (
              <div key={name}><dt>{name}</dt><dd>{where}</dd></div>
            ))}
          </dl>
        </section>

        {/* ── 8 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>8 · If something goes wrong</h2>
          <dl className="fguide-dl fguide-dl-wide">
            {TROUBLESHOOTING.map(([problem, fix]) => (
              <div key={problem}><dt>{problem}</dt><dd>{fix}</dd></div>
            ))}
          </dl>
        </section>

        {/* ── 9 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>9 · Questions students actually ask</h2>
          <dl className="fguide-dl fguide-dl-wide">
            {QUESTIONS.map(([q, a]) => (
              <div key={q}><dt>{q}</dt><dd>{a}</dd></div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
