import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { warmup } from "../config";
import "../sim2/sim2.css";

/**
 * Simulator 1 (Leadership Judgment — ANP Phoenix) team entry.
 * Two clear paths: create a team (you become CEO) or join one with a 4-digit code.
 * Joining asks only for the code — you give your name when you pick your role.
 */
export default function TeamJoinPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    warmup();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !teamName.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: teamName.trim(), participantName: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create the team. Please try again.");
      navigate(
        `/waiting?teamId=${data.teamId}&participantId=${data.participantId}` +
          `&role=${data.role || "CEO"}&joinCode=${data.joinCode || ""}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    const code = teamCode.trim();
    if (!code || busy) return;
    setBusy(true);
    setError("");
    try {
      // Resolve the short code to the team id, then join (name comes at role selection).
      const rres = await fetch(`${API_BASE}/api/teams/resolve/${encodeURIComponent(code)}`);
      if (!rres.ok) throw new Error("No team found for that code. Check it with your CEO.");
      const { teamId } = await rres.json();
      const jres = await fetch(`${API_BASE}/api/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!jres.ok) throw new Error("Could not join — please try again.");
      const data = await jres.json();
      navigate(`/role-selection?teamId=${teamId}&participantId=${data.participantId}`);
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
          an existing one with the 4-digit code your CEO shares.
        </p>

        <div className="s2-card">
          <h2>Create a team</h2>
          <p className="s2-sub">You will lead it as CEO and submit each round's decision.</p>
          <form onSubmit={handleCreate}>
            <label htmlFor="s1-your-name">Your name</label>
            <input
              id="s1-your-name"
              type="text"
              value={name}
              placeholder="e.g. Priya Sharma"
              onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor="s1-team-name" style={{ marginTop: 12 }}>Team name</label>
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
          <h2>Join a team</h2>
          <p className="s2-sub">Enter the 4-digit code — you'll pick your role and add your name next.</p>
          <form onSubmit={handleJoin}>
            <label htmlFor="s1-team-code">Team code</label>
            <input
              id="s1-team-code"
              type="text"
              inputMode="numeric"
              value={teamCode}
              placeholder="e.g. 4821"
              onChange={(e) => setTeamCode(e.target.value)}
            />
            <div className="s2-row" style={{ marginTop: 14 }}>
              <button type="submit" className="s2-secondary" disabled={busy || !teamCode.trim()}>
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
