import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROLE_LABELS, ROLE_PROMPTS, warmup } from "./api";
import "./sim2.css";

// Content is taken verbatim from the Meridian Retail QBR script (the Prepare tab).
const COMPANY = `Meridian Retail is a fast-growing, privately held omnichannel retail chain headquartered in Hyderabad, with its core store network across South and West India, plus two international, online-only markets in the UAE and Singapore.

The company is preparing for a Series C round, and the Board — a mix of founder-operators and institutional investors — has started asking sharper questions than the internal reporting function is built to answer. Most regional and category reporting has historically been assembled manually, store by store, close to each Board meeting. That worked when the company was smaller. It doesn't anymore.`;

const PROBLEM = `The Board wants a Quarterly Business Review it can trust, filter, and act on — not a static file assembled the night before. The Head of Strategy has been told the current numbers "don't tie out" and has brought in your team as a short-term analytics engagement to fix that before the Board meets.

(The Head of Strategy and "the Board" are NPCs throughout — they send memos and ask questions, but are never played by a student.)`;

// [code, leads, description, skill anchor]
const ROLES = [
  ["TEAM_LEAD", "All rounds", "Coordinates the team and submits each round's file, answer and confidence tag on the team's behalf.", "Insight Communication"],
  ["DATA_QUALITY_ANALYST", "Round 1", "Parses the raw transaction feed and classifies the customer notes, so the numbers can be trusted at all.", "Text & Logical functions"],
  ["CATEGORY_REGIONAL_ANALYST", "Round 2", "Works out which categories are genuinely more profitable, resolving the SKU margin conflict along the way.", "Lookup/Reference, Statistical functions"],
  ["REPORTING_DASHBOARD_ANALYST", "Round 3", "Turns the analysis into the one-page PivotTable/Chart summary the Board can act on.", "Tables, PivotTables & Charts"],
  ["PEOPLE_ANALYTICS_ASSOCIATE", "Round 4", "Adds slicers and a timeline so the Board can filter the dashboard live in the meeting.", "Slicers, Timelines, Dashboard design"],
  ["AUTOMATION_BI_ASSOCIATE", "Round 5", "Ports the model into Power BI or Tableau so it runs live and self-serve.", "Power BI / Tableau"],
];

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

  // Two modes: the welcome landing (no role yet, before joining) and a review of
  // the brief from inside the team room (role known, private brief shown).
  const hasRole = Boolean(role);

  const [tab, setTab] = useState("company");

  // Wake the backend while the brief is being read, so joining feels instant.
  useEffect(() => {
    warmup();
  }, []);

  function onContinue() {
    if (hasRole) {
      navigate(`/sim2/waiting?teamId=${teamId}&participantId=${participantId}&role=${role}`);
    } else {
      navigate("/sim2/join");
    }
  }

  return (
    <div className="sim2">
      <div className="s2-shell">
        <h1>Meridian Retail — Quarterly Business Review</h1>
        <p className="s2-sub">
          {hasRole ? (
            <>
              Read the brief, then continue to the team room. You are the{" "}
              <strong>{ROLE_LABELS[role] || role}</strong>.
            </>
          ) : (
            <>Read the brief, then continue to create or join a team.</>
          )}
        </p>

        {/* your private brief — only once a role is confirmed */}
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
                    <th>Leads</th>
                    <th>What they do</th>
                    <th>Skill anchor</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map(([code, leads, desc, skill]) => (
                    <tr key={code} className={code === role ? "s2-role-you" : ""}>
                      <td>
                        {ROLE_LABELS[code] || code}
                        {code === role ? <span className="s2-sub"> — you</span> : null}
                      </td>
                      <td>
                        <span className="s2-role-badge">{leads}</span>
                      </td>
                      <td>{desc}</td>
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

        <button onClick={onContinue}>
          {hasRole ? "Continue to the team room" : "Continue — create or join a team"}
        </button>
      </div>
    </div>
  );
}
