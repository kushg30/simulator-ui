import { Fragment, useCallback, useEffect, useState } from "react";
import {
  getSim1Constructs,
  getSim1Leaderboard,
  getSim1Report,
  SIM1_SETB_ADVERSE,
  SIM1_SETB_FULL,
  SIM1_SETB_LABELS,
} from "./api";
import Collapsible from "./Collapsible";
import Sim1TeamReport from "../report/Sim1TeamReport";
import { BandDistribution, RankBars } from "../report/Sim1Charts";

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
  const [board, setBoard] = useState(null); // cohort ranking per construct
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null); // runId whose roles are shown

  // Per-team report, generated on demand from the console.
  const [report, setReport] = useState(null);
  const [reportBusy, setReportBusy] = useState(null); // runId currently loading

  const refresh = useCallback(() => {
    if (!simulationId) return;
    getSim1Constructs(simulationId)
      .then(setData)
      .catch((e) => setError(e.message));
    getSim1Leaderboard(simulationId)
      .then(setBoard)
      .catch(() => { /* the ranking is additive — never block the debrief on it */ });
  }, [simulationId]);

  const openReport = async (runId) => {
    setReportBusy(runId);
    try {
      setReport(await getSim1Report(runId));
    } catch (e) {
      setError(e.message);
    } finally {
      setReportBusy(null);
    }
  };

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
      {node?.band ? `${node.value}/100 · ${node.band}` : "—"}
    </span>
  );

  return (
    <div>
      <div className="f-spread">
        <h2 style={{ margin: 0 }}>
          Simulation 1 — Phoenix AI Judgment · {teams.length} team{teams.length === 1 ? "" : "s"}
        </h2>
        <span className="f-note">click a team to see each role</span>
      </div>
      <p className="f-note" style={{ margin: "6px 0 12px" }}>
        The five canonical constructs (Set B). <strong>Early Signal Legitimization</strong> is good when
        high; <strong>Silence, Framing, Authority Centralization</strong> and <strong>Option Space</strong>{" "}
        are adverse when high. Students never see these numbers — reveal them qualitatively.
      </p>

      {/* Standing methodology reference (script 9) — replaces one-off inline annotations, and
          cross-links each construct to its debrief prompt and framework so the facilitator does not
          have to hold a second document open. */}
      <Collapsible title="How to read this" subtitle="scale, bands, and what each construct maps to">
        <p className="f-note" style={{ marginTop: 0 }}>
          <strong>Scale.</strong> Every construct runs 0–100 from a 50 baseline. Bands:{" "}
          <strong>High ≥ 67</strong>, <strong>Medium 34–66</strong>, <strong>Low &lt; 34</strong>. A team
          that never moved a construct sits at 50.
        </p>
        <p className="f-note">
          <strong>Direction.</strong> Early Signal Legitimization is the only construct where high is
          good. Silence, Framing Commitment, Authority Centralization and Option Space Contraction are
          adverse when high.
        </p>
        <p className="f-note">
          <strong>Interaction effect.</strong> Option Space is not measured directly — it is a base value
          plus an interaction term driven by accumulated Silence and Framing Commitment (shown per team as
          “base → + interaction”). Crossing the Round-1 silence threshold forecloses escalation and is
          flagged separately.
        </p>
        <p className="f-note">
          <strong>Cohort size.</strong> Below 10 teams the class-level insights report raw counts
          (“2 of 3 teams”), not percentages — a percentage would imply weight this sample cannot carry.
        </p>
        <p className="f-note" style={{ marginBottom: 0 }}>
          <strong>Where each construct lands in the debrief (Section 8 / Framework Map 0.1).</strong>{" "}
          Early Signal Legitimization → Round 1, Ansoff weak signals &amp; normalization of deviance.
          Silence → Round 1 psychological safety (Edmondson) and the Round-4 whistle channel. Framing
          Commitment → Round 2 sensemaking (Weick) and groupthink (Janis). Authority Centralization →
          Round 3 Three Lines of Defense. Option Space Contraction → Cross-round synthesis: how early
          framing compounds into governance exposure (Learning Objective 7).
        </p>
      </Collapsible>

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

      {/* ── cohort ranking ──────────────────────────────────────────────
          Ranked best-first, and "best" respects direction: for the four adverse constructs the
          LOWEST score leads the board. Ranking all five by raw value would put the team that drifted
          furthest at the top of four of the five cards. */}
      {board && board.teamCount > 0 && (
        <Collapsible
          title="Cohort ranking"
          subtitle={`${board.teamCount} team${board.teamCount === 1 ? "" : "s"} · ranked per construct`}
          defaultOpen
        >
          <RankBars
            leaderboard={board}
            labels={SIM1_SETB_FULL}
            adverse={SIM1_SETB_ADVERSE}
            order={order}
          />
        </Collapsible>
      )}

      {/* ── class distribution — the chart to project in the debrief ───── */}
      {board && board.teamCount > 0 && (
        <Collapsible title="Class distribution" subtitle="how the cohort split across the bands">
          <BandDistribution
            leaderboard={board}
            labels={SIM1_SETB_FULL}
            adverse={SIM1_SETB_ADVERSE}
            order={order}
          />
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
              <th>Report</th>
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="f-ghost"
                        onClick={() => openReport(t.runId)}
                        disabled={reportBusy === t.runId}
                      >
                        {reportBusy === t.runId ? "Generating…" : "Generate"}
                      </button>
                    </td>
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
                        <td />
                      </tr>
                    ))}
                  {open && (
                    <tr>
                      <td colSpan={order.length + 3} style={{ paddingLeft: 26 }}>
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

      {report && <Sim1TeamReport data={report} onClose={() => setReport(null)} />}
    </div>
  );
}
