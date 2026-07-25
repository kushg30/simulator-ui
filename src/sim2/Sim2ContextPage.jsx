import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROLE_LABELS } from "./api";
import "./sim2.css";

// Content is taken verbatim from the Meridian Retail QBR script (the Prepare tab).
const COMPANY = `Meridian Retail is a fast-growing, privately held omnichannel retail chain headquartered in Hyderabad, with its core store network across South and West India, plus two international, online-only markets in the UAE and Singapore.

The company is preparing for a Series C round, and the Board — a mix of founder-operators and institutional investors — has started asking sharper questions than the internal reporting function is built to answer. Most regional and category reporting has historically been assembled manually, store by store, close to each Board meeting. That worked when the company was smaller. It doesn't anymore.`;

const PROBLEM = `The Board wants a Quarterly Business Review it can trust, filter, and act on — not a static file assembled the night before. The Head of Strategy has been told the current numbers "don't tie out" and has brought in your team as a short-term analytics engagement to fix that before the Board meets.

(The Head of Strategy and "the Board" are NPCs throughout — they send memos and ask questions, but are never played by a student.)`;

const ROLES = [
  ["TEAM_LEAD", "Coordinates every round; submits each round's file, answer and confidence tag", "Insight Communication"],
  ["DATA_QUALITY_ANALYST", "Round 1", "Text & Logical functions"],
  ["CATEGORY_REGIONAL_ANALYST", "Round 2", "Lookup/Reference, Statistical functions"],
  ["REPORTING_DASHBOARD_ANALYST", "Round 3", "Tables, PivotTables/Charts, Slicers"],
  ["PEOPLE_ANALYTICS_ASSOCIATE", "Round 4", "Data Models, DAX"],
  ["AUTOMATION_BI_ASSOCIATE", "Rounds 5–6", "Power BI, VBA/Macros"],
];

// Shown once, privately, after role confirmation and before Round 1.
const ROLE_PROMPTS = {
  TEAM_LEAD: "Your manager won't check your formulas. A wrong number today follows you into next quarter's review.",
  DATA_QUALITY_ANALYST: "Nobody checks your formulas today. Everybody eventually notices a wrong output.",
  CATEGORY_REGIONAL_ANALYST: "Two conflicting numbers can both look authoritative. Only one of you has to decide which.",
  REPORTING_DASHBOARD_ANALYST: "A clean-looking dashboard photographs better than a correct one, and the Board is in the room for four minutes.",
  PEOPLE_ANALYTICS_ASSOCIATE: "A relationship that looks connected in the model isn't the same as one that's correctly joined.",
  AUTOMATION_BI_ASSOCIATE: "A macro that works today and breaks next month is worse than no macro at all.",
};

/**
 * Context / Prepare screen (spec section 1–3). Shown after a participant has a role and before the
 * waiting room: company brief, problem statement, the role structure, and the participant's own
 * private brief.
 */
export default function Sim2ContextPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const teamId = params.get("teamId");
  const participantId = params.get("participantId");
  const role = params.get("role");

  const [tab, setTab] = useState("company");

  function continueToWaiting() {
    navigate(
      `/sim2/waiting?teamId=${teamId}&participantId=${participantId}&role=${role}`
    );
  }

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Meridian Retail — Prepare</h1>
        <p className="s2-sub">
          Read the brief, then continue to the team room. You are the{" "}
          <strong>{ROLE_LABELS[role] || role}</strong>.
        </p>

        {/* your private brief — highlighted */}
        {ROLE_PROMPTS[role] && (
          <div className="s2-card s2-private-brief">
            <div className="s2-ref-section">Your private brief</div>
            <div style={{ lineHeight: 1.6 }}>{ROLE_PROMPTS[role]}</div>
          </div>
        )}

        <div className="s2-card">
          <div className="s2-row" style={{ gap: 8, marginBottom: 12 }}>
            {[
              ["company", "Company brief"],
              ["problem", "Problem statement"],
              ["roles", "Role structure"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? "" : "s2-secondary"}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "company" && <div className="s2-artifact-body">{COMPANY}</div>}
          {tab === "problem" && <div className="s2-artifact-body">{PROBLEM}</div>}
          {tab === "roles" && (
            <div style={{ overflowX: "auto" }}>
              <table className="s2-role-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Owns</th>
                    <th>Skill anchor</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map(([code, owns, skill]) => (
                    <tr key={code} className={code === role ? "s2-role-you" : ""}>
                      <td>
                        {ROLE_LABELS[code] || code}
                        {code === role ? <span className="s2-sub"> — you</span> : null}
                      </td>
                      <td>{owns}</td>
                      <td>{skill}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="s2-sub" style={{ marginTop: 10 }}>
                Discussion is collaborative, but the Team Lead submits each round on the team's behalf.
              </p>
            </div>
          )}
        </div>

        <button onClick={continueToWaiting}>Continue to the team room</button>
      </div>
    </div>
  );
}
