import { Fragment, useCallback, useEffect, useState } from "react";
import { getSim1Constructs, SIM1_SETB_ADVERSE, SIM1_SETB_LABELS } from "./api";
import Collapsible from "./Collapsible";

/**
 * Faculty debrief for Simulator 1 (Leadership Judgment — ANP Phoenix), Set-B.
 *
 * The five canonical constructs the design calls for — Early Signal Legitimization, Silence
 * Accumulation, Framing Commitment, Authority Centralization, Option Space Contraction — per team and
 * per role, with the interaction/threshold effects and auto class-level insights. Students never see
 * these numbers; the facilitator reveals them qualitatively (Low / Medium / High).
 */
export default function FacultySim1SetB({ simulationId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null); // runId whose roles are shown

  const refresh = useCallback(() => {
    if (!simulationId) return;
    getSim1Constructs(simulationId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [simulationId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  if (error) return <p className="f-error">{error}</p>;
  if (!data) return <p className="f-note">Loading Simulation 1 constructs…</p>;

  const order = data.constructOrder || Object.keys(SIM1_SETB_LABELS);
  const teams = data.teams || [];
  if (teams.length === 0) {
    return (
      <p className="f-note">
        No Simulation 1 team has recorded decisions yet. Constructs appear here once a team acts on
        Round-1 artifacts.
      </p>
    );
  }

  // Early Signal Legitimization is good when high; the other four are adverse when high.
  const colorClass = (c, band) => {
    if (!band) return "na";
    const adverse = SIM1_SETB_ADVERSE.has(c);
    const good = (!adverse && band === "High") || (adverse && band === "Low");
    const bad = (!adverse && band === "Low") || (adverse && band === "High");
    return good ? "high" : bad ? "low" : "med";
  };
  const cell = (c, node) => (
    <span className={`f-band f-band-${colorClass(c, node?.band)}`}>
      {node?.band ? `${node.value} · ${node.band}` : "—"}
    </span>
  );

  return (
    <div>
      <div className="f-spread">
        <h2 style={{ margin: 0 }}>
          Simulation 1 — Leadership Judgment · {teams.length} team{teams.length === 1 ? "" : "s"}
        </h2>
        <span className="f-note">click a team to see each role</span>
      </div>
      <p className="f-note" style={{ margin: "6px 0 12px" }}>
        The five canonical constructs (Set B). <strong>Early Signal Legitimization</strong> is good when
        high; <strong>Silence, Framing, Authority Centralization</strong> and <strong>Option Space</strong>{" "}
        are adverse when high. Students never see these numbers — reveal them qualitatively.
      </p>

      {(data.classInsights || []).length > 0 && (
        <Collapsible title="Class-level insights" defaultOpen>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {data.classInsights.map((s, i) => (
              <li key={i} className="f-note" style={{ marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      <Collapsible title="Teams" subtitle={`${teams.length} played`} defaultOpen>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              {order.map((c) => (
                <th key={c}>{SIM1_SETB_LABELS[c] || c}</th>
              ))}
              <th>Dominant pattern</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const open = expanded === t.runId;
              const team = t.team || {};
              const cons = team.constructs || {};
              const eff = team.effects || {};
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
                    {order.map((c) => (
                      <td key={c}>{cell(c, cons[c])}</td>
                    ))}
                    <td className="f-note">{team.dominantPattern || "—"}</td>
                  </tr>
                  {open &&
                    (t.participants || []).map((p, i) => (
                      <tr key={`${t.runId}-${p.role}-${i}`}>
                        <td style={{ paddingLeft: 26 }} className="f-note">
                          {p.name ? `${p.name} · ` : ""}
                          {p.role}
                        </td>
                        {order.map((c) => (
                          <td key={c}>{cell(c, p.constructs?.[c])}</td>
                        ))}
                        <td />
                      </tr>
                    ))}
                  {open && (
                    <tr>
                      <td colSpan={order.length + 2} style={{ paddingLeft: 26 }}>
                        <div className="f-note" style={{ padding: "4px 0 8px" }}>
                          Option Space: base {eff.optionSpaceBase} → +{eff.optionSpaceInteraction} interaction
                          {eff.escalationForeclosed ? " → +15 escalation foreclosed" : ""} ={" "}
                          {eff.optionSpaceAdjusted} (Round-1 silence {eff.round1Silence}).
                          {(team.insights || []).map((s, i) => (
                            <div key={i}>• {s}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      </Collapsible>
    </div>
  );
}
