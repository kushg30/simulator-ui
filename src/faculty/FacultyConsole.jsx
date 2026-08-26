import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "./api";
import Collapsible from "./Collapsible";
import FacultyDebrief from "./FacultyDebrief";
import FacultySim1SetB from "./FacultySim1SetB";
import FacultyWiki from "./FacultyWiki";
import "./faculty.css";

const ACTOR_KEY = "facultyActor";

/** Human-readable paused time: seconds, then minutes, hours, days as it grows. */
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  if (s === 0) return "0s";
  if (s < 60) return `${s}s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
  }
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return h ? `${d}d ${h}h` : `${d}d`;
}

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
  const [signingIn, setSigningIn] = useState(false);
  const [actor, setActor] = useState(() => localStorage.getItem(ACTOR_KEY) || "");

  const [overview, setOverview] = useState([]);
  const [selected, setSelected] = useState(null); // {runId, roundNumber, simulationId, teamName}
  const manageRef = useRef(null); // per-team controls, scrolled into view on "Manage"
  const [artifacts, setArtifacts] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [log, setLog] = useState([]);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState("live"); // "live" | "debrief" | "wiki"
  const [debriefSim, setDebriefSim] = useState("sim2"); // which simulation's results to show

  // terminate confirmation
  const [terminateRow, setTerminateRow] = useState(null); // the team row pending termination
  const [terminateText, setTerminateText] = useState("");


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

  // Keep a vertical scrollbar visible on the console — the debrief and live views run
  // long, and a persistent gutter avoids layout shift as sections collapse/expand.
  useEffect(() => {
    const prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "scroll";
    return () => {
      document.documentElement.style.overflowY = prev;
    };
  }, []);

  // Validate a stored token once on mount (a fresh tab has none, so nothing fires).
  // Only a single attempt — a bad/stale token fails once instead of 401-ing forever.
  useEffect(() => {
    if (api.getToken() && !authed) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll live data ONLY while authenticated. On a 401 refresh() flips authed false,
  // which tears the interval down — so an invalid token never spams the console at 5s.
  useEffect(() => {
    if (!authed) return undefined;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [authed, refresh]);

  // When a team is selected via "Manage", bring its controls into view — the
  // panel renders below the table, so scroll to it instead of making the
  // facilitator hunt for it.
  useEffect(() => {
    if (!selected) return;
    const t = setTimeout(() => {
      manageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => clearTimeout(t);
  }, [selected]);

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

  // Sign in with a loading state — the backend can be cold (Render free tier spins
  // down when idle), so the first attempt may take ~a minute; show that, don't freeze.
  async function unlock() {
    if (!token.trim() || signingIn) return;
    api.setToken(token);
    setSigningIn(true);
    setError("");
    try {
      await refresh();
    } finally {
      setSigningIn(false);
    }
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
              onKeyDown={(e) => e.key === "Enter" && unlock()}
            />
            <label htmlFor="f-actor">Your name (recorded in the action log)</label>
            <input id="f-actor" type="text" value={actor} onChange={(e) => saveActor(e.target.value)} />
            <div className="f-row" style={{ marginTop: 14 }}>
              <button onClick={unlock} disabled={!token.trim() || signingIn}>
                {signingIn ? "Signing in…" : "Unlock"}
              </button>
            </div>
            {signingIn && (
              <p className="f-sub" style={{ marginTop: 10 }}>
                Waking the server — the first login after a quiet spell can take up to a minute.
              </p>
            )}
            {error && <p className="f-error">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  const selectedRow = selected ? overview.find((r) => r.runId === selected.runId) : null;
  const simulationIds = [...new Set(overview.map((r) => r.simulationId))];

  // Whole-class pause state per simulation, read off the live overview so one of
  // Pause-All / Resume-All can be greyed out to show the current status.
  const simPauseState = (simId) => {
    const active = overview.filter(
      (r) => r.simulationId === simId && r.roundStatus === "ACTIVE" && !r.bypassed
    );
    const paused = active.filter((r) => r.paused).length;
    return { active: active.length, paused };
  };

  // The action log stores created_at as a naive UTC timestamp; render it in the
  // viewer's local time instead of showing raw UTC.
  const fmtTime = (ts) => {
    if (!ts) return "";
    let s = String(ts);
    if (!/[zZ]|[+-]\d\d:?\d\d$/.test(s)) s = s.replace(" ", "T") + "Z";
    const d = new Date(s);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
  };

  // Split live teams from ones that have finished all rounds, so the in-play list stays short.
  const isFinished = (r) => r.roundsComplete >= r.totalRounds;
  const activeTeams = overview.filter((r) => !isFinished(r));
  const finishedTeams = overview.filter(isFinished);

  const teamRow = (r) => {
    const isSel = selected?.runId === r.runId;
    const live = r.roundStatus === "ACTIVE" && !r.bypassed;
    const finished = isFinished(r);
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
        <td className="f-note">{formatDuration(r.pausedSecondsTotal)}</td>
        <td>
          <div className="f-row">
            {live && !r.paused && (
              <button
                className="f-warn"
                onClick={() =>
                  act(() => api.pause(r.runId, r.roundNumber, note, actor), `Paused ${r.teamName}`)
                }
              >
                Pause
              </button>
            )}
            {r.paused && (
              <button
                onClick={() =>
                  act(() => api.resume(r.runId, r.roundNumber, note, actor), `Resumed ${r.teamName}`)
                }
              >
                Resume
              </button>
            )}
            <button className="f-ghost" onClick={() => selectRun(r)}>
              Manage
            </button>
            <button
              className="f-ghost"
              disabled={!(r.roundsComplete > 0)}
              title="Re-open the team's last submitted round so they can submit it again"
              onClick={() =>
                act(() => api.restartLastRound(r.runId, note, actor), `Round restarted for ${r.teamName}`)
              }
            >
              Restart round
            </button>
            <button
              className="f-danger"
              onClick={() => {
                setTerminateRow(r);
                setTerminateText("");
              }}
            >
              Terminate
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const teamsTable = (rows) => (
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
      <tbody>{rows.map(teamRow)}</tbody>
    </table>
  );

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
          <button
            className={tab === "wiki" ? "" : "f-ghost"}
            onClick={() => setTab("wiki")}
          >
            Reference &amp; FAQ
          </button>
        </div>

        {tab === "debrief" && (
          <div className="f-card">
            {/* Both simulations report here, kept clearly distinct — they score
                entirely different constructs. */}
            <div className="f-row" style={{ marginBottom: 14 }}>
              <button
                className={debriefSim === "sim2" ? "" : "f-ghost"}
                onClick={() => setDebriefSim("sim2")}
              >
                Simulation 2 · Meridian QBR
              </button>
              <button
                className={debriefSim === "sim1" ? "" : "f-ghost"}
                onClick={() => setDebriefSim("sim1")}
              >
                Simulation 1 · Leadership Judgment
              </button>
            </div>
            {debriefSim === "sim2" ? (
              <FacultyDebrief simulationId={api.MERIDIAN_SIMULATION_ID} />
            ) : (
              <FacultySim1SetB simulationId={api.ANP_PHOENIX_SIMULATION_ID} />
            )}
          </div>
        )}

        {tab === "wiki" && (
          <div className="f-card">
            <FacultyWiki simulationId={api.MERIDIAN_SIMULATION_ID} />
          </div>
        )}

        {tab === "live" && (
        <>
        {/* ── whole-class controls ─────────────────────────────────────── */}
        <Collapsible title="Whole class" subtitle="pause / resume everyone">
          <p className="f-note">
            Pauses every active round of a simulation at once — a projector failure, a fire drill, or
            a misunderstanding worth stopping everyone for. Paused time never counts against
            Turnaround Discipline.
          </p>
          <div className="f-row" style={{ marginTop: 12 }}>
            {simulationIds.map((simId) => {
              const name = overview.find((r) => r.simulationId === simId)?.simulationName || simId;
              const { active, paused } = simPauseState(simId);
              const allPaused = active > 0 && paused === active;
              const nonePaused = paused === 0;
              const statusLabel = active === 0 ? "no active rounds"
                : allPaused ? "all paused"
                : nonePaused ? "all running"
                : `${paused}/${active} paused`;
              return (
                <span key={simId} className="f-row" style={{ alignItems: "center" }}>
                  <button
                    className="f-warn"
                    disabled={active === 0 || allPaused}
                    onClick={() => act(() => api.pauseAll(simId, note, actor), `Paused all — ${name}`)}
                  >
                    Pause all · {name}
                  </button>
                  <button
                    className="f-ghost"
                    disabled={nonePaused}
                    onClick={() => act(() => api.resumeAll(simId, note, actor), `Resumed all — ${name}`)}
                  >
                    Resume all
                  </button>
                  <span className="f-note">{statusLabel}</span>
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
        </Collapsible>

        {/* ── Sim 2 Breaking News broadcast ───────────────────────────── */}
        <Collapsible title="Breaking News — Simulator 2 (Round 3)" subtitle="fire the R3 interrupt">
          <p className="f-note">
            Fires the Round 3 interrupt to every Meridian team at once, <strong>personalised to each
            team's Round 2 root-cause answer</strong>: a team that landed on the People / training
            cause hears the training budget was approved; a team that answered Market hears a board
            member push back. Trigger it manually when teams are mid-Round 3.
          </p>
          <div className="f-row" style={{ marginTop: 12 }}>
            <button
              className="f-warn"
              onClick={() =>
                act(
                  () => api.broadcastBreakingNews(api.MERIDIAN_SIMULATION_ID, "R3 Breaking News", actor),
                  "Breaking News sent — each team sees the variant matching its Round 2 answer"
                )
              }
            >
              Send Breaking News
            </button>
          </div>
        </Collapsible>

        {/* ── session overview: teams in play vs finished ──────────────── */}
        <div className="f-card">
          <h2>Teams in play{activeTeams.length ? ` · ${activeTeams.length}` : ""}</h2>
          {overview.length === 0 ? (
            <p className="f-note">No rounds have been started yet.</p>
          ) : activeTeams.length === 0 ? (
            <p className="f-note">No teams are currently in play — see finished teams below.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>{teamsTable(activeTeams)}</div>
          )}
        </div>

        {finishedTeams.length > 0 && (
          <Collapsible
            title={`Finished teams · ${finishedTeams.length}`}
            subtitle="completed all rounds"
          >
            <div style={{ overflowX: "auto" }}>{teamsTable(finishedTeams)}</div>
          </Collapsible>
        )}

        {/* ── per-team controls ────────────────────────────────────────── */}
        {selectedRow && (
          <div className="f-grid2" ref={manageRef} style={{ scrollMarginTop: 16 }}>
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
                <time>{fmtTime(a.createdAt)}</time>
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

        {/* ── terminate confirmation ─────────────────────────────────────── */}
        {terminateRow && (
          <div className="f-modal-backdrop" onClick={() => setTerminateRow(null)}>
            <div className="f-modal" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginTop: 0 }}>Terminate simulation run</h2>
              <p className="f-note">
                Are you sure you want to terminate this simulation run for{" "}
                <strong>{terminateRow.teamName}</strong>? This ends the run for everyone — artifacts
                stop firing and it leaves the console. This cannot be undone.
              </p>
              <label htmlFor="f-terminate">
                Type <strong>terminate</strong> to confirm
              </label>
              <input
                id="f-terminate"
                type="text"
                autoFocus
                value={terminateText}
                placeholder="terminate"
                onChange={(e) => setTerminateText(e.target.value)}
              />
              <div className="f-row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
                <button className="f-ghost" onClick={() => setTerminateRow(null)}>
                  Cancel
                </button>
                <button
                  className="f-danger"
                  disabled={terminateText.trim().toLowerCase() !== "terminate"}
                  onClick={async () => {
                    const row = terminateRow;
                    setTerminateRow(null);
                    if (selected?.runId === row.runId) setSelected(null);
                    await act(
                      () => api.terminateRun(row.runId, note, actor),
                      `Terminated ${row.teamName}`
                    );
                  }}
                >
                  Terminate run
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
