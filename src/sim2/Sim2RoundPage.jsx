import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getArtifacts,
  getBroadcast,
  getPartialLeaderboard,
  getQuestion,
  getRoundState,
  parsePayload,
  postBoardCall,
  recordDecision,
  reviseConfidence,
  ROLE_LABELS,
  startRound,
  submitRound,
} from "./api";
import Sim2Reference from "./Sim2Reference";
import "./sim2.css";

/**
 * Countdown driven by the server.
 *
 * `remainingSeconds` is authoritative and arrives with every poll; we only tick locally between
 * polls so the display is smooth. While the round is paused we stop ticking entirely, so the clock
 * visibly freezes instead of counting down and snapping back on the next poll.
 */
function useServerCountdown(remainingSeconds, paused) {
  const [tick, setTick] = useState(0);
  const [base, setBase] = useState({ seconds: null, at: Date.now() });

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds === undefined) return;
    setBase({ seconds: remainingSeconds, at: Date.now() });
  }, [remainingSeconds]);

  useEffect(() => {
    if (paused) return; // frozen: no local ticking while the facilitator holds the clock
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  if (base.seconds === null) return null;
  if (paused) return base.seconds;
  const elapsed = Math.floor((Date.now() - base.at) / 1000);
  return Math.max(0, base.seconds - elapsed);
}

const TOTAL_ROUNDS = 5; // Meridian Retail QBR (used for advance logic, never displayed)

// v4: the role that owns (and submits) each round. Round 5 is the Team Lead's.
const ROUND_OWNER = {
  1: "DATA_QUALITY_ANALYST",
  2: "CATEGORY_REGIONAL_ANALYST",
  3: "REPORTING_DASHBOARD_ANALYST",
  4: "PEOPLE_ANALYTICS_ASSOCIATE",
  5: "TEAM_LEAD",
};

// v6 structured-submission vocabularies.
const DATA_ISSUES = ["Incorrect", "Incomplete", "Improper Formatting", "Duplicated"];
// Root cause: four fishbone categories (People is the data-supported one).
const ROOT_CAUSES = [
  "People (Training & Skill Gap)",
  "Process (Execution & Operations Gap)",
  "Market (External Demand Condition)",
  "Resource (Budget or Staffing Constraint)",
];
const TOOLS = ["Tableau", "Power BI"];
const CHART_TYPES = ["Bar Chart", "Line Chart", "Map", "Other"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
// Per-round Excel/tool reference hint (v6 "Reference:" line).
const ROUND_REFERENCE = {
  1: "MID()",
  2: "AVERAGEIF(), CORREL()",
  3: "Macro Recorder",
  4: "PivotTable",
  5: "Situation · Complication · Question · Answer (SCQA)",
};

function formatClock(totalSeconds) {
  if (totalSeconds === null) return "--:--";
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function Sim2RoundPage() {
  const { roundNumber: roundParam } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const roundNumber = Number(roundParam || 1);
  // Real URL params — never hardcoded ids.
  const runId = params.get("runId");
  const participantId = params.get("participantId");
  const role = params.get("role");
  const teamId = params.get("teamId");
  const isLead = role === "TEAM_LEAD";
  const ownerRole = ROUND_OWNER[roundNumber] || "TEAM_LEAD";
  const isOwner = role === ownerRole; // only the round owner submits (v4)

  const [artifacts, setArtifacts] = useState([]);
  const [roundState, setRoundState] = useState(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  const [confidence, setConfidence] = useState("MEDIUM");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // v5 structured submission: per-round graded fields, plus the multi-select tags
  // (R1), the per-round one-liner, and the R5 SCQA free-text fields.
  const [fields, setFields] = useState({});
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState("");
  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }));
  const toggleTag = (t) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const nb = (v) => String(v ?? "").trim() !== "";

  // The graded fields for this round, in the order the MULTI answer key expects them
  // (v5). Round 5 is a free-text synthesis with no graded numeric fields.
  const gradedParts = useCallback(() => {
    switch (roundNumber) {
      case 1: return [fields.revenue];
      case 2: return [fields.rootCause, fields.gap];
      case 3: return [fields.rows, fields.revenue];
      case 4: return [fields.product, fields.productCount, fields.month, fields.monthCount];
      default: return []; // R5 synthesis — no numeric answer
    }
  }, [roundNumber, fields]);

  // Assemble the string sent as typedAnswer: graded fields first (so the MULTI key
  // grades them), then the captured tags / free text as labelled meta the scoring
  // reads for Board Clarity (and the facilitator sees).
  const buildTypedAnswer = useCallback(() => {
    const graded = gradedParts().map((v) => String(v ?? "").trim()).join("; ");
    let meta = "";
    if (roundNumber === 1) meta = ` | issues: ${tags.join(", ")} | note: ${note.trim()}`;
    else if (roundNumber === 2) meta = ` | note: ${note.trim()}`;
    else if (roundNumber === 3) meta = ` | macro: ${fields.macro || ""} | note: ${note.trim()}`;
    else if (roundNumber === 4) meta = ` | tool: ${fields.tool || ""} | chart: ${fields.chart || ""}`;
    else if (roundNumber === 5)
      meta =
        ` | situation: ${String(fields.situation || "").trim()}` +
        ` | complication: ${String(fields.complication || "").trim()}` +
        ` | question: ${String(fields.question || "").trim()}` +
        ` | answer: ${String(fields.answer || "").trim()}`;
    return (graded + meta).trim();
  }, [gradedParts, roundNumber, tags, note, fields]);

  const canSubmit = (() => {
    if (roundNumber === 5) {
      return ["situation", "complication", "question", "answer"].every((k) => nb(fields[k]));
    }
    const extra =
      roundNumber === 3 ? [fields.macro]
        : roundNumber === 4 ? [fields.tool, fields.chart]
        : [];
    return gradedParts().every(nb) && extra.every(nb);
  })();

  // ── engagement devices (v2) ───────────────────────────────────────────────
  const [breaking, setBreaking] = useState(null); // { message } when a new broadcast lands
  const [reviseConf, setReviseConf] = useState("");
  const [revising, setRevising] = useState(false);
  const [revised, setRevised] = useState(false);
  const [boardCallText, setBoardCallText] = useState("");
  const [boardCallDone, setBoardCallDone] = useState(false);
  const [partialBoard, setPartialBoard] = useState(null); // Partial Leaderboard (between R2/R3)

  // Between Rounds 2 and 3 the system reveals Data Trust + Turnaround only.
  const roundDone = roundState?.status === "COMPLETE";
  useEffect(() => {
    if (roundNumber !== 2 || !roundDone) return;
    const load = () => getPartialLeaderboard().then(setPartialBoard).catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [roundNumber, roundDone]);

  // Poll for a facilitator Breaking News broadcast; show it once (tracked by id).
  useEffect(() => {
    if (!runId) return;
    let stop = false;
    const poll = async () => {
      try {
        const b = await getBroadcast(runId);
        if (stop || !b || !b.broadcastId) return;
        const seen = localStorage.getItem("s2_last_broadcast");
        if (b.broadcastId !== seen) {
          localStorage.setItem("s2_last_broadcast", b.broadcastId);
          setBreaking(b);
        }
      } catch {
        /* transient */
      }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [runId]);

  const gotoRound = useCallback(
    (n) =>
      navigate(
        `/sim2/round/${n}?runId=${runId}&participantId=${participantId}&role=${role}&teamId=${teamId}`
      ),
    [navigate, runId, participantId, role, teamId]
  );
  const gotoResults = useCallback(
    (n) =>
      navigate(
        `/sim2/results/${n}?runId=${runId}&participantId=${participantId}&role=${role}&teamId=${teamId}`
      ),
    [navigate, runId, participantId, role, teamId]
  );

  const refresh = useCallback(async () => {
    if (!runId || !participantId) return;
    try {
      const [list, states] = await Promise.all([
        getArtifacts(runId, roundNumber, participantId),
        getRoundState(runId),
      ]);
      setArtifacts(list || []);
      const current = (states || []).find((s) => s.roundNumber === roundNumber) || null;
      setRoundState(current);

      // Follow the Team Lead: if a later round has been started, move to it.
      const laterActive = (states || []).find(
        (s) => s.status === "ACTIVE" && s.roundNumber > roundNumber
      );
      if (laterActive) {
        gotoRound(laterActive.roundNumber);
        return;
      }
      // Final round finished for everyone -> the reveal.
      if (current && current.status === "COMPLETE" && roundNumber >= TOTAL_ROUNDS) {
        gotoResults(roundNumber);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [runId, participantId, roundNumber, gotoRound, gotoResults]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!runId) return;
    getQuestion(runId, roundNumber)
      .then((q) => setQuestion(q.question || ""))
      .catch(() => {});
  }, [runId, roundNumber]);

  const isPaused = Boolean(roundState?.paused);
  const remaining = useServerCountdown(roundState?.remainingSeconds, isPaused);
  const timerClass = useMemo(() => {
    if (isPaused) return "warn";
    if (remaining === null) return "";
    if (remaining <= 60) return "critical";
    if (remaining <= 300) return "warn";
    return "";
  }, [remaining, isPaused]);

  // ── timer alarms + auto-submit-on-timeout (v5) ────────────────────────────
  const [alarm, setAlarm] = useState(null); // "5" | "1"
  const firedRef = useRef({ five: false, one: false });
  const autoRef = useRef(false);
  const roundIsComplete = roundState?.status === "COMPLETE";

  const beep = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.08;
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 300);
    } catch {
      /* audio not available — the visual pop-up still shows */
    }
  };

  const autoSubmitTimeout = useCallback(async () => {
    // Time is up and the owner has not submitted: submit an empty answer so the
    // round closes (graded as incorrect / null) instead of hanging open.
    try {
      await submitRound(runId, roundNumber, {
        participantId, typedAnswer: "", confidence, file: null,
      });
    } catch {
      /* may already be submitted — fall through to the results page */
    }
    navigate(
      `/sim2/results/${roundNumber}?runId=${runId}&participantId=${participantId}&role=${role}&teamId=${teamId}`
    );
  }, [runId, roundNumber, participantId, confidence, role, teamId, navigate]);

  // Reset per-round alarm/auto-submit tracking when the round changes.
  useEffect(() => {
    firedRef.current = { five: false, one: false };
    autoRef.current = false;
    setAlarm(null);
  }, [roundNumber]);

  // Fire the 5-minute and 1-minute pop-ups once each (not while paused/complete).
  useEffect(() => {
    if (remaining == null || roundIsComplete || isPaused) return;
    if (!firedRef.current.five && remaining <= 300 && remaining > 60) {
      firedRef.current.five = true;
      setAlarm("5");
      beep();
    }
    if (!firedRef.current.one && remaining <= 60 && remaining > 0) {
      firedRef.current.one = true;
      setAlarm("1");
      beep();
    }
  }, [remaining, roundIsComplete, isPaused]);

  // Auto-submit exactly at zero (owner only), unless the round is already done or a
  // manual submit is already in flight.
  useEffect(() => {
    if (remaining === 0 && isOwner && !roundIsComplete && !isPaused && !autoRef.current && !submitting) {
      autoRef.current = true;
      autoSubmitTimeout();
    }
  }, [remaining, isOwner, roundIsComplete, isPaused, submitting, autoSubmitTimeout]);

  const timedOut = remaining !== null && remaining <= 0;

  async function chooseOption(artifact, optionId) {
    setError("");
    try {
      await recordDecision(runId, participantId, artifact.decisionId, optionId);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const [startingNext, setStartingNext] = useState(false);
  async function startNextRound() {
    const next = roundNumber + 1;
    setStartingNext(true);
    setError("");
    try {
      await startRound(runId, next);
      gotoRound(next);
    } catch (e) {
      setError(e.message);
      setStartingNext(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (remaining !== null && remaining <= 0) return; // no submissions after time-out
    setSubmitting(true);
    setError("");
    try {
      await submitRound(runId, roundNumber, {
        participantId,
        typedAnswer: buildTypedAnswer(),
        confidence,
        file,
      });
      navigate(
        `/sim2/results/${roundNumber}?runId=${runId}&participantId=${participantId}&role=${role}&teamId=${teamId}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!runId || !participantId) {
    return (
      <div className="sim2">
        <div className="s2-shell">
          <p className="s2-error">Missing runId or participantId in the URL.</p>
        </div>
      </div>
    );
  }

  const submitted = roundState?.status === "COMPLETE";

  // Emergency Board Call artifact is shown as a forced modal, not a normal card.
  const boardCallArtifact = artifacts.find((a) => parsePayload(a.payload).board_call);
  const normalArtifacts = artifacts.filter((a) => !parsePayload(a.payload).board_call);

  async function doReviseConfidence() {
    if (!reviseConf) return;
    setRevising(true);
    setError("");
    try {
      await reviseConfidence(runId, reviseConf);
      setRevised(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setRevising(false);
    }
  }

  async function submitBoardCall() {
    if (!boardCallText.trim()) return;
    try {
      await postBoardCall(runId, {
        roundNumber,
        response: boardCallText.trim(),
        participantId,
      });
      setBoardCallDone(true);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="sim2">
      {/* Breaking News — full-width facilitator interrupt */}
      {breaking && (
        <div className="s2-breaking" onClick={() => setBreaking(null)}>
          <div className="s2-breaking-inner" onClick={(e) => e.stopPropagation()}>
            <div className="s2-breaking-tag">● Breaking</div>
            <div className="s2-breaking-msg">{breaking.message}</div>
            {isLead && roundNumber === 3 && (
              <div
                className="s2-row"
                style={{ justifyContent: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}
              >
                <span className="s2-sub" style={{ margin: 0 }}>
                  Revise your Round 2 confidence before it locks?
                </span>
                <select
                  value={reviseConf}
                  onChange={(e) => setReviseConf(e.target.value)}
                  disabled={revised}
                  style={{ width: "auto" }}
                >
                  <option value="">Keep as is</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <button
                  className="s2-secondary"
                  disabled={!reviseConf || revising || revised}
                  onClick={doReviseConfidence}
                >
                  {revised ? "Locked ✓" : revising ? "Saving…" : "Lock it in"}
                </button>
              </div>
            )}
            <button onClick={() => setBreaking(null)}>Acknowledge</button>
          </div>
        </div>
      )}

      {/* Timer alarm — 5-min / 1-min warning, any member can acknowledge */}
      {alarm && (
        <div className="s2-breaking" onClick={() => setAlarm(null)}>
          <div className="s2-breaking-inner" onClick={(e) => e.stopPropagation()}>
            <div className="s2-breaking-tag s2-alarm-tag">
              ⏱ {alarm === "5" ? "5 minutes" : "1 minute"} to time-out
            </div>
            <div className="s2-breaking-msg">
              {alarm === "5"
                ? "Five minutes left in this round. Start finalising your answer."
                : "One minute left. Submit now — the round auto-submits when the clock hits zero."}
            </div>
            <button onClick={() => setAlarm(null)}>Acknowledge</button>
          </div>
        </div>
      )}

      {/* Emergency Board Call — forced one-line response */}
      {boardCallArtifact && !boardCallDone && (
        <div className="s2-breaking">
          <div className="s2-breaking-inner" onClick={(e) => e.stopPropagation()}>
            <div className="s2-breaking-tag s2-boardcall-tag">Emergency Board Call · 60s</div>
            <div className="s2-breaking-msg">
              {parsePayload(boardCallArtifact.payload).body}
            </div>
            <input
              type="text"
              autoFocus
              value={boardCallText}
              placeholder="One word / one line…"
              onChange={(e) => setBoardCallText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitBoardCall()}
              style={{ maxWidth: 420, margin: "0 auto 14px", display: "block" }}
            />
            <button onClick={submitBoardCall} disabled={!boardCallText.trim()}>
              Send to the Board
            </button>
          </div>
        </div>
      )}

      <div className="s2-shell">
        <div className="s2-row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1>Round {roundNumber}</h1>
            <p className="s2-sub">
              You are the <strong>{ROLE_LABELS[role] || role}</strong>
            </p>
          </div>
          <div className="s2-row" style={{ gap: 16 }}>
            <Sim2Reference runId={runId} round={roundNumber} />
            <div style={{ textAlign: "right" }}>
              <div className={`s2-timer ${timerClass}`}>{formatClock(remaining)}</div>
              {isPaused && <div className="s2-paused-tag">Paused by facilitator</div>}
            </div>
          </div>
        </div>

        {isPaused && (
          <div className="s2-card s2-paused-banner">
            <strong>The facilitator has paused this round.</strong>
            <p className="s2-sub" style={{ margin: "6px 0 0" }}>
              Your clock is stopped and nothing new will arrive until the round resumes. Paused time
              is not counted against you.
            </p>
          </div>
        )}

        {normalArtifacts.length === 0 && (
          <div className="s2-card">
            <p className="s2-sub" style={{ margin: 0 }}>
              Nothing has landed yet. Artifacts are released on the round clock.
            </p>
          </div>
        )}

        {normalArtifacts.map((a) => {
          const payload = parsePayload(a.payload);
          const options = parsePayload(a.decisionOptions);
          const optionList = Array.isArray(options) ? options : [];
          return (
            <div className="s2-card" key={a.artifactId}>
              <div className="s2-artifact-meta">
                {a.artifactType.replace(/_/g, " ")} · {payload.from || "—"}
              </div>
              <h2>{payload.title || "Untitled"}</h2>
              <div className="s2-artifact-body">{payload.body}</div>

              {Array.isArray(payload.files) && payload.files.length > 0 && (
                <div className="s2-files">
                  Attached:{" "}
                  {payload.files.map((f) => (
                    <a key={f} className="s2-file-link" href={`/sim2-data/${f}`} download>
                      ⬇ {f}
                    </a>
                  ))}
                </div>
              )}

              {a.actionState === "OPEN" && optionList.length > 0 && (
                <div className="s2-row" style={{ marginTop: 16 }}>
                  {optionList.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => chooseOption(a, opt.id)}
                      disabled={isPaused}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {a.actionState === "ACTED" && (
                <p className="s2-ok">Decision recorded: {a.chosenAction}</p>
              )}
              {(a.actionState === "EXPIRED" || a.actionState === "LOCKED") && (
                <p className="s2-sub" style={{ marginBottom: 0 }}>
                  Decision window closed.
                </p>
              )}
            </div>
          );
        })}

        <div className="s2-card">
          <h2>Submit Round {roundNumber}</h2>
          {question && <p className="s2-sub">{question}</p>}
          {ROUND_REFERENCE[roundNumber] && (
            <p className="s2-sub" style={{ marginTop: 0 }}>
              <strong>Reference:</strong> {ROUND_REFERENCE[roundNumber]}
            </p>
          )}

          {submitted ? (
            <>
              <p className="s2-ok">Round {roundNumber} submitted.</p>
              <p className="s2-sub" style={{ margin: 0 }}>
                {roundNumber >= TOTAL_ROUNDS
                  ? "Final round complete — heading to the debrief…"
                  : isLead
                  ? "Start the next round when your team is ready."
                  : "Waiting for the Team Lead to start the next round — you'll move on automatically."}
              </p>

              {isLead && roundNumber < TOTAL_ROUNDS && (
                <div className="s2-row" style={{ marginTop: 14 }}>
                  <button onClick={startNextRound} disabled={startingNext}>
                    {startingNext ? "Starting…" : `Start Round ${roundNumber + 1} →`}
                  </button>
                </div>
              )}

              {roundNumber === 2 && partialBoard?.teams?.length > 0 && (
                <div className="s2-partial">
                  <div className="s2-partial-head">
                    Partial leaderboard — <strong>Data Trust</strong> &amp;{" "}
                    <strong>Turnaround</strong> only. The other three constructs and your final rank
                    stay hidden until the end.
                  </div>
                  <table className="s2-partial-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Team</th>
                        <th>Data Trust</th>
                        <th>Turnaround</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partialBoard.teams.map((t) => (
                        <tr key={t.teamName}>
                          <td>{t.rank}</td>
                          <td>{t.teamName}</td>
                          <td>{t.dataTrust ?? "—"}</td>
                          <td>{t.turnaround ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="s2-sub" style={{ marginTop: 8 }}>
                    Data Trust here is provisional — it reflects your data-quality choices so far and
                    can still move as later rounds are scored.
                  </div>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Every member sees the same fields; only the round owner can edit/submit. */}
              <fieldset
                disabled={!isOwner}
                style={{ border: "none", padding: 0, margin: 0, minInlineSize: "auto" }}
              >
              {roundNumber === 1 && (
                <>
                  <label htmlFor="s2-revenue">Total revenue for Bluetooth Speaker (Price × Quantity)</label>
                  <input id="s2-revenue" type="text" inputMode="decimal" placeholder="e.g. 48250"
                    value={fields.revenue ?? ""} onChange={(e) => setField("revenue", e.target.value)} />

                  <label>Which data issues did you find in the raw feed?</label>
                  <div className="s2-row" style={{ flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
                    {DATA_ISSUES.map((t) => (
                      <label key={t} className="s2-check">
                        <input type="checkbox" checked={tags.includes(t)}
                          onChange={() => toggleTag(t)} /> {t}
                      </label>
                    ))}
                  </div>

                  <label htmlFor="s2-note">In one line, how did you handle it?</label>
                  <input id="s2-note" type="text" maxLength={140} value={note}
                    placeholder="Cite a specific number." onChange={(e) => setNote(e.target.value)} />
                </>
              )}

              {roundNumber === 2 && (
                <>
                  <label htmlFor="s2-root">Root cause (People / Process / Market / Resource)</label>
                  <select id="s2-root" value={fields.rootCause ?? ""}
                    onChange={(e) => setField("rootCause", e.target.value)}>
                    <option value="">Select…</option>
                    {ROOT_CAUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <label htmlFor="s2-gap">Attainment gap vs rest of network (percentage points)</label>
                  <input id="s2-gap" type="text" inputMode="decimal" placeholder="e.g. 12.0"
                    value={fields.gap ?? ""} onChange={(e) => setField("gap", e.target.value)} />

                  <label htmlFor="s2-note">In one line, what number convinced you?</label>
                  <input id="s2-note" type="text" maxLength={140} value={note}
                    onChange={(e) => setNote(e.target.value)} />
                </>
              )}

              {roundNumber === 3 && (
                <>
                  <label htmlFor="s2-rows">Total combined row count</label>
                  <input id="s2-rows" type="text" inputMode="numeric" placeholder="e.g. 305"
                    value={fields.rows ?? ""} onChange={(e) => setField("rows", e.target.value)} />

                  <label htmlFor="s2-revenue">Total combined revenue (Price × Quantity, all rows)</label>
                  <input id="s2-revenue" type="text" inputMode="numeric" placeholder="e.g. 1250000"
                    value={fields.revenue ?? ""} onChange={(e) => setField("revenue", e.target.value)} />

                  <label htmlFor="s2-macro">Did you use a recorded macro?</label>
                  <select id="s2-macro" value={fields.macro ?? ""}
                    onChange={(e) => setField("macro", e.target.value)}>
                    <option value="">Select…</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>

                  <label htmlFor="s2-note">In one line, describe your macro / cleaning steps</label>
                  <input id="s2-note" type="text" maxLength={140} value={note}
                    placeholder="Mention the macro / recording steps." onChange={(e) => setNote(e.target.value)} />
                </>
              )}

              {roundNumber === 4 && (
                <>
                  <label htmlFor="s2-product">Most ordered product</label>
                  <input id="s2-product" type="text" placeholder="e.g. Desk Lamp"
                    value={fields.product ?? ""} onChange={(e) => setField("product", e.target.value)} />

                  <label htmlFor="s2-pcount">Order count for that product</label>
                  <input id="s2-pcount" type="text" inputMode="numeric" placeholder="e.g. 42"
                    value={fields.productCount ?? ""}
                    onChange={(e) => setField("productCount", e.target.value)} />

                  <label htmlFor="s2-month">Highest volume month</label>
                  <select id="s2-month" value={fields.month ?? ""}
                    onChange={(e) => setField("month", e.target.value)}>
                    <option value="">Select…</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>

                  <label htmlFor="s2-mcount">Order count for that month</label>
                  <input id="s2-mcount" type="text" inputMode="numeric" placeholder="e.g. 65"
                    value={fields.monthCount ?? ""}
                    onChange={(e) => setField("monthCount", e.target.value)} />

                  <label htmlFor="s2-tool">Which tool did you use?</label>
                  <select id="s2-tool" value={fields.tool ?? ""}
                    onChange={(e) => setField("tool", e.target.value)}>
                    <option value="">Select…</option>
                    {TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <label htmlFor="s2-chart">Chart type used for the product view</label>
                  <select id="s2-chart" value={fields.chart ?? ""}
                    onChange={(e) => setField("chart", e.target.value)}>
                    <option value="">Select…</option>
                    {CHART_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </>
              )}

              {roundNumber === 5 && (
                <>
                  <p className="s2-sub" style={{ marginTop: 0 }}>
                    Synthesise Rounds 1–4 into an <strong>SCQA</strong> brief for the Board. The
                    Complication should reference specific findings from the earlier rounds.
                  </p>
                  <label htmlFor="s2-situation">Situation — Meridian's current position</label>
                  <textarea id="s2-situation" rows={2} maxLength={300} value={fields.situation ?? ""}
                    placeholder="Where the business stands." onChange={(e) => setField("situation", e.target.value)} />

                  <label htmlFor="s2-complication">Complication — what this engagement uncovered</label>
                  <textarea id="s2-complication" rows={3} maxLength={400} value={fields.complication ?? ""}
                    placeholder="Reference the specific findings and figures from the earlier rounds."
                    onChange={(e) => setField("complication", e.target.value)} />

                  <label htmlFor="s2-question">Question — the real strategic question for the Board</label>
                  <textarea id="s2-question" rows={2} maxLength={200} value={fields.question ?? ""}
                    placeholder="The decision the Board now faces." onChange={(e) => setField("question", e.target.value)} />

                  <label htmlFor="s2-answer">Answer — your recommended next step</label>
                  <textarea id="s2-answer" rows={3} maxLength={400} value={fields.answer ?? ""}
                    placeholder="Grounded in what your team found." onChange={(e) => setField("answer", e.target.value)} />
                </>
              )}

              <label htmlFor="s2-confidence">Confidence</label>
              <select
                id="s2-confidence"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              </fieldset>

              {isOwner ? (
                <>
                  <div className="s2-row" style={{ marginTop: 16 }}>
                    <button type="submit" disabled={submitting || isPaused || timedOut || !canSubmit}>
                      {isPaused ? "Paused"
                        : timedOut ? "Time is up"
                        : submitting ? "Submitting…"
                        : "Submit round"}
                    </button>
                  </div>
                  {timedOut && (
                    <p className="s2-error" style={{ marginBottom: 0 }}>
                      Time is up — this round was auto-submitted.
                    </p>
                  )}
                </>
              ) : (
                <p className="s2-sub" style={{ margin: "16px 0 0" }}>
                  This round is owned by the <strong>{ROLE_LABELS[ownerRole] || ownerRole}</strong>,
                  who submits it. You can see exactly what they see — work together — but only they
                  submit.
                </p>
              )}
            </form>
          )}

          {error && <p className="s2-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
