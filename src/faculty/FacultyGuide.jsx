import { useRef, useState } from "react";
import "./facultyGuide.css";

/**
 * The Quick Start Guide — the facilitator's operating manual for ANP Phoenix.
 *
 * <p>Content follows the published Quick Start Guide, which is the authority on how a session is
 * actually run. Where an earlier version of this screen differed — it described a 60-minute session
 * with a 30-minute debrief — the document wins: the session is two sittings of 90 minutes.
 *
 * <p>Token-gated, and it says so on the page. The guide itself instructs facilitators not to share
 * it, the Teaching Notes, the video or screenshots with participants before the session, because
 * knowing what is coming changes behaviour.
 *
 * <p>Sim 1 (60 minutes) and Sim 3 (20 minutes) run identical content on different clocks. The class
 * plan below is written for the standard build; the run sheet is parameterised so the express build
 * shows its own timings rather than the wrong ones.
 */

const ROLES = [
  ["CEO", "Owns the round-ending framing, and is the only seat that submits it. This role cannot be shared."],
  ["CFO", "Carries the cost and guidance pressure. Bonus tied to rollout speed, not accuracy."],
  ["CHRO", "Sees the culture signals — whether people feel able to raise a concern."],
  ["Head of Engineering", "Closest to the anomaly, and the least confident about it."],
  ["Head of Operations", "Watches the override queue climb."],
  ["Head of Product", "Holds the client relationships that cite the system by name."],
];

const BUILDS = {
  sim1: {
    label: "Standard — 60 min live",
    path: "caserun.in/sim1",
    total: 60,
    rounds: [
      { n: 1, mins: 17, artifacts: 16, feed: 8, framing: 13 },
      { n: 2, mins: 16, artifacts: 16, feed: 8, framing: 12 },
      { n: 3, mins: 14, artifacts: 14, feed: 7, framing: 11 },
      { n: 4, mins: 13, artifacts: 13, feed: 6, framing: 10 },
    ],
  },
  sim3: {
    label: "Express — 20 min live",
    path: "caserun.in/sim3",
    total: 20,
    rounds: [
      { n: 1, mins: 6, artifacts: 16, feed: 3, framing: 4 },
      { n: 2, mins: 5, artifacts: 16, feed: 2, framing: 3 },
      { n: 3, mins: 5, artifacts: 14, feed: 3, framing: 4 },
      { n: 4, mins: 4, artifacts: 13, feed: 1, framing: 2 },
    ],
  },
};

const QUICK_FACTS = [
  ["Format", "Live, in class, in a browser. One device per participant. Teams discuss throughout."],
  ["Team size", "Six, one per role."],
  ["Class size", "Ten or more. A class of sixty runs as ten teams at the same time."],
  ["Rounds", "Four, in a 60-minute live simulation."],
  ["Total time", "Two sessions of 90 minutes each. Session 1: setup, simulation and a short reflection. Session 2: debrief. Same day with a break, or on different days."],
  ["Results", "Group and individual scores, a cohort ranking and a report for every participant, available as soon as the simulation ends."],
  ["Preparation", "This guide, the Teaching Notes and the video."],
  ["Support", "hello@caserun.in"],
];

const MUST_KNOWS = [
  ["Discussion is the point",
    "This is a computer-based simulation. It is also a leadership team meeting under pressure, as in a real company. Participants must talk, challenge each other and decide together. Encourage them to discuss in their groups throughout."],
  ["Scores, and no single correct answer",
    "Scores show what a team's choices added up to. They are not a verdict on whether the team was right. Reasonable leaders defend different readings of the same evidence. Do not tell participants they were right or wrong — ask for their reasoning."],
  ["Using it as an assessment",
    "The simulation can count towards a grade. Each round is scored against a consistent rubric, so results can be mapped to Course Outcomes and Program Outcomes. Use the scores as one input, alongside the debrief. The report notes that its measures are not certified psychometric instruments, and roles differ in what they decide and see — so compare individuals with care."],
];

const TEAM_SIZING = [
  ["40", "6.7", "7", "Five teams of six, two teams of five"],
  ["45", "7.5 — halfway, so round up", "8", "Five teams of six, three teams of five"],
  ["50", "8.3", "8", "Six teams of six, two teams of seven"],
];

const SESSION_ONE = [
  ["0–15", "Welcome, setup and briefing", "Open the session and share the link. Give the opening briefing. Participants join and take roles."],
  ["15–75", "Live simulation", "60 minutes, four rounds. Teams discuss and decide on their own. Stay out of their discussion and take notes."],
  ["75–85", "Reflection and reports", "One word or line from each participant on how it felt. Check everyone has downloaded their report, and ask them to read it — and its closing questions — before Session 2."],
  ["85–90", "Buffer", "Late starts and overrun."],
];

