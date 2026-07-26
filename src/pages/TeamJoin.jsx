import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config";
import "../sim2/sim2.css";

/**
 * Simulator 1 (Leadership Judgment — ANP Phoenix) team entry.
 * Creating a team makes you the CEO (the simulation's lead role); joining sends
 * you to role selection. Styled to match the Simulator 2 entry screen.
 */
export default function TeamJoinPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !teamName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: teamName.trim(), participantName: name.trim() }),
      });
      if (!res.ok) throw new Error("Could not create the team. Please try again.");
      const data = await res.json();
      navigate(
        `/waiting?teamId=${data.teamId}&participantId=${data.participantId}&role=${data.role || "CEO"}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim() || !teamId.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/teams/${teamId.trim()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantName: name.trim() }),
      });
      if (!res.ok) throw new Error("Could not join — check the Team ID and try again.");
      const data = await res.json();
      navigate(`/role-selection?teamId=${teamId.trim()}&participantId=${data.participantId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Leadership Judgment — ANP Phoenix</h1>
        <p className="s2-sub">
          You are the senior leadership team of ANP Phoenix. Create a team to lead it as CEO, or join
          an existing one and choose your role.
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
          <p className="s2-sub">You will lead it as CEO and submit the team's Round 1 decision.</p>
          <form onSubmit={handleCreate}>
            <label htmlFor="s1-team-name">Team name</label>
            <input
              id="s1-team-name"
              type="text"
              value={teamName}
              placeholder="e.g. Table 4"
              onChange={(e) => setTeamName(e.target.value)}
            />
            <div className="s2-row" style={{ marginTop: 14 }}>
              <button type="submit" disabled={busy || !name.trim() || !teamName.trim()}>
                {busy ? "Creating…" : "Create team"}
              </button>
            </div>
          </form>
        </div>

        <div className="s2-card">
          <h2>Join an existing team</h2>
          <form onSubmit={handleJoin}>
            <label htmlFor="s1-team-id">Team ID</label>
            <input
              id="s1-team-id"
              type="text"
              value={teamId}
              placeholder="Paste the team ID from your CEO"
              onChange={(e) => setTeamId(e.target.value)}
            />
            <div className="s2-row" style={{ marginTop: 14 }}>
              <button
                type="submit"
                className="s2-secondary"
                disabled={busy || !name.trim() || !teamId.trim()}
              >
                {busy ? "Joining…" : "Join team"}
              </button>
            </div>
          </form>
        </div>

        {error && <p className="s2-error">{error}</p>}
      </div>
    </div>
  );
}
