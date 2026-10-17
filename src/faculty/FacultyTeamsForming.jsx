import { useCallback, useEffect, useState } from "react";
import * as api from "./api";

const ROLE_LABELS = {
  CEO: "CEO",
  CFO: "CFO",
  CHRO: "CHRO",
  HEAD_OF_ENGINEERING: "Engineering",
  OPERATIONS: "Operations",
  PRODUCT: "Product",
  TEAM_LEAD: "Team Lead",
  DATA_QUALITY_ANALYST: "Data Quality",
  CATEGORY_REGIONAL_ANALYST: "Diagnostics",
  REPORTING_DASHBOARD_ANALYST: "Automation",
  PEOPLE_ANALYTICS_ASSOCIATE: "Visualisation",
};

const pretty = (codes) =>
  (codes || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ROLE_LABELS[c] || c)
    .join(", ");

/**
 * The assembly phase: teams that have gathered but not yet begun.
 *
 * <p>Without this the console is empty for the several minutes while a room forms teams and claims
 * roles, and the facilitator has to ask out loud whether everyone is in. Each row shows how many
 * seats are filled and which roles are still missing, so "we are waiting on a CFO" replaces
 * "someone is missing".
 */
export default function FacultyTeamsForming({ onStarted }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    try {
      setRows(await api.getTeamsForming());
      setError("");
    } catch (e) {
      setError(e.message);
      setRows([]);
    }
  }, []);

  // Polls on its own, and faster than the main overview: this is the one panel a facilitator
  // watches while the room fills, and a team appearing ten seconds late reads as broken.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const act = async (label, fn, success) => {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(success);
      await refresh();
      if (onStarted) onStarted();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  if (rows === null) return <p className="f-note">Checking for teams…</p>;

  if (rows.length === 0) {
    return (
      <p className="f-note">
        No teams are waiting to start. Teams appear here as soon as students create them with your
        batch code, and move to the list below once they begin.
      </p>
    );
  }

  // Grouped by batch: a facilitator running two sections at once needs to start one, not both.
  const batches = [];
  for (const r of rows) {
    let b = batches.find((x) => x.cohortId === r.cohortId);
    if (!b) {
      b = { cohortId: r.cohortId, cohortName: r.cohortName, org: r.organizationName, teams: [] };
      batches.push(b);
    }
    b.teams.push(r);
  }

  return (
    <div>
      <p className="f-note" style={{ marginTop: 0 }}>
        Teams that have formed but not started. A team can only begin once every seat is filled.
      </p>
      {notice && <p className="f-ok">{notice}</p>}
      {error && <p className="f-error">{error}</p>}

      {batches.map((b) => {
        const ready = b.teams.filter((t) => Number(t.seatsFilled) >= Number(t.seatsTotal));
        return (
          <div key={b.cohortId} className="f-card" style={{ marginBottom: 12 }}>
            <div className="f-spread">
              <div>
                <strong>{b.cohortName}</strong>
                <span className="f-note"> · {b.teams.length} waiting · {ready.length} ready</span>
              </div>
              <button
                disabled={ready.length === 0 || busy === b.cohortId}
                onClick={() =>
                  act(b.cohortId, () => api.startAllInCohort(b.cohortId),
                    `Started ${ready.length} team${ready.length === 1 ? "" : "s"}.`)
                }
              >
                {busy === b.cohortId ? "Starting…" : `Start all ready (${ready.length})`}
              </button>
            </div>

            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table>
                <thead>
                  <tr>
                    <th>Team</th><th>Team code</th><th>Seats</th><th>Still missing</th><th />
                  </tr>
                </thead>
                <tbody>
                  {b.teams.map((t) => {
                    const filled = Number(t.seatsFilled);
                    const total = Number(t.seatsTotal);
                    const isReady = filled >= total && total > 0;
                    return (
                      <tr key={t.teamId}>
                        <td><strong>{t.teamName}</strong></td>
                        <td className="f-code-plain">{t.joinCode}</td>
                        <td className={isReady ? "f-ready" : "f-note"}>{filled} / {total}</td>
                        <td className="f-note">{isReady ? "—" : pretty(t.missingRoles)}</td>
                        <td>
                          <button
                            className={isReady ? "" : "f-ghost"}
                            disabled={!isReady || busy === t.teamId}
                            title={isReady ? "" : "Every seat must be filled before a team can start"}
                            onClick={() =>
                              act(t.teamId, () => api.startTeam(t.teamId),
                                `${t.teamName} started.`)
                            }
                          >
                            {busy === t.teamId ? "Starting…" : "Start"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
