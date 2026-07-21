// API base URL.
// Reads REACT_APP_API_BASE when provided (e.g. in a deployed build) and falls
// back to the local backend for development.
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
export default API_BASE;