const SESSION_TWO = [
  ["0–10", "Reactions", "What stood out in the report? One word or one line from each participant."],
  ["10–35", "Team insights", "Each team presents its main insights to the class. Compulsory or voluntary, as you prefer. With many teams, allow about two minutes each."],
  ["35–65", "Analysis", "Walk through the patterns across teams. Add two or three ideas from the Teaching Notes that match what you saw."],
  ["65–80", "Application", "Link the session to participants' own workplaces."],
  ["80–90", "Close", "Each participant writes the one question they will take back to work."],
];

const BRIEFING = [
  "You will act as the leadership team of a regulated fintech, in teams of six, each person in a different role.",
  "Each of you will see different information. That is by design.",
  "Talk to each other throughout. This is a team exercise, not a solo one.",
  "The simulation has four rounds and runs for 60 minutes. There is no single correct answer, and I will not tell you what to decide.",
  "Phones are collected for the session. Do not look for answers outside the simulation.",
];

const RESOURCES = [
  ["People", "A lead facilitator. For a large class, one more person to move among the teams helps."],
  ["Room", "A computer lab. Seat each team side by side, or as near as possible — participants are free to walk and talk. Add a projector or large screen, and a board."],
  ["Phones", "Collect mobile phones at the start and return them at the end of Session 1. This discourages looking for answers online."],
  ["Materials", "A printed copy of this guide and the Teaching Notes, for the facilitator only. Paper or sticky notes."],
  ["Video", "Watch it before the session."],
  ["One week before", "Confirm the date, room and number of participants. Agree the date of Session 2. Ask IT to prepare the lab. Read the Teaching Notes, starting with “Ethics in Practice” and the cases. Tell participants: “We will run a live team simulation on [date, time, room]. Phones will be collected.”"],
  ["The day before, and on the day", "Run the technical test and plan the seating. On the day, arrive 10 minutes early, open the session link and check the room."],
];

const TECHNICAL = [
  ["Devices", "One computer per participant. A computer lab is preferred. No other IT set-up is needed."],
  ["Network", "Ask the IT team to block general internet access in the lab and to allow only caserun.in. No other website is needed, and the network must support the whole class at once. The day before, open the session link on two or three lab computers and confirm that other websites do not open."],
  ["Joining and reports", "The simulation begins when everyone is ready, so ask participants to join early. After it ends, everyone downloads their report — keep the lab network and computers on until they have."],
  ["Support", "The platform handles timing, information delivery and analytics automatically, so technical support is not normally needed. For any question, write to hello@caserun.in. If a computer fails, move the participant to a spare. Do not stop other teams."],
];

const SITUATIONS = [
  ["A team goes quiet or seems stuck, or one person dominates",
    "Let it play. Do not hint or intervene. Remind the team to talk to each other if needed. Note what you see for the debrief."],
  ["Someone asks why they see different information, or asks to see another role's or team's",
    "Each person sees only their own role's information, by design."],
  ["Someone asks what to decide, or about their score",
    "Say that it is their call and that there is no single right answer. Results come at the end, in the report."],
];

const DEBRIEF_PRINCIPLES = [
  ["Keep the tone curious, not judgmental",
    "Ask what was reasonable about that at the time. Participants decided without knowing what would follow, so remember hindsight."],
  ["Treat the score and the ranking as a starting point, not a verdict",
    "Ask what the numbers do not show. If a team left decisions unanswered, ask what that silence decided."],
  ["Invite disagreement",
    "If everyone agrees quickly, ask what a thoughtful critic would say. End with a question."],
];

const DEBRIEF_QUESTIONS = [
  "What did your team owe to the people outside the room, and when did you first ask that question?",
  "Where did the team disagree?",
  "Was any concern felt but not voiced?",
  "Who had the authority, and who had the duty, to say that the AI could not yet be trusted?",
  "Whose interests did you protect?",
  "What would you do differently?",
];

const ROUND_TITLES = {
  1: "Weak Signal, Strong Incentives",
  2: "When Ambiguity Becomes Discussable",
  3: "When Alignment Meets Exposure",
  4: "Institutional Memory",
};

const ROUND_WATCH = {
  1: "Who speaks first — in most teams that person's framing becomes the team's framing. Whether Engineering's doubt reaches the CEO, or stays inside Engineering.",
  2: "The Leadership Alignment Meeting: everyone sees it, only the CEO answers it. Does the team discuss, or does the CEO just click?",
  3: "Is the framing changing because the evidence changed, or because someone outside started watching? This is the central question of the whole simulation.",
  4: "Whether the whistle-channel inquiry is treated as a data point or as a threat. That is the clearest read on the culture the team built.",
};

