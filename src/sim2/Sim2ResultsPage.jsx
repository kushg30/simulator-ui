import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { band, CONSTRUCT_LABELS, getResults, startRound } from "./api";
import "./sim2.css";

/**
 * Round reveal. Unlike Simulation 1 (which shows no numbers at all), Meridian
 * shows a numeric 0–100 per construct plus its qualitative band.
 *
 * Constructs that cannot yet be measured are shown as pending rather than as a
 * zero — Data Trust Score depends on later rounds, and Insight Communication
 * has no signal until the dashboard/framing rounds.
 */
export default function Sim2ResultsPage() {
  const { roundNumber: roundParam } = useParams();
  const [params] = useSearchParams();

  const navigate = useNavigate();
  const roundNumber = Number(roundParam || 1);
  const runId = params.get("runId");
  const participantId = params.get("participantId");
  const role = params.get("role");
  const teamId = params.get("teamId");
  const isLead = role === "TEAM_LEAD";

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  async function beginNextRound() {
    setStarting(true);
    setError("");
    try {
      await startRound(runId, data.nextRound);
      navigate(
        `/sim2/round/${data.nextRound}?runId=${runId}&participantId=${participantId}` +
          `&role=${role}&teamId=${teamId}`
      );
    } catch (e) {
      setError(e.message);
      setStarting(false);
    }
  }

  useEffect(() => {
    if (!runId) return;
    getResults(runId, roundNumber).then(setData).catch((e) => setError(e.message));
  }, [runId, roundNumber]);

  if (!runId) {
    return (
      <div className="sim2">
        <div className="s2-shell">
          <p className="s2-error">Missing runId in the URL.</p>
        </div>
      </div>
    );
  }

  const submission = data?.submission;
  const constructs = data?.constructs || [];
  const finalReveal = data?.finalReveal || [];
  const isComplete = data && !data.nextRound && finalReveal.length > 0;

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Round {roundNumber} — results</h1>
        <p className="s2-sub">Scored on the five Meridian constructs.</p>

        {submission && (
          <div className="s2-card">
            <h2>Your submission</h2>
            <div className="s2-construct">
              <span>Answer</span>
              <span>{submission.typedAnswer}</span>
            </div>
            <div className="s2-construct">
              <span>Stated confidence</span>
              <span>{submission.confidence}</span>
            </div>
            <div className="s2-construct">
              <span>Outcome</span>
              <span className={submission.isCorrect ? "s2-ok" : "s2-error"}>
                {submission.isCorrect ? "Correct" : "Incorrect"}
              </span>
            </div>
            {submission.originalFilename && (
              <div className="s2-construct">
                <span>File</span>
                <span>{submission.originalFilename}</span>
              </div>
            )}
          </div>
        )}

        {isComplete && (
          <div className="s2-card">
            <h2>Final reveal — all six rounds</h2>
            <p className="s2-sub">
              Your five leadership constructs, scored 0–100 across the whole engagement.
            </p>
            {finalReveal.map((c) => {
              const na = c.status !== "SCORED" || c.value === null;
              return (
                <div className="s2-construct" key={c.construct}>
                  <span style={{ minWidth: 210 }}>
                    {CONSTRUCT_LABELS[c.construct] || c.construct}
                  </span>
                  <div className="s2-bar">
                    <span style={{ width: na ? 0 : `${c.value}%` }} />
                  </div>
                  <span className="s2-score" title={c.detail || ""}>
                    {na ? <em className="s2-pending">n/a</em> : `${c.value} · ${band(c.value)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="s2-card">
          <h2>This round</h2>
          {constructs.map((c) => {
            const na = c.status !== "SCORED" || c.value === null;
            const label =
              c.status === "NOT_APPLICABLE" ? "Not applicable" : "Not yet scored";
            return (
              <div className="s2-construct" key={c.construct}>
                <span style={{ minWidth: 190 }}>
                  {CONSTRUCT_LABELS[c.construct] || c.construct}
                </span>
                <div className="s2-bar">
                  <span style={{ width: na ? 0 : `${c.value}%` }} />
                </div>
                <span className="s2-score">
                  {na ? (
                    <em className="s2-pending" title={c.detail || ""}>
                      {label}
                    </em>
                  ) : (
                    `${c.value} · ${band(c.value)}`
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {data && (
          <div className="s2-card">
            {data.nextRound ? (
              <>
                <h2>Round {data.nextRound} is next</h2>
                {isLead ? (
                  <>
                    <p className="s2-sub">
                      The clock starts as soon as you begin the round.
                    </p>
                    <button onClick={beginNextRound} disabled={starting}>
                      {starting ? "Starting…" : `Start Round ${data.nextRound}`}
                    </button>
                  </>
                ) : (
                  <p className="s2-sub" style={{ margin: 0 }}>
                    Waiting for your Team Lead to start Round {data.nextRound}.
                  </p>
                )}
              </>
            ) : (
              <>
                <h2>Engagement complete</h2>
                <p className="s2-sub" style={{ margin: 0 }}>
                  That was the final round. Your facilitator will take it from here.
                </p>
              </>
            )}
          </div>
        )}

        {error && <p className="s2-error">{error}</p>}
      </div>
    </div>
  );
}
