import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getArtifacts,
  getQuestion,
  getRoundState,
  parsePayload,
  recordDecision,
  ROLE_LABELS,
  submitRound,
} from "./api";
import "./sim2.css";

function useCountdown(endsAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!endsAt) return null;
  return Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000));
}

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

  const [artifacts, setArtifacts] = useState([]);
  const [roundState, setRoundState] = useState(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  const [typedAnswer, setTypedAnswer] = useState("");
  const [confidence, setConfidence] = useState("MEDIUM");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!runId || !participantId) return;
    try {
      const [list, states] = await Promise.all([
        getArtifacts(runId, roundNumber, participantId),
        getRoundState(runId),
      ]);
      setArtifacts(list || []);
      setRoundState((states || []).find((s) => s.roundNumber === roundNumber) || null);
    } catch (e) {
      setError(e.message);
    }
  }, [runId, participantId, roundNumber]);

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

  const remaining = useCountdown(roundState?.endsAt);
  const timerClass = useMemo(() => {
    if (remaining === null) return "";
    if (remaining <= 60) return "critical";
    if (remaining <= 300) return "warn";
    return "";
  }, [remaining]);

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
        typedAnswer: typedAnswer.trim(),
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

  return (
    <div className="sim2">
      <div className="s2-shell">
        <div className="s2-row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1>Round {roundNumber} — Clean this before I trust a single number in it</h1>
            <p className="s2-sub">
              You are the <strong>{ROLE_LABELS[role] || role}</strong>
            </p>
          </div>
          <div className={`s2-timer ${timerClass}`}>{formatClock(remaining)}</div>
        </div>

        {artifacts.length === 0 && (
          <div className="s2-card">
            <p className="s2-sub" style={{ margin: 0 }}>
              Nothing has landed yet. Artifacts are released on the round clock.
            </p>
          </div>
        )}

        {artifacts.map((a) => {
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
                    <code key={f}>{f}</code>
                  ))}
                </div>
              )}

              {a.actionState === "OPEN" && optionList.length > 0 && (
                <div className="s2-row" style={{ marginTop: 16 }}>
                  {optionList.map((opt) => (
                    <button key={opt.id} onClick={() => chooseOption(a, opt.id)}>
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
            <p className="s2-ok">This round has been submitted.</p>
          ) : isLead ? (
            <form onSubmit={handleSubmit}>
              <label htmlFor="s2-answer">Your answer</label>
              <input
                id="s2-answer"
                type="text"
                value={typedAnswer}
                placeholder="e.g. 1302602"
                onChange={(e) => setTypedAnswer(e.target.value)}
              />

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

              <label htmlFor="s2-file">Workbook</label>
              <input
                id="s2-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <div className="s2-row" style={{ marginTop: 16 }}>
                <button type="submit" disabled={submitting || !typedAnswer.trim()}>
                  {submitting ? "Submitting…" : "Submit round"}
                </button>
              </div>
            </form>
          ) : (
            <p className="s2-sub" style={{ margin: 0 }}>
              Your Team Lead submits on behalf of the team.
            </p>
          )}

          {error && <p className="s2-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
