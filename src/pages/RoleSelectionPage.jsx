import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function RoleSelectionPage() {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamId = searchParams.get("teamId");
  const participantId = searchParams.get("participantId");

  const [roles, setRoles] = useState({});

  const ALL_ROLES = [
    "CEO", "CFO", "HEAD_OF_ENGINEERING",
    "PRODUCT", "OPERATIONS", "CHRO"
  ];

  // 🔁 Fetch roles
  const fetchRoles = async () => {
    const res = await fetch(
      `http://localhost:8080/api/teams/${teamId}/roles`
    );
    const data = await res.json();
    setRoles(data);
  };

  // 🔁 Polling
  useEffect(() => {
    fetchRoles();

    const interval = setInterval(fetchRoles, 2000);
    return () => clearInterval(interval);
  }, [teamId]);

  // 🔥 Assign role
  const handleSelect = async (role) => {
  if (roles[role]) return;

  await fetch(
    `http://localhost:8080/api/teams/${teamId}/assign-role`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId,
        role
      })
    }
  );

  // 🔥 move forward after selecting role
  navigate(
    `/waiting?teamId=${teamId}&participantId=${participantId}&role=${role}`
  );
};

  return (
    <div style={{ padding: "30px" }}>
      <h2>Select Role</h2>

      {ALL_ROLES.map((role) => {
        const takenBy = roles[role];

        return (
          <div
            key={role}
            onClick={() => handleSelect(role)}
            style={{
              padding: "10px",
              margin: "8px 0",
              border: "1px solid #ccc",
              background: takenBy ? "#eee" : "#fff",
              cursor: takenBy ? "not-allowed" : "pointer"
            }}
          >
            {role}
            {takenBy && (
              <span style={{ marginLeft: "10px", color: "red" }}>
                (Taken)
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}