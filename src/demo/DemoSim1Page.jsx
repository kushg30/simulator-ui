import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArtifactDetail from "../simulation/ArtifactDetail";
import ArtifactList from "../simulation/ArtifactList";
import ScreenFlashOverlay from "../simulation/ScreenFlashOverlay";
import "../simulator.css";
import "../simulation/simulatorPolish.css";
import "./DemoPage.css";

// A self-contained, front-end-only sample of one Leadership Judgment round. It reuses the real round
// UI (list, artifact viewer, screen-flash overlay) but the scenario is a throwaway ("Vantage Labs"),
// the clock is accelerated to ~a minute, and every decision is graded locally — no backend, no real
// case content, so it is safe for any visitor while looking exactly like the real thing.

const TYPE_LABELS = {
  MEMO: "Memo",
  EXCERPT: "Slack Thread",
  OPS_DASHBOARD: "Ops Dashboard",
  MEETING_INVITE: "Meeting Invite",
  DIAGNOSTIC_NOTE: "Diagnostic Note",
};

const TABS = [
  { id: "inbox", icon: "📥", label: "Inbox" },
  { id: "excerpts", icon: "📊", label: "Excerpts" },
  { id: "meetings", icon: "📅", label: "Meetings" },
  { id: "decisions", icon: "⚖️", label: "Decisions" },
];

// Each decision option carries a hidden "lean": +1 legitimizes the signal, −1 normalizes it.
const SCENARIO = [
  {
    id: "memo", artifactType: "MEMO", tab: "inbox", revealAt: 0, actionState: "READ_ONLY",
    payload: {
      from: "Priya Nair, Chief Risk Officer",
      title: "Preliminary Risk Note — for awareness",
      body: "Routine monitoring has surfaced a small number of cases where Lumen — our GenAI system embedded in fraud screening and client reporting — produced anomaly classifications and explanations that can't be fully traced back to the underlying data. The pattern is statistically minor, has caused no customer impact, and breaches no policy threshold. Engineering reads it as edge-case model behaviour; Operations notes similar model-confidence flags have resolved on their own before. Teams don't even share a definition of when an \"AI inaccuracy\" becomes a \"hallucination.\" No one is asking for a model rollback — only for a view on whether this deserves the leadership team's attention. Two enterprise onboardings that cite Lumen by name are in their final week, and a routine AI-governance review is six weeks out.",
      inner_voice: "Nothing here forces a decision. That's exactly what makes it one.",
    },
  },
  {
    id: "slack", artifactType: "EXCERPT", tab: "excerpts", revealAt: 8, actionState: "OPEN",
    decisionId: "d-slack",
    decisionOptions: [
      { id: "flag", label: "Flag for deeper model investigation", lean: 1 },
      { id: "monitor", label: "Tag as known issue (monitor)", lean: -1 },
      { id: "untagged", label: "Leave untagged", lean: -1 },
    ],
    payload: {
      channel: "#lumen-integrity", department: "ML Engineering",
      messages: [
        { author: "Sam Okafor", time: "09:14", text: "Lumen's confidence scores aren't matching its explanations. Still small, but I can't explain it cleanly." },
        { author: "Lena Fischer", time: "09:16", text: "If we dig into why the model is doing this, we might not like what we find — and we're a week from launch." },
      ],
      inner_voice: "Push for a deeper look and I risk being the alarmist who says the model shipped too fast, with no proof.",
    },
  },
  {
    id: "ops", artifactType: "OPS_DASHBOARD", tab: "inbox", revealAt: 20, actionState: "OPEN",
    decisionId: "d-ops",
    decisionOptions: [
      { id: "pause", label: "Pause and review before continuing", lean: 1 },
      { id: "continue", label: "Continue the rollout", lean: -1 },
    ],
    payload: {
      from: "Operations", title: "Lumen — rollout status",
      dashboard: { rollout: "GREEN", manual_checks: "AMBER", red_indicators: false },
      body: "Lumen uptime is green. The manual override queue is amber — up slightly this week. No client-facing incidents logged.",
      inner_voice: "Pausing a Lumen-dependent workflow mid-rollout creates operational debt someone will remember.",
    },
  },
  {
    id: "reporter", artifactType: "SCREEN_FLASH", isFlash: true, revealAt: 32,
    actionState: "OPEN", decisionId: "d-reporter",
    decisionOptions: [
      { id: "acknowledge", label: "Acknowledge — say we're looking into it", lean: 1 },
      { id: "reassure", label: "Reassure — nothing material", lean: -1 },
      { id: "nocomment", label: "No comment for now", lean: 0 },
    ],
    payload: {
      title: "A reporter just emailed",
      body: "A technology reporter has asked your comms lead whether Vantage is “aware of reliability issues” in its Lumen AI product, and wants a response by end of day.",
    },
  },
  {
    id: "meeting", artifactType: "MEETING_INVITE", tab: "meetings", revealAt: 44, actionState: "OPEN",
    decisionId: "d-meeting",
    decisionOptions: [
      { id: "review", label: "Attend the Lumen anomaly review", lean: 1 },
      { id: "client", label: "Attend the client go-live call", lean: -1 },
    ],
    payload: {
      title: "Two meetings just collided",
      meeting_a: "Lumen anomaly review — Risk & ML Engineering",
      meeting_b: "Enterprise client — Lumen go-live call",
    },
  },
  {
    id: "final", artifactType: "SCREEN_FLASH", isFlash: true, isFinal: true, revealAt: 58,
    actionState: "OPEN", decisionId: "d-final",
    decisionOptions: [
      { id: "governance", label: "A governance risk — escalate and review now", lean: 1 },
      { id: "bounded", label: "Bounded uncertainty — monitor closely", lean: 0 },
      { id: "noise", label: "Operational noise — proceed as planned", lean: -1 },
    ],
    payload: {
      is_final_round_decision: true,
      title: "The room turns to you",
      body: "Discussion has run its course. As CEO, how do you frame Lumen's behaviour for the organisation — the one signal everyone takes their cue from?",
    },
  },
];

