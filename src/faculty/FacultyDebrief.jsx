import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONSTRUCT_LABELS,
  CONSTRUCT_ORDER,
  getDebrief,
  overrideConstruct,
  revertConstruct,
} from "./api";

/**
 * Small step-line of Data Trust across the rounds, reconstructed from the final value and the rounds
 * where it dropped — so the reveal shows *when* trust broke, not just that it did. One series, so no
 * legend; drop rounds are marked in the alert colour.
 */
function DataTrustSpark({ finalValue, dropRounds, rounds = 5 }) {
  const W = 240;
  const H = 72;
  const pad = 10;
  const drops = Array.isArray(dropRounds) ? dropRounds : [];
  const stepDown = drops.length ? (100 - (finalValue ?? 100)) / drops.length : 0;
  const valAt = (r) => Math.max(0, 100 - stepDown * drops.filter((d) => d <= r).length);
  const x = (r) => pad + ((r - 1) / (rounds - 1)) * (W - 2 * pad);
  const y = (v) => pad + (1 - v / 100) * (H - 2 * pad);
  const pts = [];
  for (let r = 1; r <= rounds; r++) pts.push([x(r), y(valAt(r)), r]);
  const path = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} role="img" aria-label="Data Trust by round">
      {[100, 50, 0].map((v) => (
        <line key={v} x1={pad} y1={y(v)} x2={W - pad} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
      ))}
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      {pts.map(([px, py, r]) => (
        <circle key={r} cx={px} cy={py} r={drops.includes(r) ? 4 : 3}
          fill={drops.includes(r) ? "#da3633" : "#3b82f6"}>
          <title>{`Round ${r}: ${Math.round(valAt(r))}${drops.includes(r) ? " (dropped)" : ""}`}</title>
        </circle>
      ))}
    </svg>
  );
}

/**
 * Facilitator debrief (spec section 8): the cross-team leaderboard, the two highlights the spec
 * asks for, and the ability to override a finalised construct after reviewing a team's work.
 * Rendered inside the faculty console, so it inherits the token gate.
 */
