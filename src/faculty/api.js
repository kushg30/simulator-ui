import API_BASE from "../config";

// Meridian Retail QBR — the simulation the debrief and wiki default to when no
// team is live yet (e.g. a facilitator editing the FAQ before class).
export const MERIDIAN_SIMULATION_ID = "5116d200-0000-4000-a000-000000000002";

// The facilitator token is kept in sessionStorage: it disappears when the tab
// closes, so a shared classroom machine does not leave the controls unlocked.
const TOKEN_KEY = "facultyToken";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
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
  INSIGHT_COMMUNICATION: "Insight Comm.",
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
