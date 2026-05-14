import { useEffect, useState, useRef } from "react";

export function useArtifacts(runId, participantId) {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timeoutRef = useRef(null);

  const fetchArtifacts = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/runs/${runId}/participants/${participantId}/artifacts`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch artifacts");
      }

      const data = await res.json();
      setArtifacts(data);
      setError(null);

      scheduleNextFetch(data); // 🔥 key part
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Smart scheduling
  const scheduleNextFetch = (data) => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }

  if (!data || data.length === 0) return;

  const now = Date.now();

  // ✅ ONLY future events
  const futureTimes = data.flatMap((a) => {
    const times = [];

    const open = new Date(a.openAt).getTime();
    const expiry = new Date(a.expiresAt).getTime();

    if (open > now) times.push(open);
    if (expiry > now) times.push(expiry);

    return times;
  });

  if (futureTimes.length === 0) return;

  const nextEventTime = Math.min(...futureTimes);

  const delay = Math.max(500, nextEventTime - now + 300);

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

  return { artifacts, loading, error, refetch: fetchArtifacts };
}