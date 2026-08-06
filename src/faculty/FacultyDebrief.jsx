import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONSTRUCT_LABELS,
  CONSTRUCT_ORDER,
  getDebrief,
  overrideConstruct,
  revertConstruct,
} from "./api";

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

  // Final Board Presentation live-scoring: per-team criteria {ask, numbers, rec}.
  const [pres, setPres] = useState({});

  const actor = localStorage.getItem("facultyActor") || "facilitator";

  const presCriteria = [
    ["ask", "Clear ask answered"],
    ["numbers", "Numbers cited"],
    ["rec", "Actionable recommendation"],
  ];
  const presScore = (c) => {
    const met = presCriteria.filter(([k]) => c?.[k]).length;
    return Math.round((met / presCriteria.length) * 100);
  };
  const toggleCriterion = (runId, key) =>
    setPres((p) => ({ ...p, [runId]: { ...(p[runId] || {}), [key]: !(p[runId] || {})[key] } }));

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
    return <p className="f-note">No team has finished all six rounds yet.</p>;
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

  // Live-score Insight Communication from the Final Board Presentation criteria.
  async function savePresentation(team) {
    const c = pres[team.runId] || {};
    const score = presScore(c);
    const met = presCriteria.filter(([k]) => c[k]).map(([, label]) => label);
    try {
      await overrideConstruct(
        team.runId,
        "INSIGHT_COMMUNICATION",
        score,
        `Final Board Presentation — ${met.length ? met.join(", ") : "no criteria met"}`,
        actor
      );
      setMsg(`Insight Communication for ${team.teamName} set to ${score} from the presentation`);
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

      {/* ── per-round answers grid ──────────────────────────────────── */}
      <h2 style={{ marginTop: 22 }}>Answers by round</h2>
      <p className="f-note" style={{ marginBottom: 8 }}>
        Correct / incorrect per round. Round 6 is a free-text reflection, so it is not graded.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="f-ans-table">
          <thead>
            <tr>
              <th>Team</th>
              {[1, 2, 3, 4, 5, 6].map((n) => (
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
                  {[1, 2, 3, 4, 5, 6].map((n) => {
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

      {/* ── Final Board Presentation — live Insight Communication scoring ──── */}
      <h2 style={{ marginTop: 22 }}>Final Board Presentation — score Insight Communication live</h2>
      <p className="f-note" style={{ marginBottom: 10 }}>
        As each Team Lead presents (60s), tick the criteria they meet. Saving writes the score to
        Insight Communication for that team.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              {presCriteria.map(([k, label]) => (
                <th key={k} style={{ textAlign: "center" }}>{label}</th>
              ))}
              <th style={{ textAlign: "center" }}>Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const c = pres[t.runId] || {};
              return (
                <tr key={t.runId}>
                  <td>{t.teamName}</td>
                  {presCriteria.map(([k]) => (
                    <td key={k} style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(c[k])}
                        onChange={() => toggleCriterion(t.runId, k)}
                        style={{ width: "auto" }}
                      />
                    </td>
                  ))}
                  <td style={{ textAlign: "center" }}>
                    <span className="f-band f-band-high">{presScore(c)}</span>
                  </td>
                  <td>
                    <button className="f-mini" onClick={() => savePresentation(t)}>
                      save
                    </button>
                  </td>
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
