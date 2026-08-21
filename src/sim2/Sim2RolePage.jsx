import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { assignRole, getRoles, getTeam, ROLE_LABELS } from "./api";
import "./sim2.css";

const ROLE_HINTS = {
  TEAM_LEAD: "Coordinates the team · owns Round 5 (the Board recommendation)",
  DATA_QUALITY_ANALYST: "Round 1 · can the Board trust this feed?",
  CATEGORY_REGIONAL_ANALYST: "Round 2 · diagnose the West shortfall",
  REPORTING_DASHBOARD_ANALYST: "Round 3 · automate the combine (macro)",
  PEOPLE_ANALYTICS_ASSOCIATE: "Round 4 · build the visual story",
};

/** Roles auto-lock once taken and cannot be changed after submission. */
export default function Sim2RolePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const teamId = params.get("teamId");
  const participantId = params.get("participantId");

  const [roles, setRoles] = useState({});
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    getTeam(teamId).then((t) => setTeamName(t.teamName || "")).catch(() => {});
  }, [teamId]);

  const refresh = useCallback(() => {
    if (!teamId) return;
    getRoles(teamId).then(setRoles).catch((e) => setError(e.message));
  }, [teamId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  async function choose(roleCode) {
    setBusy(true);
    setError("");
    try {
      await assignRole(teamId, participantId, roleCode);
      // Brief already read on the landing page; go straight to the team room.
      navigate(
        `/sim2/waiting?teamId=${teamId}&participantId=${participantId}&role=${roleCode}`
      );
    } catch (e) {
      setError(e.message);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!teamId || !participantId) {
    return (
      <div className="sim2">
        <div className="s2-shell">
          <p className="s2-error">Missing teamId or participantId in the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Choose your role</h1>
        <p className="s2-sub">
          {teamName && (
            <>
              Team <strong>{teamName}</strong>.{" "}
            </>
          )}
          Each role owns one round. Roles lock once taken and cannot be changed.
        </p>

        <div className="s2-card">
          <div className="s2-roles">
            {Object.entries(roles).map(([code, occupant]) => (
              <button
                key={code}
                className="s2-role"
                disabled={busy || Boolean(occupant)}
                onClick={() => choose(code)}
              >
                {ROLE_LABELS[code] || code}
                <small>{occupant ? "Taken" : ROLE_HINTS[code] || ""}</small>
              </button>
            ))}
          </div>
          {error && <p className="s2-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
