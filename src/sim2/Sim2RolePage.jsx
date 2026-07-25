import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { assignRole, getRoles, ROLE_LABELS } from "./api";
import "./sim2.css";

const ROLE_HINTS = {
  TEAM_LEAD: "Coordinates every round and submits the team's answer",
  DATA_QUALITY_ANALYST: "Round 1 · Text & Logical functions",
  CATEGORY_REGIONAL_ANALYST: "Round 2 · Lookup/Reference, Statistical functions",
  REPORTING_DASHBOARD_ANALYST: "Round 3 · Tables, PivotTables, Slicers",
  PEOPLE_ANALYTICS_ASSOCIATE: "Round 4 · Data Models, DAX",
  AUTOMATION_BI_ASSOCIATE: "Rounds 5–6 · Power BI, VBA/Macros",
};

/** Roles auto-lock once taken and cannot be changed after submission. */
export default function Sim2RolePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const teamId = params.get("teamId");
  const participantId = params.get("participantId");

  const [roles, setRoles] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      navigate(
        `/sim2/context?teamId=${teamId}&participantId=${participantId}&role=${roleCode}`
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
