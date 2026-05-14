import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TeamJoinPage() {
  const [teamName, setTeamName] = useState("");
  const [createName, setCreateName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinTeamId, setJoinTeamId] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 🔵 CREATE TEAM
  const handleCreate = async () => {
    if (!teamName || !createName) return;

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          teamName,
          participantName: createName
        })
      });

      if (!res.ok) {
        console.error("Create team failed");
        return;
      }

      const data = await res.json();

      navigate(
        `/waiting?teamId=${data.teamId}&participantId=${data.participantId}&role=CEO`
        );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 JOIN TEAM
  const handleJoin = async () => {
    if (!joinTeamId || !joinName) return;

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:8080/api/teams/${joinTeamId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            participantName: joinName
          })
        }
      );

      if (!res.ok) {
        console.error("Join team failed");
        return;
      }

      const data = await res.json();

      navigate(
        `/role-selection?teamId=${joinTeamId}&participantId=${data.participantId}`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      <h2>Create Team</h2>

      <input
        placeholder="Team Name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        style={{ width: "100%", marginBottom: "8px", padding: "8px" }}
      />

      <input
        placeholder="Your Name"
        value={createName}
        onChange={(e) => setCreateName(e.target.value)}
        style={{ width: "100%", marginBottom: "8px", padding: "8px" }}
      />

      <button
        onClick={handleCreate}
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Creating..." : "Create Team"}
      </button>

      <hr style={{ margin: "30px 0" }} />

      <h2>Join Team</h2>

      <input
        placeholder="Team ID"
        value={joinTeamId}
        onChange={(e) => setJoinTeamId(e.target.value)}
        style={{ width: "100%", marginBottom: "8px", padding: "8px" }}
      />

      <input
        placeholder="Your Name"
        value={joinName}
        onChange={(e) => setJoinName(e.target.value)}
        style={{ width: "100%", marginBottom: "8px", padding: "8px" }}
      />

      <button
        onClick={handleJoin}
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: "#16a34a",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Joining..." : "Join Team"}
      </button>
    </div>
  );
}