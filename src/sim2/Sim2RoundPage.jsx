import { useCallback, useEffect, useMemo, useState } from "react";
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
  ROLE_LABELS,
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

// v4 structured-submission vocabularies.
const DATA_ISSUES = ["Incorrect", "Incomplete", "Improper Formatting", "Duplicated"];
const ROOT_CAUSES = ["Training/Execution Gap", "Market/Environment Condition"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

  // v4 structured submission: per-round graded fields, plus the multi-select tags
  // (R1) and the one-line / Board Brief free text (all owned rounds).
  const [fields, setFields] = useState({});
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState("");
  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }));
  const toggleTag = (t) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  // The graded fields for this round, in the order the MULTI answer key expects them.
  const gradedParts = useCallback(() => {
    switch (roundNumber) {
      case 1: return [fields.revenue, fields.refunds];
      case 2: return [fields.rootCause, fields.gap];
      case 3: return [fields.rows];
      case 4:
      case 5: return [fields.product, fields.productCount, fields.month, fields.monthCount];
      default: return [fields.answer];
    }
  }, [roundNumber, fields]);

  // Assemble the string sent as typedAnswer: graded fields first (so the MULTI key
  // grades them), then the captured tags / one-line / Board Brief as labelled meta.
  const buildTypedAnswer = useCallback(() => {
    const graded = gradedParts().map((v) => String(v ?? "").trim()).join("; ");
    let meta = "";
    if (roundNumber === 1) meta = ` | issues: ${tags.join(", ")} | note: ${note.trim()}`;
    else if (roundNumber === 2 || roundNumber === 3) meta = ` | note: ${note.trim()}`;
    else if (roundNumber === 5) meta = ` | brief: ${note.trim()}`;
    return (graded + meta).trim();
  }, [gradedParts, roundNumber, tags, note]);

  const canSubmit = gradedParts().every((v) => String(v ?? "").trim() !== "");

  // ── engagement devices (v2) ───────────────────────────────────────────────
  const [breaking, setBreaking] = useState(null); // { message } when a new broadcast lands
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

  async function chooseOption(artifact, optionId) {
    setError("");
    try {
      await recordDecision(runId, participantId, artifact.decisionId, optionId);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
            <button onClick={() => setBreaking(null)}>Acknowledge</button>
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

          {submitted ? (
            <>
              <p className="s2-ok">Round {roundNumber} submitted.</p>
              <p className="s2-sub" style={{ margin: 0 }}>
                {roundNumber >= TOTAL_ROUNDS
                  ? "Final round complete — heading to the results…"
                  : isLead
                  ? "Continue to the results to review and start the next round."
                  : "Waiting for the Team Lead to start the next round — you'll move on automatically."}
              </p>

              {isLead && roundNumber < TOTAL_ROUNDS && (
                <div className="s2-row" style={{ marginTop: 14 }}>
                  <button onClick={() => gotoResults(roundNumber)}>
                    Go to results — start Round {roundNumber + 1} →
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
          ) : isOwner || isLead ? (
            <form onSubmit={handleSubmit}>
              {roundNumber === 1 && (
                <>
                  <label htmlFor="s2-revenue">Total revenue for Bluetooth Speaker</label>
                  <input id="s2-revenue" type="text" inputMode="decimal" placeholder="e.g. 62667"
                    value={fields.revenue ?? ""} onChange={(e) => setField("revenue", e.target.value)} />

                  <label htmlFor="s2-refunds">Number of notes classifying as Refund Request</label>
                  <input id="s2-refunds" type="text" inputMode="numeric" placeholder="e.g. 59"
                    value={fields.refunds ?? ""} onChange={(e) => setField("refunds", e.target.value)} />

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
                  <label htmlFor="s2-root">Root cause</label>
                  <select id="s2-root" value={fields.rootCause ?? ""}
                    onChange={(e) => setField("rootCause", e.target.value)}>
                    <option value="">Select…</option>
                    {ROOT_CAUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <label htmlFor="s2-gap">Supporting attainment gap (percentage points)</label>
                  <input id="s2-gap" type="text" inputMode="decimal" placeholder="e.g. 25.5"
                    value={fields.gap ?? ""} onChange={(e) => setField("gap", e.target.value)} />

                  <label htmlFor="s2-note">In one line, what number convinced you?</label>
                  <input id="s2-note" type="text" maxLength={140} value={note}
                    onChange={(e) => setNote(e.target.value)} />
                </>
              )}

              {roundNumber === 3 && (
                <>
                  <label htmlFor="s2-rows">Total combined row count after cleaning</label>
                  <input id="s2-rows" type="text" inputMode="numeric" placeholder="e.g. 270"
                    value={fields.rows ?? ""} onChange={(e) => setField("rows", e.target.value)} />

                  <label htmlFor="s2-note">In one line, describe your cleaning steps</label>
                  <input id="s2-note" type="text" maxLength={140} value={note}
                    onChange={(e) => setNote(e.target.value)} />
                </>
              )}

              {(roundNumber === 4 || roundNumber === 5) && (
                <>
                  <label htmlFor="s2-product">Most ordered product</label>
                  <input id="s2-product" type="text" placeholder="e.g. Notebook Set"
                    value={fields.product ?? ""} onChange={(e) => setField("product", e.target.value)} />

                  <label htmlFor="s2-pcount">Order count for that product</label>
                  <input id="s2-pcount" type="text" inputMode="numeric" placeholder="e.g. 35"
                    value={fields.productCount ?? ""}
                    onChange={(e) => setField("productCount", e.target.value)} />

                  <label htmlFor="s2-month">Highest volume month</label>
                  <select id="s2-month" value={fields.month ?? ""}
                    onChange={(e) => setField("month", e.target.value)}>
                    <option value="">Select…</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>

                  <label htmlFor="s2-mcount">Order count for that month</label>
                  <input id="s2-mcount" type="text" inputMode="numeric" placeholder="e.g. 90"
                    value={fields.monthCount ?? ""}
                    onChange={(e) => setField("monthCount", e.target.value)} />
                </>
              )}

              {roundNumber === 5 && (
                <>
                  <label htmlFor="s2-brief">Board Brief — what your team found across the engagement</label>
                  <textarea id="s2-brief" maxLength={600} rows={5} value={note}
                    placeholder="Plain language. Cite the numbers the Board should remember."
                    onChange={(e) => setNote(e.target.value)} />
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

              <label htmlFor="s2-file">
                {roundNumber === 3 ? "Workbook (.xlsm)"
                  : roundNumber === 5 ? "Power BI file or screenshot"
                  : "Workbook"}
              </label>
              <input
                id="s2-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <div className="s2-row" style={{ marginTop: 16 }}>
                <button type="submit" disabled={submitting || isPaused || !canSubmit}>
                  {isPaused ? "Paused" : submitting ? "Submitting…" : "Submit round"}
                </button>
              </div>
            </form>
          ) : (
            <p className="s2-sub" style={{ margin: 0 }}>
              This round is owned by the <strong>{ROLE_LABELS[ownerRole] || ownerRole}</strong>, who
              submits it. Your screen is read-only for this round — work together, but they submit.
            </p>
          )}

          {error && <p className="s2-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
