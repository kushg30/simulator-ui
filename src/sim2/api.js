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

// Fire-and-forget wake-up so the free-tier backend (and Neon) are warm by the
// time the user submits the join form — hides the cold-start delay.
export function warmup() {
  fetch(`${API_BASE}/api/teams/00000000-0000-0000-0000-000000000000/roles`).catch(() => {});
}

export function getWiki(runId, round) {
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/wiki?round=${round}`).then(toJson);
}

// ── engagement devices (v2) ─────────────────────────────────────────────────
// Latest facilitator Breaking News broadcast for the simulation ({} if none).
export function getBroadcast(simulationId = MERIDIAN_SIMULATION_ID) {
  return fetch(`${API_BASE}/api/sim2/simulations/${simulationId}/broadcast`).then(toJson);
}
// Partial Leaderboard reveal (Data Trust + Turnaround), shown between R2 and R3.
export function getPartialLeaderboard(simulationId = MERIDIAN_SIMULATION_ID) {
  return fetch(`${API_BASE}/api/sim2/simulations/${simulationId}/partial-leaderboard`).then(toJson);
}
// Record the team's Emergency Board Call one-line response.
export function postBoardCall(runId, { roundNumber, response, participantId }) {
  return fetch(`${API_BASE}/api/sim2/runs/${runId}/board-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roundNumber, response, participantId }),
  }).then(toJson);
}

// ── display helpers ─────────────────────────────────────────────────────────

// Role codes are kept from v1; only the v2 display names / round ownership change.
// REPORTING_DASHBOARD_ANALYST → Reporting Analyst (R3), PEOPLE_ANALYTICS_ASSOCIATE
// → Dashboard Analyst (R4), AUTOMATION_BI_ASSOCIATE → BI Associate (R5).
// v3 role display names (codes unchanged). R2 owner = Insights & Root-Cause
// Analyst, R3 = Automation Analyst, R4 = Visualization Analyst.
export const ROLE_LABELS = {
  TEAM_LEAD: "Team Lead",
  DATA_QUALITY_ANALYST: "Data Quality Analyst",
  CATEGORY_REGIONAL_ANALYST: "Insights & Root-Cause Analyst",
  REPORTING_DASHBOARD_ANALYST: "Automation Analyst",
  PEOPLE_ANALYTICS_ASSOCIATE: "Visualization Analyst",
  AUTOMATION_BI_ASSOCIATE: "BI Associate",
};

// Role-specific private prompts (v3), shown once after role confirmation.
export const ROLE_PROMPTS = {
  TEAM_LEAD:
    "Your manager won't check anyone's formulas. A wrong number today follows the team into next quarter's review.",
  DATA_QUALITY_ANALYST:
    "Nobody checks your formulas today. Everybody eventually notices a wrong output.",
  CATEGORY_REGIONAL_ANALYST:
    "A plausible explanation and the correct one can both sound convincing. Only the data tells you which.",
  REPORTING_DASHBOARD_ANALYST:
    "A macro that works today and breaks next month is worse than no macro at all.",
  PEOPLE_ANALYTICS_ASSOCIATE:
    "A chart that looks finished isn't the same as one that answers the question asked.",
  AUTOMATION_BI_ASSOCIATE:
    "A tool migration that loses one decimal place is still a loss.",
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
