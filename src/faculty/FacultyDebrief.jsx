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

  const bandOf = (v) => (v == null ? "na" : v >= 75 ? "high" : v >= 40 ? "med" : "low");
  const bandLabel = { high: "High", med: "Med", low: "Low", na: "—" };
  const when = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="f-spread">
        <h2 style={{ margin: 0 }}>
          {data.simulationName || "Debrief"} · {teams.length} team
          {teams.length === 1 ? "" : "s"} finished
        </h2>
        <span className="f-note">most recent first</span>
      </div>

      {/* ── leaderboard: teams × constructs ─────────────────────────── */}
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Finished</th>
              {CONSTRUCT_ORDER.map((c) => (
                <th key={c}>{CONSTRUCT_LABELS[c]}</th>
              ))}
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const hcw = t.highConfidenceWrongRounds || [];
              return (
                <tr key={t.runId}>
                  <td>
                    <strong>{t.teamName}</strong>
                    <div className="f-note">started {when(t.startedAt)}</div>
                  </td>
                  <td className="f-note">{when(t.finishedAt)}</td>
                  {CONSTRUCT_ORDER.map((c) => {
                    const v = t.scores?.[c];
                    const b = bandOf(v);
                    return (
                      <td key={c}>
                        {v == null ? (
                          <span className="f-note">—</span>
                        ) : (
                          <span className={`f-band f-band-${b}`}>
                            {v} · {bandLabel[b]}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    {hcw.length > 0 && (
                      <span className="f-flag f-flag-bad" title="High confidence but wrong">
                        Overconfident R{hcw.join(", R")}
                      </span>
                    )}
                    {t.dataTrustFirstDropRound && (
                      <span
                        className="f-flag"
                        title={`Data Trust ${t.dataTrustPattern}`}
                      >
                        Trust↓ R{t.dataTrustFirstDropRound}
                      </span>
                    )}
                    {hcw.length === 0 && !t.dataTrustFirstDropRound && (
                      <span className="f-note">clean run</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── per-team narrative ──────────────────────────────────────── */}
      <h2 style={{ marginTop: 22 }}>What to raise in the debrief</h2>
      {teams.map((t) => {
        const hcw = t.highConfidenceWrongRounds || [];
        return (
          <div
            key={t.runId}
            style={{ padding: "10px 0", borderBottom: "1px solid var(--f-border)" }}
          >
            <strong>{t.teamName}</strong>
            <div className="f-note" style={{ marginTop: 4 }}>
              {t.dataTrustFirstDropRound ? (
                <>
                  Data Trust first dropped at <strong>Round {t.dataTrustFirstDropRound}</strong> —{" "}
                  {t.dataTrustPattern}.
                </>
              ) : (
                <>Data Trust held across all six rounds.</>
              )}
            </div>
            <div className="f-note" style={{ marginTop: 2 }}>
              {hcw.length > 0 ? (
                <span style={{ color: "var(--f-bad)" }}>
                  Sure but wrong in Round {hcw.join(", ")} — the calibration gap worth naming.
                </span>
              ) : (
                <>Confidence tracked correctness; no overconfident misses.</>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
