// API base URL.
// Reads REACT_APP_API_BASE when provided (e.g. in a deployed build) and falls
// back to the local backend for development.
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
export default API_BASE;

// Fire-and-forget wake-up ping for the free-tier backend (Render) and database
// (Neon), both of which sleep when idle. Calling this as early as possible in a
// flow — the context/brief screen — means the backend is usually warm by the
// time the user actually submits "create" or "join", hiding the cold-start wait.
// Guarded so it only fires once per page-load session.
let warmedUp = false;
export function warmup() {
  if (warmedUp) return;
  warmedUp = true;
  fetch(`${API_BASE}/api/teams/00000000-0000-0000-0000-000000000000/roles`).catch(() => {});
}
