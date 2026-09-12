import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE, { warmup } from "../config";
import "../sim2/sim2.css";

/**
 * Simulator 1 (Leadership Judgment — ANP Phoenix) team entry.
 * Two clear paths: create a team (you become CEO) or join one with a 4-digit code.
 * Joining asks only for the code — you give your name when you pick your role.
 */
const ROLE_LABELS = {
  CEO: "CEO",
  CFO: "CFO",
  CHRO: "CHRO",
  HEAD_OF_ENGINEERING: "Head of Engineering",
  OPERATIONS: "Head of Operations",
  PRODUCT: "Head of Product",
};

export default function TeamJoinPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // ── rejoin ────────────────────────────────────────────────────────────────
  // A refresh, a dropped connection or a closed tab loses the ids that live in the URL, and without a
  // way back the student's only option is to join again — which creates a SECOND roleless participant
  // row and (before the seat-count fix) could leave the team unable to start at all. Rejoin puts them
  // back in the seat they already hold.
  const [rejoinCode, setRejoinCode] = useState("");
  const [rejoinTeamId, setRejoinTeamId] = useState("");
  const [seats, setSeats] = useState(null); // occupied seats, or null before a lookup
  const [rejoinRunId, setRejoinRunId] = useState(null);

  useEffect(() => {
    warmup();
  }, []);

  async function findSession(e) {
    e.preventDefault();
    const code = rejoinCode.trim();
    if (!code || busy) return;
    setBusy(true);
    setError("");
    setSeats(null);
    try {
      const rres = await fetch(`${API_BASE}/api/teams/resolve/${encodeURIComponent(code)}`);
      if (!rres.ok) throw new Error("No team found for that code. Check it with your CEO.");
      const { teamId } = await rres.json();
      setRejoinTeamId(teamId);

      const pres = await fetch(`${API_BASE}/api/teams/${teamId}/participants`);
      const list = pres.ok ? await pres.json() : [];
      // Only seated people can be rejoined as. A row with no role is someone who never finished
      // picking one, and rejoining as them would drop the student into the game with no seat.
      const seated = (list || []).filter((p) => p.role);
      if (seated.length === 0) {
        throw new Error("Nobody has taken a role on that team yet — join it instead.");
      }
      setSeats(seated);

      // If the run has already started, rejoining goes straight back into the round.
      try {
        const runRes = await fetch(`${API_BASE}/api/runs/team/${teamId}`);
        const run = runRes.ok ? await runRes.json() : null;
        setRejoinRunId(run ? run.runId || run.run_id || null : null);
      } catch {
        setRejoinRunId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function rejoinAs(p) {
    const base = `teamId=${rejoinTeamId}&participantId=${p.participantId}&role=${p.role}`;
    if (rejoinRunId) {
      navigate(`/simulator?runId=${rejoinRunId}&participantId=${p.participantId}&role=${p.role}`);
    } else {
      navigate(`/waiting?${base}`);
    }
  }

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
        <h1>Phoenix AI Judgment — ANP Phoenix</h1>
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

        <div className="s2-card">
          <h2>Rejoin your team</h2>
          <p className="s2-sub">
            Already picked your role and got disconnected, or closed the tab? Enter your team code and
            tap your name — you go straight back to your seat.
          </p>
          <form onSubmit={findSession}>
            <label htmlFor="s1-rejoin-code">Team code</label>
            <input
              id="s1-rejoin-code"
              type="text"
              inputMode="numeric"
              value={rejoinCode}
              placeholder="e.g. 4821"
              onChange={(e) => setRejoinCode(e.target.value)}
            />
            <div className="s2-row" style={{ marginTop: 14 }}>
              <button type="submit" className="s2-secondary" disabled={busy || !rejoinCode.trim()}>
                {busy ? "Looking…" : "Find my seat"}
              </button>
            </div>
          </form>

          {seats && (
            <div style={{ marginTop: 16 }}>
              <p className="s2-sub" style={{ marginBottom: 8 }}>
                {rejoinRunId
                  ? "This team is already playing. Tap your name to rejoin the round:"
                  : "Tap your name to return to the waiting room:"}
              </p>
              {seats.map((p) => (
                <div key={p.participantId} className="s2-construct">
                  <span>
                    {p.name || "—"}
                    <span className="s2-sub"> · {ROLE_LABELS[p.role] || p.role}</span>
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
