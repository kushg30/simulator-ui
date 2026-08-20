import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getParticipants,
  getRun,
  ROLE_LABELS,
  ROLE_PROMPTS,
  startRound,
  startRun,
} from "./api";
import "./sim2.css";

const TOTAL_ROLES = 5; // v4: team of five (BI Associate role removed)

/**
 * Lobby. The Team Lead starts the run once all five roles are filled; everyone
 * else is forwarded automatically as soon as Round 1 goes active.
 */
export default function Sim2WaitingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const teamId = params.get("teamId");
  const participantId = params.get("participantId");
  const role = params.get("role");
  const isLead = role === "TEAM_LEAD";

  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const goToRound = useCallback(
    (runId) => {
      navigate(
        `/sim2/round/1?runId=${runId}&participantId=${participantId}&role=${role}&teamId=${teamId}`
      );
    },
    [navigate, participantId, role, teamId]
  );

  const poll = useCallback(async () => {
    if (!teamId) return;
    try {
      const list = await getParticipants(teamId);
      setParticipants(list || []);
      const run = await getRun(teamId);
      const runId = run && (run.runId || run.run_id);
      // Non-leads follow automatically once the run exists.
      if (runId && !isLead) goToRound(runId);
    } catch (e) {
      setError(e.message);
    }
  }, [teamId, isLead, goToRound]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [poll]);

  const assigned = participants.filter((p) => p.role).length;
  const allAssigned = assigned === TOTAL_ROLES;

  async function handleStart() {
    setBusy(true);
    setError("");
    try {
      const run = await startRun(teamId);
      const runId = run.runId || run.run_id;
      await startRound(runId, 1);
      goToRound(runId);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Waiting room</h1>
        <p className="s2-sub">
          You are the <strong>{ROLE_LABELS[role] || role}</strong>. Team ID:{" "}
          <code>{teamId}</code>{" "}
          <button
            className="s2-linkish"
            onClick={() =>
              navigate(
                `/sim2/context?teamId=${teamId}&participantId=${participantId}&role=${role}`
              )
            }
          >
            review briefing
          </button>
        </p>

        {ROLE_PROMPTS[role] && (
          <div className="s2-card s2-private-brief">
            <div className="s2-ref-section">Your private brief</div>
            <div style={{ lineHeight: 1.6 }}>{ROLE_PROMPTS[role]}</div>
          </div>
        )}

        <div className="s2-card">
          <h2>
            Team ({assigned}/{TOTAL_ROLES} roles filled)
          </h2>
          {participants.map((p) => (
            <div key={p.participantId} className="s2-construct">
              <span>{p.name}</span>
              <span className={p.role ? "" : "s2-pending"}>
                {p.role ? ROLE_LABELS[p.role] || p.role : "choosing…"}
              </span>
            </div>
          ))}
        </div>

        <div className="s2-card">
          {isLead ? (
            <>
              <h2>Start the engagement</h2>
              <p className="s2-sub">
                Round 1 is 18 minutes. The clock starts as soon as you begin.
              </p>
              <button onClick={handleStart} disabled={busy || !allAssigned}>
                {allAssigned ? "Start Round 1" : `Waiting for ${TOTAL_ROLES - assigned} more`}
              </button>
            </>
          ) : (
            <p className="s2-sub" style={{ margin: 0 }}>
              Waiting for the Team Lead to start Round 1…
            </p>
          )}
          {error && <p className="s2-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
