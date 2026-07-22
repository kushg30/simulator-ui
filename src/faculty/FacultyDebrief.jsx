import { useCallback, useEffect, useState } from "react";
import { CONSTRUCT_LABELS, CONSTRUCT_ORDER, getDebrief } from "./api";

/**
 * Facilitator debrief (spec section 8): the cross-team leaderboard plus the two highlights the
 * spec asks for — where each team's Data Trust first dropped, and any High-confidence-but-wrong
 * rounds. Rendered inside the faculty console, so it inherits the token gate.
 */
export default function FacultyDebrief({ simulationId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    if (!simulationId) return;
    getDebrief(simulationId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [simulationId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  if (error) return <p className="f-error">{error}</p>;
  if (!data) return <p className="f-note">Loading debrief…</p>;

  const teams = data.teams || [];
  if (teams.length === 0) {
    return <p className="f-note">No team has finished all six rounds yet.</p>;
  }

  const band = (v) => (v == null ? "—" : v >= 75 ? "High" : v >= 40 ? "Med" : "Low");

  return (
    <div>
      {/* ── leaderboard: teams × constructs ─────────────────────────── */}
      <h2>Leaderboard · {teams.length} finished</h2>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              {CONSTRUCT_ORDER.map((c) => (
                <th key={c}>{CONSTRUCT_LABELS[c]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.runId}>
                <td>{t.teamName}</td>
                {CONSTRUCT_ORDER.map((c) => {
                  const v = t.scores?.[c];
                  return (
                    <td key={c}>
                      {v == null ? (
                        <span className="f-note">—</span>
                      ) : (
                        <>
                          <strong>{v}</strong>{" "}
                          <span className="f-note">{band(v)}</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── per-team highlights ─────────────────────────────────────── */}
      <h2 style={{ marginTop: 22 }}>Highlights</h2>
      <p className="f-note" style={{ marginBottom: 12 }}>
        The two signals the debrief is built to surface: where trust in the numbers first slipped,
        and where a team was sure and wrong.
      </p>
      {teams.map((t) => (
        <div key={t.runId} className="f-construct" style={{ display: "block", padding: "10px 0" }}>
          <strong>{t.teamName}</strong>
          <div className="f-note" style={{ marginTop: 4 }}>
            {t.dataTrustFirstDropRound ? (
              <>
                Data Trust first dropped at <strong>Round {t.dataTrustFirstDropRound}</strong> —{" "}
                {t.dataTrustPattern}.
              </>
            ) : (
              <>Data Trust never dropped.</>
            )}
          </div>
          <div className="f-note" style={{ marginTop: 2 }}>
            {t.highConfidenceWrongRounds && t.highConfidenceWrongRounds.length > 0 ? (
              <span style={{ color: "var(--f-bad)" }}>
                High confidence but wrong in Round{" "}
                {t.highConfidenceWrongRounds.join(", ")} — worth unpacking in the debrief.
              </span>
            ) : (
              <>Confidence tracked correctness; no overconfident misses.</>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
