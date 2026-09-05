import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getResults, getRoundState, getTeam, ROLE_LABELS, startRound } from "./api";
import "./sim2.css";

/**
 * Between-rounds screen.
 *
 * v5: students never see their scores or whether a round was correct — results are
 * held back and reviewed by the facilitator in the debrief. This screen only
 * acknowledges the submission and (for the Team Lead) starts the next round.
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
  const [teamName, setTeamName] = useState("");
  // Seconds left on THIS round's clock. The next round cannot start until it hits 0
  // (rounds are time-boxed — a team may not skip ahead by submitting early).
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!teamId) return;
    getTeam(teamId).then((t) => setTeamName(t.teamName || "")).catch(() => {});
  }, [teamId]);

  const timerEnded = remaining !== null && remaining <= 0;

  async function beginNextRound() {
    if (!timerEnded) return; // guard: no skipping ahead before the round timer ends
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

  // We still fetch the round summary, but only to learn whether a next round
  // exists — no scores are rendered.
  useEffect(() => {
    if (!runId) return;
    getResults(runId, roundNumber).then(setData).catch((e) => setError(e.message));
  }, [runId, roundNumber]);

  // Auto-advance: the person who submitted lands here, so this page polls round
  // state and follows the team into the next round once the Team Lead starts it.
  useEffect(() => {
    if (!runId) return;
    let stop = false;
    const poll = async () => {
      try {
        const states = await getRoundState(runId);
        if (stop) return;
        // Track this round's remaining time so the next round can't start early.
        const cur = (states || []).find((s) => s.roundNumber === roundNumber);
        if (cur && typeof cur.remainingSeconds === "number") {
          setRemaining(cur.remainingSeconds);
        }
        // Follow the team into any round that is now active — a later round the Lead
        // started, OR this same round if a facilitator restarted it (undo a mis-submit).
        const active = (states || [])
          .filter((s) => s.status === "ACTIVE")
          .sort((a, b) => b.roundNumber - a.roundNumber)[0];
        if (active) {
          navigate(
            `/sim2/round/${active.roundNumber}?runId=${runId}` +
              `&participantId=${participantId}&role=${role}&teamId=${teamId}`
          );
        }
      } catch {
        /* transient poll error — try again next tick */
      }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [runId, roundNumber, navigate, participantId, role, teamId]);

  // Tick the displayed countdown down between server polls so it reads smoothly.
  useEffect(() => {
    if (remaining === null) return;
    const id = setInterval(
      () => setRemaining((r) => (r === null ? r : Math.max(0, r - 1))),
      1000
    );
    return () => clearInterval(id);
  }, [remaining === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!runId) {
    return (
      <div className="sim2">
        <div className="s2-shell">
          <p className="s2-error">Missing runId in the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Round {roundNumber} — submitted</h1>
        {role && (
          <p className="s2-sub">
            {teamName && (
              <>
                Team <strong>{teamName}</strong> ·{" "}
              </>
            )}
            You are the <strong>{ROLE_LABELS[role] || role}</strong>
          </p>
        )}
        <p className="s2-sub">
          Your response has been recorded. Scores are held back and reviewed with your facilitator
          in the debrief — not shown here.
        </p>

        {data && (
          <div className="s2-card">
            {data.nextRound ? (
              <>
                <h2>Round {data.nextRound} is next</h2>
                {!timerEnded ? (
                  <p className="s2-sub" style={{ margin: 0 }}>
                    Round {data.nextRound} unlocks when the Round {roundNumber} timer ends
                    {remaining !== null ? ` — ${fmt(remaining)}` : ""}. Teams move together; you
                    can’t skip ahead.
                  </p>
                ) : isLead ? (
                  <>
                    <p className="s2-sub">The clock starts as soon as you begin the round.</p>
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
                  That was the final round. Your facilitator will debrief the results.
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
