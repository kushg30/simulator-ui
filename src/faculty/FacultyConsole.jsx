import { useCallback, useEffect, useState } from "react";
import * as api from "./api";
import FacultyDebrief from "./FacultyDebrief";
import "./faculty.css";

const ACTOR_KEY = "facultyActor";

/**
 * Facilitator console — platform-wide, works for every simulation on the platform.
 *
 * Controls: pause/resume (one team or all), delay an artifact, bypass an artifact or a whole
 * round, and inject artifacts from the catalogue or free-form. Every action is written to the
 * facilitator log shown at the bottom.
 */
export default function FacultyConsole() {
  const [token, setTokenState] = useState(api.getToken());
  const [authed, setAuthed] = useState(false);
  const [actor, setActor] = useState(() => localStorage.getItem(ACTOR_KEY) || "");

  const [overview, setOverview] = useState([]);
  const [selected, setSelected] = useState(null); // {runId, roundNumber, simulationId, teamName}
  const [artifacts, setArtifacts] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [log, setLog] = useState([]);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState("live"); // "live" | "debrief"

  // delay/bypass form
  const [targetArtifact, setTargetArtifact] = useState("");
  const [delayMinutes, setDelayMinutes] = useState(5);

  // injection form
  const [catalogueId, setCatalogueId] = useState("");
  const [injTitle, setInjTitle] = useState("");
  const [injContent, setInjContent] = useState("");
  const [injScored, setInjScored] = useState(false);
  const [injAnswer, setInjAnswer] = useState("");

  const report = (message, isError) => {
    if (isError) {
      setError(message);
      setOkMsg("");
    } else {
      setOkMsg(message);
      setError("");
    }
  };

  const refresh = useCallback(async () => {
    try {
      const rows = await api.getOverview();
      setOverview(rows || []);
      setAuthed(true);
      setLog(await api.getActions(selected?.runId));
    } catch (e) {
      if (e.status === 401) setAuthed(false);
      else setError(e.message);
    }
  }, [selected]);

  useEffect(() => {
    if (!api.getToken()) return;
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  async function selectRun(row) {
    setSelected(row);
    setTargetArtifact("");
    setError("");
    setOkMsg("");
    try {
      setArtifacts(await api.getRoundArtifacts(row.runId, row.roundNumber));
      setCatalogue(await api.getCatalogue(row.simulationId));
      setLog(await api.getActions(row.runId));
    } catch (e) {
      setError(e.message);
    }
  }

  async function act(fn, successMessage) {
    try {
      await fn();
      report(successMessage, false);
      await refresh();
      if (selected) setArtifacts(await api.getRoundArtifacts(selected.runId, selected.roundNumber));
    } catch (e) {
      report(e.message, true);
    }
  }

  function saveActor(value) {
    setActor(value);
    localStorage.setItem(ACTOR_KEY, value);
  }

  // ── token gate ────────────────────────────────────────────────────────────
  if (!api.getToken() || !authed) {
    return (
      <div className="fac">
        <div className="f-shell f-gate">
          <div className="f-card">
            <h1>Facilitator console</h1>
            <p className="f-sub">These controls affect live sessions. Enter the facilitator token.</p>
            <label htmlFor="f-token">Facilitator token</label>
            <input
              id="f-token"
              type="password"
              value={token}
              onChange={(e) => setTokenState(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (api.setToken(token), refresh())}
            />
            <label htmlFor="f-actor">Your name (recorded in the action log)</label>
            <input id="f-actor" type="text" value={actor} onChange={(e) => saveActor(e.target.value)} />
            <div className="f-row" style={{ marginTop: 14 }}>
              <button
                onClick={() => {
                  api.setToken(token);
                  refresh();
                }}
                disabled={!token.trim()}
              >
                Unlock
              </button>
            </div>
            {error && <p className="f-error">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  const selectedRow = selected ? overview.find((r) => r.runId === selected.runId) : null;
  const simulationIds = [...new Set(overview.map((r) => r.simulationId))];

  return (
    <div className="fac">
      <div className="f-shell">
        <div className="f-spread">
          <div>
            <h1>Facilitator console</h1>
            <p className="f-sub">
              Live controls for every simulation. Signed in as <strong>{actor || "facilitator"}</strong>.
            </p>
          </div>
          <button
            className="f-ghost"
            onClick={() => {
              api.clearToken();
              setAuthed(false);
            }}
          >
            Lock
          </button>
        </div>

        {/* ── tab switcher ─────────────────────────────────────────────── */}
        <div className="f-row" style={{ margin: "4px 0 16px" }}>
          <button
            className={tab === "live" ? "" : "f-ghost"}
            onClick={() => setTab("live")}
          >
            Live controls
          </button>
          <button
            className={tab === "debrief" ? "" : "f-ghost"}
            onClick={() => setTab("debrief")}
          >
            Debrief &amp; leaderboard
          </button>
        </div>

        {tab === "debrief" && (
          <div className="f-card">
            <FacultyDebrief simulationId={simulationIds[0]} />
          </div>
        )}

        {tab === "live" && (
        <>
        {/* ── whole-class controls ─────────────────────────────────────── */}
        <div className="f-card">
          <h2>Whole class</h2>
          <p className="f-note">
            Pauses every active round of a simulation at once — a projector failure, a fire drill, or
            a misunderstanding worth stopping everyone for. Paused time never counts against
            Turnaround Discipline.
          </p>
          <div className="f-row" style={{ marginTop: 12 }}>
            {simulationIds.map((simId) => {
              const name = overview.find((r) => r.simulationId === simId)?.simulationName || simId;
              return (
                <span key={simId} className="f-row">
                  <button
                    className="f-warn"
                    onClick={() => act(() => api.pauseAll(simId, note, actor), `Paused all — ${name}`)}
                  >
                    Pause all · {name}
                  </button>
                  <button
                    className="f-ghost"
                    onClick={() => act(() => api.resumeAll(simId, note, actor), `Resumed all — ${name}`)}
                  >
                    Resume all
                  </button>
                </span>
              );
            })}
          </div>
          <label htmlFor="f-note">Reason (recorded in the log)</label>
          <input
            id="f-note"
            type="text"
            value={note}
            placeholder="e.g. projector failure in room 2"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* ── session overview ─────────────────────────────────────────── */}
        <div className="f-card">
          <h2>Teams in play</h2>
          {overview.length === 0 ? (
            <p className="f-note">No rounds have been started yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Simulation</th>
                  <th>Progress</th>
                  <th>State</th>
                  <th>Paused</th>
                  <th>Controls</th>
                </tr>
              </thead>
              <tbody>
                {overview.map((r) => {
                  const isSel = selected?.runId === r.runId;
                  const live = r.roundStatus === "ACTIVE" && !r.bypassed;
                  const finished = r.roundsComplete >= r.totalRounds;
                  return (
                    <tr key={r.runId} className={isSel ? "f-selected" : ""}>
                      <td>{r.teamName}</td>
                      <td className="f-note">{r.simulationName}</td>
                      <td>
                        Round {r.roundNumber}
                        <span className="f-note"> of {r.totalRounds}</span>
                        <div className="f-note">{r.roundsComplete} complete</div>
                      </td>
                      <td>
                        {r.bypassed ? (
                          <span className="f-pill bypass">Bypassed</span>
                        ) : r.paused ? (
                          <span className="f-pill paused">Paused</span>
                        ) : live ? (
                          <span className="f-pill live">Live</span>
                        ) : finished ? (
                          <span className="f-pill done">Finished</span>
                        ) : (
                          <span className="f-pill done">Between rounds</span>
                        )}
                      </td>
                      <td className="f-note">{r.pausedSecondsTotal}s</td>
                      <td>
                        <div className="f-row">
                          {/* Pause only means something while a round is actually running. */}
                          {live && !r.paused && (
                            <button
                              className="f-warn"
                              onClick={() =>
                                act(
                                  () => api.pause(r.runId, r.roundNumber, note, actor),
                                  `Paused ${r.teamName}`
                                )
                              }
                            >
                              Pause
                            </button>
                          )}
                          {r.paused && (
                            <button
                              onClick={() =>
                                act(
                                  () => api.resume(r.runId, r.roundNumber, note, actor),
                                  `Resumed ${r.teamName}`
                                )
                              }
                            >
                              Resume
                            </button>
                          )}
                          <button className="f-ghost" onClick={() => selectRun(r)}>
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── per-team controls ────────────────────────────────────────── */}
        {selectedRow && (
          <div className="f-grid2">
            <div className="f-card">
              <h2>
                Delay or skip — {selectedRow.teamName}, round {selectedRow.roundNumber}
              </h2>
              <p className="f-note">
                Delaying an artifact also shifts everything scheduled after it in the round by the
                same amount. Skipping one means its decision never appears.
              </p>

              <label htmlFor="f-artifact">Artifact</label>
              <select
                id="f-artifact"
                value={targetArtifact}
                onChange={(e) => setTargetArtifact(e.target.value)}
              >
                <option value="">Select an artifact…</option>
                {artifacts.map((a) => (
                  <option key={a.artifactId} value={a.artifactId}>
                    T+{a.openOffsetMin + a.delayMinutes} · {a.title || a.artifactType}
                    {a.bypassed ? " (skipped)" : ""}
                    {a.delayMinutes ? ` (+${a.delayMinutes}m)` : ""}
                  </option>
                ))}
              </select>

              <label htmlFor="f-delay">Delay by (minutes)</label>
              <input
                id="f-delay"
                type="number"
                min="1"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
              />

              <div className="f-row" style={{ marginTop: 14 }}>
                <button
                  disabled={!targetArtifact}
                  onClick={() =>
                    act(
                      () =>
                        api.delayArtifact(
                          selectedRow.runId,
                          selectedRow.roundNumber,
                          targetArtifact,
                          delayMinutes,
                          note,
                          actor
                        ),
                      `Delayed by ${delayMinutes} min`
                    )
                  }
                >
                  Delay
                </button>
                <button
                  className="f-ghost"
                  disabled={!targetArtifact}
                  onClick={() =>
                    act(
                      () =>
                        api.bypassArtifact(
                          selectedRow.runId,
                          selectedRow.roundNumber,
                          targetArtifact,
                          note,
                          actor
                        ),
                      "Artifact skipped"
                    )
                  }
                >
                  Skip artifact
                </button>
                <button
                  className="f-danger"
                  onClick={() =>
                    act(
                      () =>
                        api.bypassRound(selectedRow.runId, selectedRow.roundNumber, note, actor),
                      "Round bypassed — excluded from the rollup, not scored zero"
                    )
                  }
                >
                  Bypass whole round
                </button>
              </div>
              <p className="f-note" style={{ marginTop: 10 }}>
                A bypassed round is excluded from the team&apos;s construct average — treated as not
                attempted, never as a zero.
              </p>
            </div>

            {/* ── injection ─────────────────────────────────────────── */}
            <div className="f-card">
              <h2>Inject an artifact</h2>

              <label htmlFor="f-cat">From the catalogue (pre-vetted)</label>
              <select
                id="f-cat"
                value={catalogueId}
                onChange={(e) => {
                  setCatalogueId(e.target.value);
                  if (e.target.value) {
                    setInjTitle("");
                    setInjContent("");
                  }
                }}
              >
                <option value="">— none, write my own below —</option>
                {catalogue.map((c) => (
                  <option key={c.catalogueId} value={c.catalogueId}>
                    R{c.roundNumber} · [{c.tier}] {c.title}
                  </option>
                ))}
              </select>

              {!catalogueId && (
                <>
                  <label htmlFor="f-title">Title</label>
                  <input
                    id="f-title"
                    type="text"
                    value={injTitle}
                    onChange={(e) => setInjTitle(e.target.value)}
                  />
                  <label htmlFor="f-content">Content</label>
                  <textarea
                    id="f-content"
                    value={injContent}
                    onChange={(e) => setInjContent(e.target.value)}
                  />
                </>
              )}

              <label style={{ textTransform: "none", letterSpacing: 0 }}>
                <input
                  type="checkbox"
                  checked={injScored}
                  onChange={(e) => setInjScored(e.target.checked)}
                  style={{ width: "auto", marginRight: 8 }}
                />
                Use this as a graded round-ender
              </label>

              {injScored && !catalogueId && (
                <>
                  <label htmlFor="f-answer">Canonical answer (required to grade)</label>
                  <input
                    id="f-answer"
                    type="text"
                    value={injAnswer}
                    onChange={(e) => setInjAnswer(e.target.value)}
                  />
                  <p className="f-note">
                    Free-form content has no pre-computed answer. The platform will refuse to grade
                    it unless you supply one now, and it is flagged in the log as an ad hoc override.
                  </p>
                </>
              )}

              <div className="f-row" style={{ marginTop: 14 }}>
                <button
                  onClick={() =>
                    act(
                      () =>
                        api.inject(selectedRow.runId, selectedRow.roundNumber, {
                          catalogueId: catalogueId || null,
                          title: injTitle,
                          content: injContent,
                          scored: injScored,
                          canonicalAnswer: injAnswer,
                          actor,
                        }),
                      "Artifact injected"
                    )
                  }
                  disabled={!catalogueId && (!injTitle.trim() || !injContent.trim())}
                >
                  Inject now
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p className="f-error">{error}</p>}
        {okMsg && <p className="f-ok">{okMsg}</p>}

        {/* ── action log ───────────────────────────────────────────────── */}
        <div className="f-card">
          <h2>Facilitator action log{selected ? ` — ${selectedRow?.teamName || ""}` : ""}</h2>
          <p className="f-note">
            Every control action is recorded. This is the record you would need if a team disputes a
            score.
          </p>
          <div className="f-log" style={{ marginTop: 10 }}>
            {log.length === 0 && <p className="f-note">No actions recorded yet.</p>}
            {log.map((a) => (
              <div key={a.actionId}>
                <time>{String(a.createdAt).replace("T", " ").slice(0, 19)}</time>
                <strong>{a.actionType}</strong> · {a.scope} · round {a.roundNumber ?? "—"} · by{" "}
                {a.createdBy}
                {a.delayMinutes ? ` · +${a.delayMinutes}m` : ""}
                {a.note ? ` — ${a.note}` : ""}
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
