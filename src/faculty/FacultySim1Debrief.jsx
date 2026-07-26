import { Fragment, useCallback, useEffect, useState } from "react";
import {
  getSim1Debrief,
  SIM1_ADVERSE,
  SIM1_CONSTRUCT_LABELS,
} from "./api";

/**
 * Faculty debrief for Simulator 1 (Leadership Judgment — ANP Phoenix).
 *
 * Simulator 1 scores four hidden variables (Set A), shown here per team with a per-role breakdown.
 * Students never see these numbers — the facilitator reveals them qualitatively (High / Medium /
 * Low), which is why this view lives only in the console.
 */
export default function FacultySim1Debrief({ simulationId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null); // runId whose roles are shown

  const refresh = useCallback(() => {
    if (!simulationId) return;
    getSim1Debrief(simulationId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [simulationId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  if (error) return <p className="f-error">{error}</p>;
  if (!data) return <p className="f-note">Loading Simulation 1 debrief…</p>;

  const constructs = data.constructs || Object.keys(SIM1_CONSTRUCT_LABELS);
  const teams = data.teams || [];

  if (teams.length === 0) {
    return (
      <p className="f-note">
        No Simulation 1 team has recorded decisions yet. Scores appear here once a team starts acting
        on Round 1 artifacts.
      </p>
    );
  }

  // Higher is better for trust/execution; for risk/exposure a high value is the adverse band.
  const bandOf = (key, v) => {
    if (v == null) return "na";
    const high = v >= 67;
    const low = v < 34;
    if (SIM1_ADVERSE.has(key)) return high ? "low" : low ? "high" : "med"; // invert colour, keep label
    return high ? "high" : low ? "low" : "med";
  };
  const labelOf = (v) => (v == null ? "—" : v >= 67 ? "High" : v >= 34 ? "Med" : "Low");
  const when = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cell = (key, v) => (
    <span className={`f-band f-band-${bandOf(key, v)}`}>
      {v == null ? "—" : `${v} · ${labelOf(v)}`}
    </span>
  );

  return (
    <div>
      <div className="f-spread">
        <h2 style={{ margin: 0 }}>
          Simulation 1 — Leadership Judgment · {teams.length} team
          {teams.length === 1 ? "" : "s"}
        </h2>
        <span className="f-note">click a team to see each role</span>
      </div>
      <p className="f-note" style={{ margin: "6px 0 12px" }}>
        The engine's four hidden variables (Set A). Students never see these numbers — reveal them
        qualitatively. For Organizational Risk and Ethical Exposure a high value is the adverse
        direction, so the colour is inverted while the label still reads the raw level.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Started</th>
              {constructs.map((c) => (
                <th key={c}>{SIM1_CONSTRUCT_LABELS[c] || c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const open = expanded === t.runId;
              return (
                <Fragment key={t.runId}>
                  <tr
                    className={open ? "f-selected" : ""}
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpanded(open ? null : t.runId)}
                  >
                    <td>
                      <strong>{open ? "▾ " : "▸ "}{t.teamName}</strong>
                    </td>
                    <td className="f-note">{when(t.startedAt)}</td>
                    {constructs.map((c) => (
                      <td key={c}>{cell(c, t.scores?.[c])}</td>
                    ))}
                  </tr>
                  {open &&
                    (t.participants || []).map((p, i) => (
                      <tr key={`${t.runId}-${p.role}-${i}`}>
                        <td style={{ paddingLeft: 26 }} className="f-note">
                          {p.name ? `${p.name} · ` : ""}
                          {p.role}
                        </td>
                        <td />
                        {constructs.map((c) => (
                          <td key={c}>{cell(c, p.scores?.[c])}</td>
                        ))}
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
