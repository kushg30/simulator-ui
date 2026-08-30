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

export default function RoleSelectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamId = searchParams.get("teamId");
  const participantId = searchParams.get("participantId");

  const [roles, setRoles] = useState({});
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teams/${teamId}/roles`);
      if (res.ok) setRoles(await res.json());
    } catch (e) {
      /* transient */
    }
  }, [teamId]);

  useEffect(() => {
    fetchRoles();
    const interval = setInterval(fetchRoles, 2000);
    return () => clearInterval(interval);
  }, [fetchRoles]);

  const handleSelect = async (role) => {
    if (roles[role] || busy) return;
    if (!name.trim()) {
      setError("Enter your name first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/teams/${teamId}/assign-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, role, name: name.trim() }),
      });
      if (!res.ok) throw new Error("That role was just taken — pick another.");
      navigate(`/waiting?teamId=${teamId}&participantId=${participantId}&role=${role}`);
    } catch (e) {
      setError(e.message);
      fetchRoles();
    } finally {
      setBusy(false);
    }
  };

  const roleCodes = Object.keys(roles).length
    ? Object.keys(roles)
    : ["CEO", "CFO", "HEAD_OF_ENGINEERING", "PRODUCT", "OPERATIONS", "CHRO"];

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Choose your role</h1>
        <p className="s2-sub">
          Each role interprets the same information through different incentives. Taken roles are
          locked.
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
          {roleCodes.map((role) => {
            const taken = roles[role];
            return (
              <div key={role} className="s2-construct">
                <span>{ROLE_LABELS[role] || role}</span>
                {taken ? (
                  <span className="s2-sub">Taken</span>
                ) : (
                  <button className="s2-secondary" disabled={busy} onClick={() => handleSelect(role)}>
                    Select
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="s2-error">{error}</p>}
      </div>
    </div>
  );
}
