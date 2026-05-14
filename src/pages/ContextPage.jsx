import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { simulator1 } from "../data/simulator1";

export default function ContextPage() {
  const [tab, setTab] = useState("company");
  const navigate = useNavigate();

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "auto" }}>

      <h2>{simulator1.title}</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={() => setTab("company")}>Company Brief</button>
        <button onClick={() => setTab("problem")}>Problem Statement</button>
        <button onClick={() => setTab("roles")}>Role Structure</button>
      </div>

      {/* Content */}
      <div style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
        {tab === "company" && simulator1.companyBrief}
        {tab === "problem" && simulator1.problemStatement}
        {tab === "roles" && (
          <>
            {simulator1.roles.map(r => (
              <div key={r}>• {r}</div>
            ))}
          </>
        )}
      </div>

      <button
        style={{ marginTop: "30px" }}
        onClick={() => navigate("/roles")}
      >
        Continue
      </button>
    </div>
  );
}