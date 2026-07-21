import API_BASE from "../config";

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