export default function FacultyDebrief({ simulationId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // inline override editor state
  const [editTeam, setEditTeam] = useState(null); // {runId, teamName}
  const [editConstruct, setEditConstruct] = useState(CONSTRUCT_ORDER[0]);
  const [editValue, setEditValue] = useState("");
  const [editReason, setEditReason] = useState("");
  const editorRef = useRef(null);

  const actor = localStorage.getItem("facultyActor") || "facilitator";

  // The override editor renders below the leaderboard; scroll it into view (and
  // focus the score field) when a facilitator clicks a score, so it's obvious
  // where the panel opened.
  useEffect(() => {
    if (!editTeam) return;
    const t = setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      editorRef.current?.querySelector("input")?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [editTeam]);

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
    return <p className="f-note">No team has finished all five rounds yet.</p>;
  }

  const bandOf = (v) => (v == null ? "na" : v >= 75 ? "high" : v >= 40 ? "med" : "low");
  const bandLabel = { high: "High", med: "Med", low: "Low", na: "—" };
  const when = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  function openEditor(team, construct, currentValue) {
    setEditTeam(team);
    setEditConstruct(construct);
    setEditValue(currentValue == null ? "" : String(currentValue));
    setEditReason("");
    setMsg("");
  }

  async function saveOverride() {
    try {
      await overrideConstruct(
        editTeam.runId,
        editConstruct,
        Number(editValue),
        editReason,
        actor
      );
      setMsg(`Set ${CONSTRUCT_LABELS[editConstruct]} for ${editTeam.teamName} to ${editValue}`);
      setEditTeam(null);
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function revert(team, construct) {
    try {
      await revertConstruct(team.runId, construct, actor);
      setMsg(`Reverted ${CONSTRUCT_LABELS[construct]} for ${team.teamName} to the auto score`);
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <div>
      <div className="f-spread">
        <h2 style={{ margin: 0 }}>
          {data.simulationName || "Debrief"} · {teams.length} team
          {teams.length === 1 ? "" : "s"} finished
        </h2>
        <span className="f-note">most recent first · click a score to adjust</span>
      </div>

      {/* ── leaderboard: teams × constructs (cells are clickable to override) ── */}
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
              const overrides = t.overrides || {};
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
                    const overridden = Boolean(overrides[c]);
                    return (
                      <td key={c}>
                        <button
                          className="f-cell-btn"
                          title={
                            overridden
                              ? `Overridden by ${overrides[c]} — click to change`
                              : "Click to override"
                          }
                          onClick={() => openEditor({ runId: t.runId, teamName: t.teamName }, c, v)}
                        >
                          <span className={`f-band f-band-${b}`}>
                            {v == null ? "—" : `${v} · ${bandLabel[b]}`}
                          </span>
                          {overridden && <span className="f-edited"> ✎</span>}
                        </button>
                        {overridden && (
                          <button
                            className="f-mini"
                            title="Revert to auto score"
                            onClick={() => revert(t, c)}
                          >
                            revert
                          </button>
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
                      <span className="f-flag" title={`Data Trust ${t.dataTrustPattern}`}>
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

      {/* ── cohort ranking (ranked bars, not a flat table) ─────────────── */}
      <h2 style={{ marginTop: 22 }}>Cohort ranking</h2>
      <div className="f-rank-grid">
        {CONSTRUCT_ORDER.map((c) => {
          const rows = data.leaderboard?.constructs?.[c] || [];
          return (
            <div className="f-rank-card" key={c}>
              <div className="f-rank-title">{CONSTRUCT_LABELS[c]}</div>
              {rows.length === 0 && <div className="f-note">No scores yet.</div>}
              {rows.map((r) => (
                <div className="f-rank-row" key={r.teamName} title={`${r.teamName}: ${r.value}`}>
                  <span className="f-rank-name">{r.teamName}</span>
                  <span className="f-rank-track">
                    <span className="f-rank-fill" style={{ width: `${Math.max(2, r.value)}%` }} />
                  </span>
                  <span className="f-rank-val">{r.value}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Data Trust trajectory for flagged teams ────────────────────── */}
      {teams.some((t) => t.dataTrustFirstDropRound) && (
        <>
          <h2 style={{ marginTop: 22 }}>Data Trust trajectory — flagged teams</h2>
          <p className="f-note" style={{ marginBottom: 10 }}>
            When each flagged team's Data Trust dropped across the rounds (red = the round it broke),
            not just that it did.
          </p>
          <div className="f-rank-grid">
            {teams
              .filter((t) => t.dataTrustFirstDropRound)
              .map((t) => (
                <div className="f-rank-card" key={t.runId}>
                  <div className="f-rank-title">
                    {t.teamName}{" "}
                    <span className="f-note">· {t.dataTrustPattern}</span>
                  </div>
                  <DataTrustSpark
                    finalValue={t.scores?.DATA_TRUST_SCORE}
                    dropRounds={t.dataTrustDropRounds}
                  />
                </div>
              ))}
          </div>
        </>
      )}

      {/* ── per-round answers grid ──────────────────────────────────── */}
      <h2 style={{ marginTop: 22 }}>Answers by round</h2>
      <p className="f-note" style={{ marginBottom: 8 }}>
        Correct / incorrect per round. Round 5 is a free-text reflection, so it is not graded.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="f-ans-table">
          <thead>
            <tr>
              <th>Team</th>
              {[1, 2, 3, 4, 5].map((n) => (
                <th key={n} className="f-ans-col">
                  R{n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const byRound = {};
              (t.submissions || []).forEach((s) => {
                byRound[s.roundNumber] = s;
              });
              return (
                <tr key={t.runId}>
                  <td>{t.teamName}</td>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const s = byRound[n];
                    let mark = "·";
                    let cls = "na";
                    let title = "not submitted";
                    if (s) {
                      if (s.correct === true) {
                        mark = "✓";
                        cls = "ok";
                        title = `correct · ${s.confidence}`;
                      } else if (s.correct === false) {
                        mark = "✗";
                        cls = "bad";
                        title = `incorrect · ${s.confidence}`;
                      } else {
                        mark = "—";
                        cls = "na";
                        title = "free text (not graded)";
                      }
                    }
                    return (
                      <td key={n} className={`f-ans f-ans-${cls}`} title={title}>
                        {mark}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── inline override editor ──────────────────────────────────── */}
      {editTeam && (
        <div
          className="f-card f-editor-open"
          ref={editorRef}
          style={{ marginTop: 14, scrollMarginTop: 16 }}
        >
          <div className="f-spread">
            <h2 style={{ margin: 0 }}>
              Adjust {editTeam.teamName} — {CONSTRUCT_LABELS[editConstruct]}
            </h2>
            <button className="f-ghost" onClick={() => setEditTeam(null)}>
              Cancel
            </button>
          </div>
          <p className="f-note" style={{ marginTop: 6 }}>
            Data Trust and Insight Communication are derived from recorded choices, not from reading
            the workbook. Adjust here if the submission tells a different story. The change is logged
            and can be reverted.
          </p>
          <div className="f-row" style={{ alignItems: "flex-end" }}>
            <div style={{ width: 120 }}>
              <label htmlFor="ov-value">New score (0–100)</label>
              <input
                id="ov-value"
                type="number"
                min="0"
                max="100"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label htmlFor="ov-reason">Reason (logged)</label>
              <input
                id="ov-reason"
                type="text"
                value={editReason}
                placeholder="e.g. workbook shows clean reconciliation despite the delete"
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
            <button
              onClick={saveOverride}
              disabled={editValue === "" || Number(editValue) < 0 || Number(editValue) > 100}
            >
              Save override
            </button>
          </div>
        </div>
      )}

      {msg && <p className="f-ok">{msg}</p>}

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
                <>Data Trust held across all five rounds.</>
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
