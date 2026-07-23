import API_BASE from "../config";

// Simulator 2 — Meridian Retail QBR.
// The simulation id is seeded by V3__sim2_seed_round1.sql.
export const MERIDIAN_SIMULATION_ID = "5116d200-0000-4000-a000-000000000002";

async function toJson(res) {
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const message = (body && body.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

// ── team formation (shared platform endpoints, scoped by simulationId) ──────

export function createTeam(teamName, participantName) {
  return fetch(`${API_BASE}/api/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamName,
      participantName,
      simulationId: MERIDIAN_SIMULATION_ID,
    }),
  }).then(toJson);
}

export function joinTeam(teamId, participantName) {
  return fetch(`${API_BASE}/api/teams/${teamId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantName }),
  }).then(toJson);
}

export function getRoles(teamId) {
  return fetch(`${API_BASE}/api/teams/${teamId}/roles`).then(toJson);
}

export function assignRole(teamId, participantId, role) {
  return fetch(`${API_BASE}/api/teams/${teamId}/assign-role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId, role }),
  }).then(toJson);
}

export function getParticipants(teamId) {
  return fetch(`${API_BASE}/api/teams/${teamId}/participants`).then(toJson);
}

export function getRun(teamId) {
  return fetch(`${API_BASE}/api/runs/team/${teamId}`).then(toJson);
}

export function startRun(teamId) {
  return fetch(`${API_BASE}/api/runs/start/${teamId}`, { method: "POST" }).then(toJson);
}

// ── sim2 engine ─────────────────────────────────────────────────────────────

export function startRound(runId, roundNumber) {
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/rounds/${roundNumber}/start`, {
    method: "POST",
  }).then(toJson);
}

export function getRoundState(runId) {
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/state`).then(toJson);
}

export function getArtifacts(runId, roundNumber, participantId) {
  return fetch(
    `${API_BASE}/api/sim2/runs/${runId}/rounds/${roundNumber}/participants/${participantId}/artifacts`
  ).then(toJson);
}

export function getQuestion(runId, roundNumber) {
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/rounds/${roundNumber}/question`).then(toJson);
}

export function recordDecision(runId, participantId, decisionId, action) {
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId, decisionId, action }),
  }).then(toJson);
}

export function submitRound(runId, roundNumber, { participantId, typedAnswer, confidence, file }) {
  const form = new FormData();
  form.append("participantId", participantId);
  form.append("typedAnswer", typedAnswer);
  form.append("confidence", confidence);
  if (file) form.append("file", file);
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/rounds/${roundNumber}/submission`, {
    method: "POST",
    body: form,
  }).then(toJson);
}

export function getResults(runId, roundNumber) {
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/rounds/${roundNumber}/results`).then(toJson);
}

export function getWiki(runId, round) {
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/wiki?round=${round}`).then(toJson);
}

// ── display helpers ─────────────────────────────────────────────────────────

export const ROLE_LABELS = {
  TEAM_LEAD: "Team Lead",
  DATA_QUALITY_ANALYST: "Data Quality Analyst",
  CATEGORY_REGIONAL_ANALYST: "Category & Regional Analyst",
  REPORTING_DASHBOARD_ANALYST: "Reporting & Dashboard Analyst",
  PEOPLE_ANALYTICS_ASSOCIATE: "People Analytics Associate",
  AUTOMATION_BI_ASSOCIATE: "Automation & BI Associate",
};

export const CONSTRUCT_LABELS = {
  DATA_TRUST_SCORE: "Data Trust Score",
  ANALYTICAL_RIGOR: "Analytical Rigor",
  INSIGHT_COMMUNICATION: "Insight Communication",
  JUDGMENT_CALIBRATION: "Judgment Calibration",
  TURNAROUND_DISCIPLINE: "Turnaround Discipline",
};

/** Reveal bands from the spec: High 75–100 / Medium 40–74 / Low 0–39. */
export function band(value) {
  if (value === null || value === undefined) return null;
  if (value >= 75) return "High";
  if (value >= 40) return "Medium";
  return "Low";
}

/** Safely parse an artifact payload, which arrives as a JSON string. */
export function parsePayload(payload) {
  if (!payload) return {};
  if (typeof payload === "object") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}