export default function FacultyGuide() {
  const [build, setBuild] = useState("sim1");
  const sheetRef = useRef(null);
  const cfg = BUILDS[build];

  /**
   * Print to a separate document carrying only this guide's rules.
   *
   * The console's own print stylesheet hides every body child that is not a report scrim, so
   * printing the live page produces blank paper. Rather than add another exception to that rule —
   * the pattern that caused the blank-PDF bug — the guide is written into its own document where
   * no other stylesheet can reach it.
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

    const title = "ANP_Phoenix_Quick_Start_Guide";
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${styles}` +
        `<style>html,body{background:#fff!important;margin:0!important;padding:0!important}` +
        `.fguide{color:#111!important;background:#fff!important;max-width:none!important;padding:0!important}` +
        `.fguide .fguide-noprint{display:none!important}` +
        `@page{margin:14mm}</style></head><body>${sheet.outerHTML}</body></html>`
    );
    win.document.close();
    const fire = () => { win.focus(); win.print(); };
    if (win.document.readyState === "complete") setTimeout(fire, 120);
    else win.addEventListener("load", () => setTimeout(fire, 120));
  };

  const rounds = cfg.rounds.map((r) => ({ ...r, title: ROUND_TITLES[r.n], watch: ROUND_WATCH[r.n] }));

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
          <div className="fguide-eyebrow">Quick Start Guide · for facilitators</div>
          <h1>ANP Phoenix</h1>
          <p className="fguide-lede">
            <em>When Can You Trust What Your AI Just Told You?</em> Six executives of a regulated
            fintech face two hard questions. What do they owe to the people who rely on them? Who has
            the authority to say that an AI's output cannot yet be trusted? They must decide before a
            failure becomes visible.
          </p>
          <p className="fguide-warn">
            Confidential. Do not share this guide, the Teaching Notes, the video, screenshots or
            recordings with participants before the session — knowing what is coming changes
            behaviour.
          </p>
        </div>

        {/* ── storyline ─────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>The storyline</h2>
          <p className="fguide-beat">
            A regulated fintech has staked its reputation on a generative AI system used in fraud
            detection and client reporting. Its outputs start drifting in ways no one can fully
            explain. Six executives, each with different information and incentives, must decide what
            deserves attention — and who has the authority to say that an AI output cannot yet be
            trusted, before failure becomes visible.
          </p>
          <p className="fguide-beat">
            <b>The ethical questions are the heart of the session.</b> What does the company owe to
            customers and regulators? Who is accountable? Are concerns spoken, or left unsaid? The AI
            is the setting that makes these questions hard.
          </p>

          <h4>Teaching objectives</h4>
          <p className="fguide-note" style={{ marginTop: 0 }}>Participants practise how to:</p>
          <ul className="fguide-ul">
            <li>recognise the ethical side of a decision that looks operational, when no rule has been broken and nothing has visibly failed;</li>
            <li>weigh what the company owes to customers, regulators and employees against commercial pressure and personal incentives;</li>
            <li>judge how far to trust an AI's output, and who has the authority and the duty to say that it cannot yet be trusted;</li>
            <li>see how accountability is shared or spread across a team, and how early decisions shape what is possible later.</li>
          </ul>

          <h4>Quick facts</h4>
          <dl className="fguide-dl fguide-dl-wide">
            {QUICK_FACTS.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>

        {/* ── 1 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>1 · Simulation must-knows</h2>
          <dl className="fguide-dl fguide-dl-wide">
            {MUST_KNOWS.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>

        {/* ── 2 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>2 · Forming teams</h2>
          <p className="fguide-note" style={{ marginTop: 0 }}>
            Aim for teams of six, one participant for each of the six roles.
          </p>
          <ol className="fguide-ol">
            <li>Divide the number of participants by six.</li>
            <li>Round to the nearest whole number. This is the number of teams. If the answer ends in exactly one half, round up.</li>
            <li>Share the participants equally across the teams.</li>
          </ol>

          <div className="fguide-tablewrap">
            <table className="fguide-table">
              <thead>
                <tr><th>Participants</th><th>Divided by six</th><th>Teams</th><th>Team sizes</th></tr>
              </thead>
              <tbody>
                {TEAM_SIZING.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => <td key={i}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="fguide-note">
            <b>A team of five:</b> one participant plays both Head of Engineering and Head of
            Operations. <b>A team of seven:</b> two participants share one role. <b>The CEO role
            cannot be shared.</b> Each participant sees private information that only their role
            receives.
          </p>

          <h4>The six seats</h4>
          <dl className="fguide-dl">
            {ROLES.map(([r, d]) => (
              <div key={r}><dt>{r}</dt><dd>{d}</dd></div>
            ))}
          </dl>
        </section>

        {/* ── 3 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>3 · Your role, and the console</h2>
          <dl className="fguide-dl fguide-dl-wide">
            <div><dt>Dashboard</dt><dd>Shows results across all teams in a single view.</dd></div>
            <div><dt>At the end</dt><dd>The platform calculates group and individual scores and the cohort ranking.</dd></div>
            <div><dt>Optional controls</dt><dd>Pause and resume the whole class. Introduce an artefact during play. Restart. End any team's round. <b>You do not need any of these to run a successful session.</b></dd></div>
            <div><dt>Your role</dt><dd>Set up the room, keep to the schedule and lead the debrief. Step in only for logistics, not to steer decisions. During play, note how teams talk and where they disagree.</dd></div>
          </dl>
        </section>

        {/* ── 4 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>4 · Sample class plan</h2>
          <p className="fguide-note" style={{ marginTop: 0 }}>
            Two sessions of 90 minutes. Session 2 can follow after a break on the same day, or take
            place on another day.
          </p>

          <h4>Session 1 — simulation (90 minutes)</h4>
          <div className="fguide-tablewrap">
            <table className="fguide-table">
              <thead><tr><th>Minutes</th><th>Activity</th><th>What happens</th></tr></thead>
              <tbody>
                {SESSION_ONE.map((row) => (
                  <tr key={row[0]}>
                    <td className="fguide-mins">{row[0]}</td><td><b>{row[1]}</b></td><td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4>Session 2 — debrief (90 minutes)</h4>
          <div className="fguide-tablewrap">
            <table className="fguide-table">
              <thead><tr><th>Minutes</th><th>Activity</th><th>What happens</th></tr></thead>
              <tbody>
                {SESSION_TWO.map((row) => (
                  <tr key={row[0]}>
                    <td className="fguide-mins">{row[0]}</td><td><b>{row[1]}</b></td><td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4>Opening briefing for Session 1 (about five minutes)</h4>
          <p className="fguide-note" style={{ marginTop: 0 }}>Say, in your own words:</p>
          <ul className="fguide-ul fguide-script">
            {BRIEFING.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
          <p className="fguide-note">
            Then share the link. Do not explain the scenario or the platform further — the platform
            does that on screen.
          </p>
        </section>

        {/* ── 5 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>5 · Resource requirements</h2>
          <dl className="fguide-dl fguide-dl-wide">
            {RESOURCES.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  {v}
                  {k === "Video" && (
                    <> <a href="https://www.youtube.com/watch?v=k3IqrQ7j-Ms" target="_blank" rel="noreferrer">youtube.com/watch?v=k3IqrQ7j-Ms</a></>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── 6 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>6 · Technical requirements</h2>
          <dl className="fguide-dl fguide-dl-wide">
            {TECHNICAL.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <p className="fguide-note">
            Students enter the <b>batch code</b> you create in the Batches tab, then form teams.
            Session link: <b>{cfg.path}</b>
          </p>
        </section>

        {/* ── 7 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>7 · Questions and situations you may meet</h2>
          <dl className="fguide-dl fguide-dl-wide">
            {SITUATIONS.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>

        {/* ── 8 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>8 · Leading the debrief</h2>
          <p className="fguide-beat">
            Ethics learning begins during the simulation and deepens in the debrief. Start from what
            the teams did. Then ask what they owed, to whom, and who was accountable. Pick two or
            three ideas from the Teaching Notes that fit what you saw, and introduce each briefly
            before asking a question.
          </p>
          <dl className="fguide-dl fguide-dl-wide">
            {DEBRIEF_PRINCIPLES.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <h4>Questions you can use</h4>
          <ul className="fguide-ul">
            {DEBRIEF_QUESTIONS.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </section>

        {/* ── 9 ─────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>9 · Run sheet — what lands when</h2>
          <p className="fguide-note" style={{ marginTop: 0 }}>
            Read off the seeded content for the <b>{cfg.label.toLowerCase()}</b> build. Offsets are
            measured from the start of that round, not the session — each round has its own T+0. You
            do not need this to run a session; it is here for when a team asks why something arrived
            when it did.
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
              <p className="fguide-beat">{r.watch}</p>
            </div>
          ))}
        </section>

        {/* ── 10 ────────────────────────────────────────────────────────── */}
        <section className="fguide-sec">
          <h2>10 · How the scoring works</h2>
          <p className="fguide-warn">Facilitator only — participants should not see this before playing.</p>
          <ul className="fguide-ul">
            <li>Each of the six seats is scored on its own decisions; the team total is the sum. The CEO's four framings are recorded as a pattern but never scored.</li>
            <li>A decision left unanswered is recorded as <b>No Response</b> and takes the worst outcome that decision offered. Not answering is still a position — it simply has no owner.</li>
            <li>Bands are thirds of the range actually achievable in this simulation, not a mark out of 100.</li>
            <li><b>Ethical Exposure is the only variable where a high value is the adverse reading.</b> Everywhere else, higher is better.</li>
            <li>The anomaly never worsens. Across all four rounds no new evidence of harm arrives — what changes is who is asking. If a team's framing moved, it is worth asking what moved it.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
