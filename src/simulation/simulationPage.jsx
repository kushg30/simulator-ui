import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useArtifacts, parseServerTime } from "./useartifacts";
import ArtifactDetail from "./ArtifactDetail";
import ArtifactList from "./ArtifactList";
import ScreenFlashOverlay from "./ScreenFlashOverlay";
import "../simulator.css";
import "./simulatorPolish.css";
import API_BASE from "../config";

// ─────────────────────────────────────────────────────────────
// Timer
// ─────────────────────────────────────────────────────────────
function useSimulationTime(startedAt) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      const elapsed = Math.floor(
        (Date.now() - parseServerTime(startedAt)) / 1000
      );
      setSeconds(elapsed);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return seconds;
}

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Server-authoritative countdown: seed from the round-state's remainingSeconds (same for every client)
// and tick locally between polls. Frozen while the facilitator has the round paused. This is what makes
// the timer — and the 5-min / 1-min alerts — agree across all six participants instead of each browser
// deriving its own value from its own clock.
function useServerCountdown(serverRemaining, paused) {
  const [display, setDisplay] = useState(
    serverRemaining == null ? null : serverRemaining
  );
  const baseRef = useRef({ s: serverRemaining, at: Date.now() });
  useEffect(() => {
    if (serverRemaining == null) return;
    baseRef.current = { s: serverRemaining, at: Date.now() };
    setDisplay(serverRemaining);
  }, [serverRemaining]);
  useEffect(() => {
    if (paused || serverRemaining == null) return;
    const id = setInterval(() => {
      const { s, at } = baseRef.current;
      const elapsed = Math.floor((Date.now() - at) / 1000);
      setDisplay(Math.max(0, s - elapsed));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, serverRemaining]);
  return display;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  INTERNAL_NOTE:   "Internal Note",
  MEMO:            "Memo",
  MESSAGE_TEXT:    "Message",
  EXCERPT:         "Slack Thread",
  OPS_DASHBOARD:   "Ops Dashboard",
  PEOPLE_SIGNAL:   "People Signals",
  INVESTOR_DRAFT:  "Investor Draft",
  TAGGING_CHECK:   "Tagging Check",
  DIAGNOSTIC_NOTE: "Diagnostic Note",
  MEETING_INVITE:  "Meeting Invite",
  SCREEN_FLASH:    "Alert",
};

const TABS = [
  { id: "inbox",     icon: "📥", label: "Inbox"     },
  { id: "excerpts",  icon: "📊", label: "Excerpts"  },
  { id: "meetings",  icon: "📅", label: "Meetings"  },
  { id: "decisions", icon: "⚖️", label: "Decisions" },
];

// Canonical role display strings — never truncate "Head of Operations"/"Head of Product".
const ROLE_DISPLAY = {
  CEO: "CEO",
  CFO: "CFO",
  CHRO: "CHRO",
  HEAD_OF_ENGINEERING: "Head of Engineering",
  OPERATIONS: "Head of Operations",
  PRODUCT: "Head of Product",
};

// Post-round interstitial content (script 1.10 + Section 8): each round's title and one open
// discussion prompt tagged to it. Shown after that round's final decision, before the next unlocks.
const ROUND_META = {
  1: {
    title: "Weak Signal, Strong Incentives",
    prompt:
      "Compare CEO framings across teams. What made “operational noise” feel defensible to some teams and not others, given the same GenAI risk information?",
  },
  2: {
    title: "When Ambiguity Becomes Discussable",
    prompt:
      "Did the team converge on a framing because the evidence supported it, or because disagreement felt costly? Who spoke first, and did that shape the outcome?",
  },
  3: {
    title: "When Alignment Meets Exposure",
    prompt:
      "Whose interests were you protecting on the board agenda — the board’s, the regulator’s, or your own credibility? Name the trade-off explicitly.",
  },
  4: {
    title: "Institutional Memory",
    prompt:
      "Was the whistle-channel inquiry treated as a data point or a threat? What does that reveal about the AI culture your team built over three prior rounds?",
  },
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function SimulationPage() {
  // Read the live session from the URL instead of hardcoded ids, so each
  // participant fetches their own artifacts for the real run.
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const runId         = params.get("runId");
  const participantId = params.get("participantId");
  const role          = params.get("role");

  const { artifacts, loading, error, refetch } = useArtifacts(runId, participantId);

  const [activeTab,        setActiveTab]        = useState("inbox");
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [artifactsState,   setArtifactsState]   = useState([]);
  const [activeFlash,      setActiveFlash]      = useState(null);
  const [flashLoading,     setFlashLoading]     = useState(false);
  const [dismissed,        setDismissed]        = useState(new Set());
  const [timeFlash,        setTimeFlash]        = useState(null);   // "5 minutes remaining" toast
  const firedThresholds = useRef(new Set());

  // ── round state: number, per-round start time, total, completion ──────────
  const [round,        setRound]        = useState(null); // { roundNumber, startedAt, totalRounds }
  const [pausedSeconds, setPausedSeconds] = useState(0);  // faculty pause + News slide (1.2)
  const [news,         setNews]         = useState(null); // active News interrupt (1.2)
  const [interstitial, setInterstitial] = useState(null); // post-round debrief screen (1.10)

  useEffect(() => {
    if (!runId) return;
    let prev = null;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/runs/${runId}/round-state`);
        if (!res.ok) return;
        const s = await res.json();
        if (s.completed) {
          // If the last round was still on screen, show its interstitial before the reveal.
          navigate(`/results?runId=${runId}`);
          return;
        }
        setRound(s);
        setPausedSeconds(s.pausedSeconds || 0);
        setNews(s.news || null);
        // Round advanced: hard-reset all per-round UI state so nothing from the previous round
        // leaks across (stale artifacts, a dismissed-flash set, a fired-threshold, an old "framing
        // submitted" banner), and pull the new round's artifacts immediately instead of waiting for
        // the next poll — this is what removes the need to refresh the tab by hand.
        if (prev !== null && s.roundNumber > prev) {
          setArtifactsState([]);
          setSelectedArtifact(null);
          setActiveFlash(null);
          setDismissed(new Set());
          firedThresholds.current = new Set();
          setTimeFlash(null);
          refetch();
          const completed = prev;
          // Only raise the debrief if the CEO has NOT already released it (handles a client that
          // polled the advance late). The CEO advances the team; others wait for that release.
          if (!s.prevInterstitialAcked) {
            try {
              const sumRes = await fetch(
                `${API_BASE}/api/runs/${runId}/rounds/${completed}/summary`
              );
              const summary = sumRes.ok ? await sumRes.json() : {};
              setInterstitial({
                roundNumber: completed,
                nextRound: s.roundNumber,
                title: ROUND_META[completed]?.title,
                prompt: ROUND_META[completed]?.prompt,
                framing: summary.framing,
                submitted: summary.submitted !== false,
              });
            } catch {
              setInterstitial({
                roundNumber: completed,
                nextRound: s.roundNumber,
                title: ROUND_META[completed]?.title,
                prompt: ROUND_META[completed]?.prompt,
                submitted: true,
              });
            }
          }
        }
        // Once the CEO releases the debrief, every other client leaves it and drops into the round.
        if (s.prevInterstitialAcked) {
          setInterstitial(cur => (cur && cur.nextRound === s.roundNumber ? null : cur));
        }
        prev = s.roundNumber;
      } catch {
        /* transient */
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [runId, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Meaningful browser-tab title instead of "React App".
  useEffect(() => {
    document.title = round?.roundNumber
      ? `Round ${round.roundNumber} · ANP Phoenix — CaseRun`
      : "ANP Phoenix — CaseRun";
  }, [round?.roundNumber]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 3000);
    return () => clearInterval(id);
  }, [refetch]);

  useEffect(() => {
    if (!artifacts) return;
    setArtifactsState(prev =>
      artifacts.map(a => {
        const ex = prev.find(p => p.artifactId === a.artifactId);
        return {
          ...a,
          status: a.actionState === "ACTED" ? "ACTED" : ex?.status || "UNREAD",
        };
      })
    );
  }, [artifacts]);

  useEffect(() => {
    if (!selectedArtifact) return;
    const updated = artifactsState.find(
      a => a.artifactId === selectedArtifact.artifactId
    );
    if (updated) setSelectedArtifact(updated);
  }, [artifactsState]); // eslint-disable-line

  useEffect(() => {
    if (activeFlash) return;
    const flash = artifactsState.find(
      a =>
        a.artifactType === "SCREEN_FLASH" &&
        !a.decisionId && // the CEO's round-ending decision is NOT auto-popped — it's opened from the
                         // info bar button, so it never covers the screen (or the countdown alerts)
        (a.actionState === "OPEN" || a.actionState === "READ_ONLY") &&
        !dismissed.has(a.artifactId)
    );
    if (flash) setActiveFlash(flash);
  }, [artifactsState, activeFlash, dismissed]);

  const safeParse = d => {
    try { return typeof d === "string" ? JSON.parse(d) : d; }
    catch { return {}; }
  };

  const getTab = a => safeParse(a.payload)?.tab || "inbox";

  // The Decisions tab is this participant's decision history: every artifact addressed to them that
  // carries a decision, so they can see what they answered (or still owe) in one place. Other tabs
  // list their own artifacts as authored (by payload tab).
  const visibleArtifacts =
    activeTab === "decisions"
      ? artifactsState.filter(a => a.decisionId && a.artifactType !== "SCREEN_FLASH")
      : artifactsState.filter(
          a => getTab(a) === activeTab && a.artifactType !== "SCREEN_FLASH"
        );

  const handleSelect = artifact => {
    setArtifactsState(prev =>
      prev.map(a =>
        a.artifactId === artifact.artifactId
          ? { ...a, status: a.status === "UNREAD" ? "READ" : a.status }
          : a
      )
    );
    setSelectedArtifact({
      ...artifact,
      status: artifact.status === "UNREAD" ? "READ" : artifact.status,
    });
  };

  const updateStatus = (id, status) => {
    setArtifactsState(prev =>
      prev.map(a => a.artifactId === id ? { ...a, status } : a)
    );
  };

  useEffect(() => {
    if (visibleArtifacts.length > 0) {
      const still = visibleArtifacts.some(
        a => a.artifactId === selectedArtifact?.artifactId
      );
      if (!still) setSelectedArtifact(visibleArtifacts[0]);
    } else {
      setSelectedArtifact(null);
    }
  }, [activeTab, artifactsState]); // eslint-disable-line

  const tabCounts = TABS.reduce((acc, tab) => {
    if (tab.id === "decisions") {
      // Badge = decisions still open for this participant (addressed to them, not yet acted).
      acc[tab.id] = artifactsState.filter(
        a =>
          a.decisionId &&
          a.artifactType !== "SCREEN_FLASH" &&
          a.actionState !== "ACTED" &&
          a.actionState !== "LOCKED"
      ).length;
    } else {
      acc[tab.id] = artifactsState.filter(
        a =>
          getTab(a) === tab.id &&
          a.status === "UNREAD" &&
          a.artifactType !== "SCREEN_FLASH"
      ).length;
    }
    return acc;
  }, {});

  const handleFlashDecision = async action => {
    if (!activeFlash?.decisionId) return;
    try {
      setFlashLoading(true);
      const res = await fetch(`${API_BASE}/api/runs/${runId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          decisionId: activeFlash.decisionId,
          action,
        }),
      });
      if (!res.ok) throw new Error("Couldn't record that — please try again.");
      await refetch();
      updateStatus(activeFlash.artifactId, "ACTED");
      setTimeout(() => {
        setDismissed(prev => new Set([...prev, activeFlash.artifactId]));
        setActiveFlash(null);
      }, 1400);
    } catch (e) {
      console.error(e);
    } finally {
      setFlashLoading(false);
    }
  };

  const handleFlashDismiss = () => {
    if (!activeFlash) return;
    setDismissed(prev => new Set([...prev, activeFlash.artifactId]));
    setActiveFlash(null);
  };

  // The timer COUNTS DOWN from the round's duration. Amber under 5 min, red under 1 min.
  // Pause-aware: faculty pause and a News interrupt (1.2) add pausedSeconds, so the clock freezes
  // while the schedule is held rather than ticking through the pause.
  const paused = Boolean(round?.paused);
  const remaining = useServerCountdown(round?.remainingSeconds, paused);
  const timerClass =
    paused ? "warn"
    : remaining == null ? ""
    : remaining <= 60 ? "critical"
    : remaining <= 300 ? "warn"
    : "";

  // Fire a brief on-screen flash as the round nears its end (5 min, then 1 min left) — once per round,
  // for EVERY role (all seeded from the same server clock), and never while paused.
  useEffect(() => {
    if (remaining == null || paused) return;
    const marks = [
      { at: 300, label: "5 minutes remaining" },
      { at: 60, label: "1 minute remaining" },
    ];
    for (const m of marks) {
      const key = `${round?.roundNumber}-${m.at}`;
      if (remaining > 0 && remaining <= m.at && !firedThresholds.current.has(key)) {
        firedThresholds.current.add(key);
        setTimeFlash(m.label);
        setTimeout(() => setTimeFlash(null), 3800);
      }
    }
  }, [remaining, round, paused]);

  if (!runId || !participantId)
    return <div className="sim-error">Invalid session.</div>;
  if (loading)
    return <div className="sim-loading">Loading session</div>;
  if (error)
    return <div className="sim-error">Error: {error}</div>;

  const flashPayload = activeFlash ? safeParse(activeFlash.payload) : null;
  const flashOptions = activeFlash
    ? (typeof activeFlash.decisionOptions === "string"
        ? JSON.parse(activeFlash.decisionOptions)
        : activeFlash.decisionOptions)
    : null;

  // The CEO's round-ending decision is the one decision-bearing screen flash. It opens at the
  // Deliberation-Phase start so the CEO can submit any time before the timer ends; the round then
  // advances strictly on the clock (no early advance). A persistent banner gives reliable access.
  const isCEO = role === "CEO";
  const finalFlash = artifactsState.find(
    a => a.artifactType === "SCREEN_FLASH" && a.decisionId
  );
  const finalSubmitted =
    finalFlash?.status === "ACTED" || finalFlash?.actionState === "ACTED";

  // CEO releases the post-round debrief; the rest of the team follows via the round-state poll.
  const continueToNextRound = async () => {
    const completed = interstitial?.roundNumber;
    setInterstitial(null);
    if (!completed) return;
    try {
      await fetch(`${API_BASE}/api/runs/${runId}/rounds/${completed}/ack-interstitial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
    } catch {
      /* the poll will still release the team once the ack lands */
    }
  };

  // Opened directly without a live session — send the user back to the start.
  if (!runId || !participantId) {
    return (
      <div className="round-screen" style={{ padding: 24 }}>
        No active session. Please start from the team join page.
      </div>
    );
  }

  return (
    <div className="round-screen">

      {timeFlash && <div className="round-time-flash">⏳ {timeFlash}</div>}

      {news && (
        <div className="news-overlay" role="alertdialog" aria-label="Breaking news">
          <div className="news-inner">
            <div className="news-kicker">● BREAKING NEWS</div>
            <div className="news-headline">{news.headline}</div>
            {news.body && <div className="news-body">{news.body}</div>}
            <div className="news-foot">
              The round timer is paused
              {news.secondsLeft > 0 ? ` — resuming in ${news.secondsLeft}s` : ""}.
            </div>
          </div>
        </div>
      )}

      {interstitial && (
        <div className="round-transition">
          <div className="round-transition-inner interstitial">
            <div className="round-transition-eyebrow">
              Round {interstitial.roundNumber} complete
              {interstitial.title ? ` · ${interstitial.title}` : ""}
            </div>
            <div className="interstitial-framing-label">The CEO’s framing</div>
            <div
              className={`interstitial-framing${interstitial.submitted ? "" : " missed"}`}
            >
              {interstitial.framing || "—"}
            </div>
            {interstitial.prompt && (
              <>
                <div className="interstitial-prompt-label">To discuss</div>
                <div className="interstitial-prompt">{interstitial.prompt}</div>
              </>
            )}
            {isCEO ? (
              <button className="interstitial-continue" onClick={continueToNextRound}>
                Continue to Round {interstitial.nextRound} →
              </button>
            ) : (
              <div className="interstitial-wait">
                Waiting for your CEO to continue to Round {interstitial.nextRound}…
              </div>
            )}
          </div>
        </div>
      )}

      {activeFlash && (
        <ScreenFlashOverlay
          artifact={activeFlash}
          payload={flashPayload}
          options={flashOptions}
          onDecide={handleFlashDecision}
          onDismiss={handleFlashDismiss}
          loading={flashLoading}
        />
      )}

      <div className="top-bar">
        <div className="top-left role-label">
          Role:&nbsp;<span className="role-value">{ROLE_DISPLAY[role] || role}</span>
        </div>
        <div className="top-center">
          <div className="app-title">Leadership Simulator</div>
          <div className="phase-label">
            Round {round?.roundNumber ?? 1}
            {round?.totalRounds ? ` of ${round.totalRounds}` : ""} · Interpretation Phase
          </div>
        </div>
        <div className="top-right time-block">
          <span className="time-label">{paused ? "Paused" : "Time Left"}</span>
          <div className={`time-value ${timerClass}`}>
            {paused ? "⏸ Paused" : remaining == null ? "--:--" : formatTime(remaining)}
          </div>
        </div>
      </div>

      {/* Visible to EVERYONE: the round is time-boxed and advances on its own. The CEO also gets the
          round-ending decision control inline here once it opens. */}
      <div className={`round-info-bar${isCEO && finalSubmitted ? " done" : ""}`}>
        <span>
          Round {round?.roundNumber} advances automatically when the timer ends — no skipping ahead.
        </span>
        {isCEO && finalFlash && !finalSubmitted && (
          <button className="ceo-final-btn" onClick={() => setActiveFlash(finalFlash)}>
            Submit Round {round?.roundNumber} decision →
          </button>
        )}
        {isCEO && finalSubmitted && (
          <span className="round-info-done">✓ Round {round?.roundNumber} framing submitted</span>
        )}
      </div>

      <div className="main">
        <div className="primary-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {tabCounts[tab.id] > 0 && (
                <span className="nav-badge">{tabCounts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="secondary-list">
          <div className="list-header">
            <div className="list-header-label">{activeTab}</div>
          </div>
          {visibleArtifacts.length === 0 ? (
            <div className="list-empty">No items</div>
          ) : (
            <ArtifactList
              artifacts={visibleArtifacts}
              selectedId={selectedArtifact?.artifactId}
              onSelect={handleSelect}
              typeLabels={TYPE_LABELS}
            />
          )}
        </div>

        <div className="content-canvas">
          <div className="viewer">
            <ArtifactDetail
              artifact={
                selectedArtifact ? { ...selectedArtifact, updateStatus } : null
              }
              runId={runId}
              participantId={participantId}
              refetch={refetch}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
