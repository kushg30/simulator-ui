import { useEffect, useState, useRef, useCallback } from "react";
import API_BASE from "../config";

// The backend returns artifact open/expiry times as naive LocalDateTime strings
// (no timezone), and the server/DB run in UTC. A zone-less datetime is parsed by
// the browser as LOCAL time, which on an IST client lands every artifact ~5.5h in
// the past — so the whole round becomes visible at once. Treat these as UTC.
export function parseServerTime(s) {
  if (!s) return NaN;
  const hasZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(s);
  return new Date(hasZone ? s : `${s}Z`).getTime();
}

// How often we ask the server what this participant can see. Artifacts are authored on whole-minute
// offsets, so a 2s poll puts every drop on screen within two seconds of its scripted time.
const POLL_MS = 2000;

export function useArtifacts(runId, participantId) {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const inFlight = useRef(false);

  // Stable across renders. This used to be re-created every render, which silently broke the caller's
  // `setInterval(..., [refetch])` polling effect: the round screen re-renders once a second for the
  // countdown, so the interval was torn down and rebuilt before it could ever fire. The feed then only
  // moved when the participant reloaded the tab by hand — the T+1 artifact that never arrived.
  const fetchArtifacts = useCallback(async () => {
    if (!runId || !participantId || inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(
        `${API_BASE}/api/runs/${runId}/participants/${participantId}/artifacts`
      );
      if (!res.ok) throw new Error("Failed to fetch artifacts");
      const data = await res.json();
      // The server gates on open time (it will not return an artifact before its scripted minute), so
      // this list IS the visible list. Re-filtering it here against the BROWSER's clock only
      // reintroduced skew: a laptop running a minute fast would hide an artifact the server had
      // already released, and nothing would re-check it.
      setArtifacts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      // Keep the last good feed on screen through a transient blip rather than blanking the round.
      setError(err.message);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [runId, participantId]);

  // Poll on a fixed cadence, plus immediately whenever the tab regains focus (a participant who
  // switched away and back should not have to wait out the interval).
  useEffect(() => {
    if (!runId || !participantId) return;
    setLoading(true);
    fetchArtifacts();

    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchArtifacts();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchArtifacts();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [runId, participantId, fetchArtifacts]);

  return {
    artifacts,
    allArtifacts: artifacts,
    loading,
    error,
    refetch: fetchArtifacts,
  };
}
