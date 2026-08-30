import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API_BASE from "../config";
import "../sim2/sim2.css";

const ROLE_LABELS = {
  CEO: "CEO",
  CFO: "CFO",
  HEAD_OF_ENGINEERING: "Head of Engineering",
  PRODUCT: "Head of Product",
  OPERATIONS: "Head of Operations",
  CHRO: "CHRO",
};

/**
 * Simulator 1 waiting room. Readiness is measured against the simulation's ROLE
 * SEATS (all six must be occupied), not against "every person present has a
 * role" — otherwise a lone CEO reads as a full team. Styled to match Sim 2.
 */
export default function WaitingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const teamId = searchParams.get("teamId");
  const participantId = searchParams.get("participantId");
  const role = searchParams.get("role");

  const [joinCode, setJoinCode] = useState(searchParams.get("joinCode") || "");
  const [participants, setParticipants] = useState([]);
  const [roles, setRoles] = useState({}); // { ROLE_CODE: occupantId | null }
  const [botsBusy, setBotsBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teams/${teamId}/participants`);
      if (res.ok) setParticipants(await res.json());
    } catch (e) {
      /* transient */
    }
  }, [teamId]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teams/${teamId}/roles`);
      if (res.ok) setRoles(await res.json());
    } catch (e) {
      /* transient */
    }
  }, [teamId]);

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/runs/team/${teamId}`);
      if (!res.ok) return;
      const data = await res.json();
      const runId = data && (data.runId || data.run_id);
      if (runId) {
        navigate(`/simulator?runId=${runId}&participantId=${participantId}&role=${role}`);
      }
    } catch (e) {
      /* transient */
    }
  }, [teamId, participantId, role, navigate]);

  useEffect(() => {
    if (!teamId) return;
    const poll = () => Promise.all([fetchParticipants(), fetchRoles(), fetchRun()]);
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [teamId, fetchParticipants, fetchRoles, fetchRun]);

  // Joiners arrive without the code in the URL — fetch the team's short code so everyone sees it.
  useEffect(() => {
    if (joinCode || !teamId) return;
    fetch(`${API_BASE}/api/teams/${teamId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.joinCode && setJoinCode(d.joinCode))
      .catch(() => {});
  }, [teamId, joinCode]);

  if (!teamId || !participantId) {
    return (
      <div className="sim2">
        <div className="s2-shell">
          <p className="s2-error">Invalid session. Please start from the team join page.</p>
        </div>
      </div>
    );
  }

  const roleCodes = Object.keys(roles);
  const filledSeats = roleCodes.filter((r) => roles[r]).length;
  const totalSeats = roleCodes.length || 6;
  const allSeatsFilled = totalSeats > 0 && filledSeats === totalSeats;

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/runs/start/${teamId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start the simulation.");
      // fetchRun (polling) will pick up the new run and navigate everyone in.
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  };

  // TESTING ONLY — fills the empty seats with bots so one person can start solo.
  const fillWithBots = async () => {
    setBotsBusy(true);
    setError("");
    try {
      for (const roleCode of roleCodes) {
        if (roles[roleCode]) continue; // seat already taken
        const joinRes = await fetch(`${API_BASE}/api/teams/${teamId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantName: `bot-${roleCode.toLowerCase()}` }),
        });
        if (!joinRes.ok) continue;
        const joined = await joinRes.json();
        await fetch(`${API_BASE}/api/teams/${teamId}/assign-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: joined.participantId, role: roleCode }),
        });
      }
      await Promise.all([fetchParticipants(), fetchRoles()]);
    } catch (e) {
      setError("Could not add bots. Try again.");
    } finally {
      setBotsBusy(false);
    }
  };

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Waiting room</h1>
        <p className="s2-sub">
          Share the 4-digit team code so the rest of the leadership team can join. The CEO starts once
          all six seats are filled.
        </p>

        <div className="s2-card">
          <h2>Team code</h2>
          <p style={{ fontSize: 40, fontWeight: 700, letterSpacing: "0.18em", margin: "4px 0 0", fontFamily: "monospace" }}>
            {joinCode || "…"}
          </p>
          <div className="s2-row" style={{ justifyContent: "space-between", marginTop: 8 }}>
            <span className="s2-sub">
              {filledSeats} / {totalSeats} seats filled
            </span>
            {joinCode && (
              <button
                className="s2-secondary"
                onClick={() => navigator.clipboard?.writeText(joinCode)}
              >
                Copy code
              </button>
            )}
          </div>
        </div>

        <div className="s2-card">
          <h2>Roster</h2>
          {roleCodes.map((rc) => {
            const occupant = participants.find((p) => p.role === rc);
            return (
              <div key={rc} className="s2-construct">
                <span>
                  {ROLE_LABELS[rc] || rc}
                  {rc === role ? <span className="s2-sub"> · you</span> : null}
                </span>
                <span className="s2-sub" style={{ color: occupant ? "var(--s2-good, #3fb950)" : undefined }}>
                  {occupant ? occupant.name : "empty"}
                </span>
              </div>
            );
          })}
        </div>

        {role === "CEO" ? (
          <button onClick={handleStart} disabled={!allSeatsFilled || starting}>
            {starting ? "Starting…" : allSeatsFilled ? "Start simulation" : "Waiting for all seats…"}
          </button>
        ) : (
          <p className="s2-sub">Waiting for the CEO to start the simulation…</p>
        )}

        {/* TESTING ONLY — remove before real sessions. */}
        {!allSeatsFilled && (
          <div className="s2-card" style={{ borderStyle: "dashed", marginTop: 14 }}>
            <p className="s2-sub" style={{ margin: "0 0 10px" }}>
              Testing shortcut — fill the empty seats with bots so you can start solo.
            </p>
            <button className="s2-secondary" onClick={fillWithBots} disabled={botsBusy}>
              {botsBusy ? "Adding bots…" : "Fill remaining seats with bots"}
            </button>
          </div>
        )}

        {error && <p className="s2-error">{error}</p>}
      </div>
    </div>
  );
}