// The conditional artifact: only appears if you flag the anomaly for investigation.
const DIAGNOSTIC = {
  id: "diag", artifactType: "DIAGNOSTIC_NOTE", tab: "inbox", actionState: "READ_ONLY",
  payload: {
    from: "Internal Systems", title: "Diagnostic summary — extended logging", conditional: true,
    body: "Deeper logging is enabled. Early results suggest Lumen's anomalies cluster around a specific class of edge-case transactions where its explanation doesn't match its own classification. No evidence of systemic model failure yet, but the pattern is real and worth understanding before launch.",
    inner_voice: "The more we look at the model, the more real it becomes.",
  },
};

const LOCKED = [
  { name: "Early Signal Legitimization", why: "Whether the team treated a weak, ambiguous signal as worth attention." },
  { name: "Silence Accumulation", why: "How often inaction quietly replaced judgment under ambiguity." },
  { name: "Framing Commitment", why: "How early the leadership narrative hardened around one interpretation." },
  { name: "Authority Centralization", why: "How far judgment collapsed upward onto the CEO." },
  { name: "Option Space Contraction", why: "How many future response paths were quietly closed off." },
];

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function DemoSim1Page() {
  const navigate = useNavigate();
  const [step, setStep] = useState("intro"); // intro | play | done
  const [elapsed, setElapsed] = useState(0);
  const [arts, setArts] = useState([]); // revealed non-flash artifacts (runtime)
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedId, setSelectedId] = useState(null);
  const [activeFlash, setActiveFlash] = useState(null);
  const [leanSum, setLeanSum] = useState(0);
  const [decided, setDecided] = useState(0);
  const shown = useRef(new Set());

  // accelerated clock: reveal artifacts as their (seconds) open time passes
  useEffect(() => {
    if (step !== "play") return undefined;
    const start = Date.now();
    const id = setInterval(() => {
      const e = Math.floor((Date.now() - start) / 1000);
      setElapsed(e);
      SCENARIO.forEach((s) => {
        if (s.revealAt != null && s.revealAt <= e && !shown.current.has(s.id)) {
          shown.current.add(s.id);
          if (s.isFlash) setActiveFlash({ ...s, status: "UNREAD" });
          else setArts((prev) => [...prev, { ...s, status: "UNREAD" }]);
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // keep a sensible selection in the current tab
  useEffect(() => {
    if (step !== "play") return;
    const inTab = arts.filter((a) => a.tab === activeTab);
    if (inTab.length === 0) { setSelectedId(null); return; }
    if (!inTab.some((a) => a.id === selectedId)) setSelectedId(inTab[0].id);
  }, [arts, activeTab, step, selectedId]);

  const optionOf = (artId, action) => {
    const sc = [...SCENARIO, DIAGNOSTIC].find((s) => s.id === artId);
    return (sc?.decisionOptions || []).find((o) => o.id === action);
  };

  const markActed = (artId, opt) =>
    setArts((prev) => prev.map((a) =>
      a.id === artId ? { ...a, actionState: "ACTED", chosenAction: opt?.label, status: "ACTED" } : a));

  const onAction = (artifact, action) => {
    const opt = optionOf(artifact.id, action);
    markActed(artifact.id, opt);
    setLeanSum((v) => v + (opt?.lean || 0));
    setDecided((c) => c + 1);
    if (artifact.id === "slack" && action === "flag" && !shown.current.has("diag")) {
      shown.current.add("diag");
      setArts((prev) => [...prev, { ...DIAGNOSTIC, status: "UNREAD" }]);
    }
  };

  const onFlashDecide = (action) => {
    const f = activeFlash;
    const opt = optionOf(f.id, action);
    setLeanSum((v) => v + (opt?.lean || 0));
    setDecided((c) => c + 1);
    setActiveFlash((prev) => ({ ...prev, actionState: "ACTED", chosenAction: opt?.label }));
    setTimeout(() => {
      setActiveFlash(null);
      if (f.isFinal) setStep("done");
    }, 1300);
  };

  // ── intro ────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="demo">
        <div className="demo-shell">
          <div className="demo-top">
            <span className="demo-brand">CaseRun</span>
            <span className="demo-tag">Sample round · no sign-in</span>
          </div>
          <div className="demo-card demo-intro">
            <div className="demo-eyebrow">Leadership Judgment Simulation · a 1-minute taste</div>
            <h1>When can you trust what your AI just told you?</h1>
            <p>
              In the full simulation, six executives read the same ambiguous signal about a production
              GenAI system and, over 30 minutes, decide together what to escalate, what to frame, and what
              to let pass. Here's <b>one round</b>, on a sample company, sped up so you can feel how it plays.
            </p>
            <p className="demo-role">
              You are the <b>CEO</b> of <b>Vantage Labs</b>. Your GenAI system, <b>Lumen</b>, has started
              producing outputs no one can fully explain — days before a major client launch. Artifacts will
              arrive on their own — read them, and make the calls.
            </p>
            <button
              className="demo-btn"
              onClick={() => {
                shown.current = new Set(["memo"]);
                setArts([{ ...SCENARIO[0], status: "UNREAD" }]);
                setSelectedId("memo");
                setStep("play");
              }}
            >
              Enter the room →
            </button>
            <p className="demo-fineprint">Sample scenario. Not one of the real simulation rounds.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── done / reveal ──────────────────────────────────────────────────────────
  if (step === "done") {
    const read = leanSum >= 2
      ? { verdict: "You legitimized the weak signal", note: "You treated an ambiguous signal as worth attention and kept your options open — the harder, and often rarer, leadership move." }
      : leanSum <= -2
      ? { verdict: "You leaned toward containment", note: "The signal was quietly normalized and the option space narrowed — the path of least resistance under launch pressure." }
      : { verdict: "A mixed read", note: "You neither fully surfaced nor fully dismissed the signal — exactly the ambiguity the simulation is built to expose." };
    return (
      <div className="demo">
        <div className="demo-shell">
          <div className="demo-top">
            <span className="demo-brand">CaseRun</span>
            <span className="demo-tag">Sample round · complete</span>
          </div>
          <div className="demo-card demo-result">
            <div className="demo-eyebrow">Your round</div>
            <div className="demo-outcome">
              <div className="demo-score" style={{ fontSize: 34, lineHeight: 1.1 }}>{read.verdict}</div>
            </div>
            <div className="demo-provisional">
              <div className="demo-prov-note" style={{ fontSize: 14 }}>{read.note}</div>
              <div className="demo-prov-note" style={{ marginTop: 10, color: "#8b93a8" }}>
                You made {decided} of 5 calls. In the real simulation there are no visible scores — your
                facilitator reveals how the room did, qualitatively, in the debrief.
              </div>
            </div>
          </div>

          <div className="demo-card demo-locked-card">
            <div className="demo-eyebrow">What the full simulation measures</div>
            <p className="demo-lede">
              Every decision — and every silence — feeds five leadership constructs, revealed Low / Medium /
              High, never as a score:
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
              <button className="demo-btn ghost" onClick={() => navigate("/")}>Book a workshop</button>
            </div>
          </div>

          <button className="demo-restart" onClick={() => { shown.current = new Set(); setArts([]); setSelectedId(null); setActiveFlash(null); setLeanSum(0); setDecided(0); setElapsed(0); setActiveTab("inbox"); setStep("intro"); }}>
            ↻ Play the sample round again
          </button>
        </div>
      </div>
    );
  }

  // ── play (the real round shell) ────────────────────────────────────────────
  const visible = arts.filter((a) => a.tab === activeTab);
  const selected = arts.find((a) => a.id === selectedId) || null;
  const tabCounts = TABS.reduce((acc, t) => {
    acc[t.id] = arts.filter((a) => a.tab === t.id && a.status === "UNREAD").length;
    return acc;
  }, {});
  const timerClass = elapsed > 52 ? "warn" : "";

  const handleSelect = (artifact) => {
    setArts((prev) => prev.map((a) => (a.id === artifact.id && a.status === "UNREAD" ? { ...a, status: "READ" } : a)));
    setSelectedId(artifact.id);
  };

  const flashOpts = activeFlash?.decisionOptions;

  return (
    <div className="round-screen">
      {activeFlash && (
        <ScreenFlashOverlay
          artifact={{ ...activeFlash, artifactId: activeFlash.id }}
          payload={activeFlash.payload}
          options={flashOpts}
          onDecide={onFlashDecide}
          onDismiss={() => setActiveFlash(null)}
          loading={false}
        />
      )}

      <div className="top-bar">
        <div className="top-left role-label">Role:&nbsp;<span className="role-value">CEO</span></div>
        <div className="top-center">
          <div className="app-title">Leadership Simulator</div>
          <div className="phase-label">Round 1 · Interpretation Phase · Sample scenario</div>
        </div>
        <div className="top-right time-block">
          <span className="time-label">Round Time</span>
          <div className={`time-value ${timerClass}`}>{fmt(elapsed)}</div>
        </div>
      </div>

      <div className="main">
        <div className="primary-nav">
          {TABS.map((tab) => (
            <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {tabCounts[tab.id] > 0 && <span className="nav-badge">{tabCounts[tab.id]}</span>}
            </button>
          ))}
        </div>

        <div className="secondary-list">
          <div className="list-header"><div className="list-header-label">{activeTab}</div></div>
          {visible.length === 0 ? (
            <div className="list-empty">Waiting for the next signal…</div>
          ) : (
            <ArtifactList
              artifacts={visible.map((a) => ({ ...a, artifactId: a.id }))}
              selectedId={selectedId}
              onSelect={(a) => handleSelect(a)}
              typeLabels={TYPE_LABELS}
            />
          )}
        </div>

        <div className="content-canvas">
          <div className="viewer">
            <ArtifactDetail
              artifact={selected ? { ...selected, artifactId: selected.id } : null}
              onAction={onAction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
