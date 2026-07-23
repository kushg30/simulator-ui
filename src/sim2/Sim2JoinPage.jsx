import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTeam, joinTeam } from "./api";
import "./sim2.css";

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

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await createTeam(teamName.trim(), name.trim());
      navigate(
        `/sim2/waiting?teamId=${res.teamId}&participantId=${res.participantId}&role=${res.role}`
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
      const res = await joinTeam(teamId.trim(), name.trim());
      navigate(`/sim2/roles?teamId=${teamId.trim()}&participantId=${res.participantId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Meridian Retail — Quarterly Business Review</h1>
        <p className="s2-sub">
          A six-round analytics engagement. Build a QBR the Board can trust, filter and act on.
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
            <label htmlFor="s2-team-id">Team ID</label>
            <input
              id="s2-team-id"
              type="text"
              value={teamId}
              placeholder="Paste the team ID from your Team Lead"
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

        {error && <p className="s2-error">{error}</p>}
      </div>
    </div>
  );
}
