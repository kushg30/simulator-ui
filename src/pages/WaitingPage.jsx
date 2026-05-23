import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API_BASE from "../config";

export default function WaitingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const teamId = searchParams.get("teamId");
  const participantId = searchParams.get("participantId");
  const role = searchParams.get("role");

  const [participants, setParticipants] = useState([]);

  // 🔁 Fetch participants
  const fetchParticipants = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/teams/${teamId}/participants`
      );

      if (!res.ok) return;

      const data = await res.json();
      setParticipants(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔁 Fetch run
  const fetchRun = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/runs/team/${teamId}`
      );

      if (!res.ok) return;

      const data = await res.json();

      if (data && (data.runId || data.run_id)) {
            const runId = data.runId || data.run_id;
            console.log("RUN DETECTED:", runId); 
            navigate(
                `/simulation?runId=${runId}&participantId=${participantId}&role=${role}`
            );
        }
    } catch (err) {
      console.error(err);
    }
  };

  // 🔁 Polling
  useEffect(() => {
    const poll = async () => {
      await Promise.all([fetchParticipants(), fetchRun()]);
    };

    poll();

    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚫 Guard
  if (!teamId || !participantId) {
    return <div style={{ padding: "20px" }}>Invalid session</div>;
  }

  // 🔥 Role completion check
  const allAssigned =
    participants.length > 0 &&
    participants.every((p) => p.role !== null);

  const handleStart = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/runs/start/${teamId}`,
        { method: "POST" }
      );

      if (!res.ok) {
      const text = await res.text();
      console.error("Start failed:", text);
      alert("Failed to start simulation");
    }

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        fontFamily: "Arial",
        padding: "20px"
      }}
    >
      <h2>Waiting Room</h2>

      <p style={{ fontSize: "12px", color: "#666" }}>
        Team ID: {teamId}
      </p>

      <p>
        {participants.filter((p) => p.role).length} /{" "}
        {participants.length} ready
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px"
        }}
      >
        {participants.map((p) => (
          <div
            key={p.participantId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0"
            }}
          >
            <span>{p.name}</span>

            <span
              style={{
                color: p.role ? "green" : "#999",
                fontWeight: 500
              }}
            >
              {p.role ? p.role : "Waiting..."}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        {role === "CEO" ? (
          <button
            disabled={!allAssigned}
            onClick={handleStart}
            style={{
              padding: "10px 20px",
              background: allAssigned ? "#2563eb" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: allAssigned ? "pointer" : "not-allowed"
            }}
          >
            Start Simulation
          </button>
        ) : (
          <p style={{ color: "#666" }}>
            Waiting for CEO to start simulation...
          </p>
        )}
      </div>
    </div>
  );
}