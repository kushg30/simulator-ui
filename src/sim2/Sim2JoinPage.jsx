import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTeam,
  getParticipants,
  getRoundState,
  getRun,
  joinTeam,
  resolveTeamCode,
  ROLE_LABELS,
  warmup,
} from "./api";
import "./sim2.css";

// Accept either the short join code (e.g. "4821") or a full UUID team id.
async function toTeamId(input) {
  const v = (input || "").trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(v) || v.length > 10) return v; // looks like a UUID
  const res = await resolveTeamCode(v);
  return res.teamId;
}

/**
 * Entry point for Simulator 2. Creating a team makes you the Team Lead
 * (the backend assigns the simulation's lead role); joining sends you to
 * role selection.
 */
export default function Sim2JoinPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    warmup();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (/^\d+$/.test(teamName.trim())) {
      setError("Team name can't be only numbers — add a letter or word.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await createTeam(teamName.trim(), name.trim());
      // Brief already read on the landing page; go straight to the team room.
      navigate(
        `/sim2/waiting?teamId=${res.teamId}&participantId=${res.participantId}&role=${res.role}` +
          `&joinCode=${res.joinCode || ""}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const tid = await toTeamId(teamId);
      const res = await joinTeam(tid, name.trim());
      navigate(`/sim2/roles?teamId=${tid}&participantId=${res.participantId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // ── rejoin an existing session (e.g. after a facilitator paused overnight) ──
  const [rejoinId, setRejoinId] = useState("");
  const [rejoinTeamId, setRejoinTeamId] = useState("");
  const [members, setMembers] = useState(null); // participant list, or null
  const [rejoinState, setRejoinState] = useState({ runId: null, states: [] });

  async function findSession(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMembers(null);
    try {
      const tid = await toTeamId(rejoinId);
      setRejoinTeamId(tid);
      const list = await getParticipants(tid);
      let runId = null;
      let states = [];
      try {
        const run = await getRun(tid);
        runId = run && (run.runId || run.run_id);
        if (runId) states = await getRoundState(runId);
      } catch {
        // no run yet — the team is still in the lobby
      }
      setRejoinState({ runId, states });
      setMembers(list || []);
      if (!list || list.length === 0) setError("No team found with that code.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function rejoinAs(p) {
    const { runId, states } = rejoinState;
    const base = `teamId=${rejoinTeamId}&participantId=${p.participantId}&role=${p.role || ""}`;
    if (!runId) {
      navigate(`/sim2/waiting?${base}`); // still in the lobby
      return;
    }
    const active = states.find((s) => s.status === "ACTIVE");
    if (active) {
      navigate(`/sim2/round/${active.roundNumber}?runId=${runId}&${base}`);
      return;
    }
    const completed = states.filter((s) => s.status === "COMPLETE").map((s) => s.roundNumber);
    if (completed.length > 0) {
      navigate(`/sim2/results/${Math.max(...completed)}?runId=${runId}&${base}`);
      return;
    }
    navigate(`/sim2/waiting?${base}`);
  }

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Meridian Retail — Quarterly Business Review</h1>
        <p className="s2-sub">
          A five-round analytics engagement. Build a QBR the Board can trust, filter and act on.
        </p>

        <div className="s2-card">
          <h2>Your name</h2>
          <input
            type="text"
            value={name}
            placeholder="e.g. Priya Sharma"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="s2-card">
          <h2>Create a team</h2>
          <p className="s2-sub">You will lead it, and submit each round on the team's behalf.</p>
          <form onSubmit={handleCreate}>
            <label htmlFor="s2-team-name">Team name</label>
            <input
              id="s2-team-name"
              type="text"
              value={teamName}
              placeholder="e.g. Table 4"
              onChange={(e) => setTeamName(e.target.value)}
            />
            <div className="s2-row" style={{ marginTop: 14 }}>
              <button type="submit" disabled={busy || !name.trim() || !teamName.trim()}>
                Create team
              </button>
            </div>
          </form>
        </div>

        <div className="s2-card">
          <h2>Join an existing team</h2>
          <form onSubmit={handleJoin}>
            <label htmlFor="s2-team-id">Team code</label>
            <input
              id="s2-team-id"
              type="text"
              inputMode="numeric"
              value={teamId}
              placeholder="e.g. 4821 — from your Team Lead"
              onChange={(e) => setTeamId(e.target.value)}
            />
            <div className="s2-row" style={{ marginTop: 14 }}>
              <button
                type="submit"
                className="s2-secondary"
                disabled={busy || !name.trim() || !teamId.trim()}
              >
                Join team
              </button>
            </div>
          </form>
        </div>

        <div className="s2-card">
          <h2>Rejoin a session</h2>
          <p className="s2-sub">
            Coming back to a run that was already started or paused — or covering a teammate's role?
            Enter your team code, then tap the role to pick up.
          </p>
          <form onSubmit={findSession}>
            <label htmlFor="s2-rejoin-id">Team code</label>
            <input
              id="s2-rejoin-id"
              type="text"
              inputMode="numeric"
              value={rejoinId}
              placeholder="e.g. 4821"
              onChange={(e) => setRejoinId(e.target.value)}
            />
            <div className="s2-row" style={{ marginTop: 14 }}>
              <button type="submit" className="s2-secondary" disabled={busy || !rejoinId.trim()}>
                Find my session
              </button>
            </div>
          </form>

          {members && members.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p className="s2-sub">Tap your name to rejoin:</p>
              {members.map((p) => (
                <div key={p.participantId} className="s2-construct">
                  <span>
                    {p.name}
                    <span className="s2-sub"> · {ROLE_LABELS[p.role] || p.role || "no role yet"}</span>
                  </span>
                  <button className="s2-secondary" onClick={() => rejoinAs(p)}>
                    Rejoin
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="s2-error">{error}</p>}
      </div>
    </div>
  );
}
