import API_BASE from "../config";

// Meridian Retail QBR — the simulation the debrief and wiki default to when no
// team is live yet (e.g. a facilitator editing the FAQ before class).
export const MERIDIAN_SIMULATION_ID = "5116d200-0000-4000-a000-000000000002";
// Leadership Judgment — ANP Phoenix (Simulator 1).
export const ANP_PHOENIX_SIMULATION_ID = "475db739-0708-48d4-b4db-5a23f1da50d9";

// The facilitator token is kept in sessionStorage: it disappears when the tab
// closes, so a shared classroom machine does not leave the controls unlocked.
const TOKEN_KEY = "facultyToken";

export function getToken() {
  return (sessionStorage.getItem(TOKEN_KEY) || "").trim();
}

export function setToken(token) {
  // Trim: a pasted token often carries a trailing space/newline that would 401 an
  // otherwise-correct token. Whitespace is never meaningful here.
  sessionStorage.setItem(TOKEN_KEY, (token || "").trim());
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function call(path, options = {}) {
  const res = await fetch(`${API_BASE}/api/faculty${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Faculty-Token": getToken(),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = new Error((body && body.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

const post = (path, payload) =>
  call(path, { method: "POST", body: JSON.stringify(payload || {}) });

// ── session ─────────────────────────────────────────────────────────────────
export const getOverview = () => call("/overview");
export const getActions = (runId) => call(`/actions${runId ? `?runId=${runId}` : ""}`);

// ── pause / resume ──────────────────────────────────────────────────────────
export const pause = (runId, round, note, actor) =>
  post(`/runs/${runId}/rounds/${round}/pause`, { note, actor });
export const resume = (runId, round, note, actor) =>
  post(`/runs/${runId}/rounds/${round}/resume`, { note, actor });
export const pauseAll = (simulationId, note, actor) =>
  post(`/simulations/${simulationId}/pause-all`, { note, actor });
export const terminateRun = (runId, note, actor) =>
  post(`/runs/${runId}/terminate`, { note, actor });
export const restartLastRound = (runId, note, actor) =>
  post(`/runs/${runId}/restart-last-round`, { note, actor });
export const resumeAll = (simulationId, note, actor) =>
  post(`/simulations/${simulationId}/resume-all`, { note, actor });

// ── delay / bypass ──────────────────────────────────────────────────────────
export const getRoundArtifacts = (runId, round) =>
  call(`/runs/${runId}/rounds/${round}/artifacts`);
export const delayArtifact = (runId, round, artifactId, minutes, note, actor) =>
  post(`/runs/${runId}/rounds/${round}/delay`, {
    artifactId,
    minutes: String(minutes),
    note,
    actor,
  });
export const bypassArtifact = (runId, round, artifactId, note, actor) =>
  post(`/runs/${runId}/rounds/${round}/bypass-artifact`, { artifactId, note, actor });
export const bypassRound = (runId, round, note, actor) =>
  post(`/runs/${runId}/rounds/${round}/bypass-round`, { note, actor });

// ── injection ───────────────────────────────────────────────────────────────
export const getCatalogue = (simulationId) => call(`/simulations/${simulationId}/catalogue`);
export const inject = (runId, round, payload) =>
  post(`/runs/${runId}/rounds/${round}/inject`, payload);

// ── debrief (spec section 8) ────────────────────────────────────────────────
export const getDebrief = (simulationId) => call(`/sim2/simulations/${simulationId}/debrief`);
export const overrideConstruct = (runId, construct, value, reason, actor) =>
  post(`/sim2/runs/${runId}/constructs/${construct}/override`, { value, reason, actor });
export const revertConstruct = (runId, construct, actor) =>
  post(`/sim2/runs/${runId}/constructs/${construct}/revert`, { actor });

// ── Simulator 2 engagement (Breaking News broadcast) ────────────────────────
export const broadcastBreakingNews = (simulationId, message, actor) =>
  post(`/sim2/simulations/${simulationId}/broadcast`, { message, actor });

// ── Simulator 1 News interrupt (1.2) — full-screen to the class, brief timer pause ──
export const postSim1News = (runId, headline, body, pauseSeconds, actor) =>
  post(`/runs/${runId}/news`, { headline, body, pauseSeconds, actor });
export const postSim1NewsAll = (simulationId, headline, body, pauseSeconds, actor) =>
  post(`/simulations/${simulationId}/news-all`, { headline, body, pauseSeconds, actor });

// ── Simulator 1 debrief (Set-A hidden variables, faculty-only) ──────────────
export const getSim1Debrief = (simulationId) =>
  call(`/sim1/simulations/${simulationId}/debrief`);

// ── Simulator 1 Set-B constructs (the five leadership-judgment constructs) ──
export const getSim1Constructs = (simulationId) =>
  call(`/sim1/simulations/${simulationId}/constructs`);

export const SIM1_SETB_LABELS = {
  EARLY_SIGNAL_LEGITIMIZATION: "Early Signal Legit.",
  SILENCE_ACCUMULATION: "Silence",
  FRAMING_COMMITMENT: "Framing Commit.",
  AUTHORITY_CENTRALIZATION: "Authority Central.",
  OPTION_SPACE_CONTRACTION: "Option Space",
};
// Only Early Signal Legitimization is "good when high"; the other four are adverse when high.
export const SIM1_SETB_ADVERSE = new Set([
  "SILENCE_ACCUMULATION",
  "FRAMING_COMMITMENT",
  "AUTHORITY_CENTRALIZATION",
  "OPTION_SPACE_CONTRACTION",
]);

export const SIM1_CONSTRUCT_LABELS = {
  stakeholder_trust: "Stakeholder Trust",
  organizational_risk: "Organizational Risk",
  ethical_exposure: "Ethical Exposure",
  execution_quality: "Execution Quality",
};
// Constructs where a higher value is the adverse direction (flagged for faculty).
export const SIM1_ADVERSE = new Set(["organizational_risk", "ethical_exposure"]);

// ── reference wiki / FAQ (spec 9F) ──────────────────────────────────────────
export const getWiki = (simulationId) => call(`/sim2/simulations/${simulationId}/wiki`);
export const addFaq = (simulationId, title, body) =>
  post(`/sim2/simulations/${simulationId}/faq`, { title, body });
export const editFaq = (entryId, title, body) =>
  call(`/sim2/faq/${entryId}`, { method: "PUT", body: JSON.stringify({ title, body }) });
export const deleteFaq = (entryId) => call(`/sim2/faq/${entryId}`, { method: "DELETE" });

export const CONSTRUCT_LABELS = {
  DATA_TRUST_SCORE: "Data Trust",
  ANALYTICAL_RIGOR: "Analytical Rigor",
  INSIGHT_COMMUNICATION: "Board Clarity",
  JUDGMENT_CALIBRATION: "Judgment Calib.",
  TURNAROUND_DISCIPLINE: "Turnaround",
};
export const CONSTRUCT_ORDER = [
  "DATA_TRUST_SCORE",
  "ANALYTICAL_RIGOR",
  "INSIGHT_COMMUNICATION",
  "JUDGMENT_CALIBRATION",
  "TURNAROUND_DISCIPLINE",
];
