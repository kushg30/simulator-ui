import { useEffect, useState, useRef } from "react";
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

export function useArtifacts(runId, participantId) {
  const [artifacts, setArtifacts] = useState([]);
  const [visibleArtifacts, setVisibleArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timeoutRef = useRef(null);

  const updateVisibleArtifacts = (data) => {
    const now = Date.now();

    const visible = data.filter((a) => {
      const open = parseServerTime(a.openAt);
      return open <= now;
    });

    setVisibleArtifacts(visible);
  };

  const fetchArtifacts = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/runs/${runId}/participants/${participantId}/artifacts`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch artifacts");
      }

      const data = await res.json();

      setArtifacts(data);

      updateVisibleArtifacts(data);

      setError(null);

      scheduleNextFetch(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scheduleNextFetch = (data) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!data || data.length === 0) return;

    const now = Date.now();

    const futureTimes = data.flatMap((a) => {
      const times = [];

      const open = parseServerTime(a.openAt);
      const expiry = parseServerTime(a.expiresAt);

      if (open > now) times.push(open);
      if (expiry > now) times.push(expiry);

      return times;
    });

    if (futureTimes.length === 0) return;

    const nextEventTime = Math.min(...futureTimes);

    const delay = Math.max(500, nextEventTime - now + 1000);

    timeoutRef.current = setTimeout(() => {
      fetchArtifacts();
    }, delay);
  };

  useEffect(() => {
    if (runId && participantId) {
      setLoading(true);
      fetchArtifacts();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [runId, participantId]);

  return {
    artifacts: visibleArtifacts,
    allArtifacts: artifacts,
    loading,
    error,
    refetch: fetchArtifacts,
  };
}