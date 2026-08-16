import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROLE_LABELS, ROLE_PROMPTS, warmup } from "./api";
import "./sim2.css";

// Content is taken verbatim from Meridian_QBR_Final_v6.docx (the Prepare tab).
const COMPANY = `Meridian Retail is a fast growing, privately held omnichannel retail chain. It is headquartered in Hyderabad. Its core stores are in South and West India. It also has two online only markets, in the UAE and Singapore. Six stores in total.

The Board is a mix of founder operators and institutional investors. Lately their questions have gotten sharper than the company's reporting can answer. Most numbers are still assembled by hand, store by store, in the days before each Board meeting. That worked when Meridian was smaller. Over the next five stages of this engagement, your team will be the ones finding out exactly where that approach breaks down, and what it takes to fix it before the Board notices.`;

const PROBLEM = `At the last Board meeting, the Head of Strategy quoted a revenue number for one of the company's best selling products. A Board member had a different number for the same product, from Finance. Nobody in the room could explain why the two didn't match, or which one to believe.

The Head of Strategy has brought your team in to make sure that never happens again. That starts with a question nobody at Meridian has actually stopped to ask: can any of this data be trusted in the first place? What you find out over the next five stages will decide what your team ultimately tells the Board.`;

// [code, ownsRound, roleDefinition] — v6 (team of 5)
const ROLES = [
  ["TEAM_LEAD", "Round 5 · Final", "Coordinates the team across every stage, and presents the team's final findings and recommendation to the Board."],
  ["DATA_QUALITY_ANALYST", "Round 1", "Checks whether raw data can be trusted before anyone builds on it, and spots the specific ways it's broken."],
  ["CATEGORY_REGIONAL_ANALYST", "Round 2", "Investigates a performance problem and identifies the most defensible cause, backed by a specific number, not a guess."],
  ["REPORTING_DASHBOARD_ANALYST", "Round 3", "Turns a manual, repeatable task into something that doesn't have to be rebuilt by hand every time."],
  ["PEOPLE_ANALYTICS_ASSOCIATE", "Round 4", "Turns analyzed data into a visual that a non-technical audience can understand at a glance."],
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
                    <th>Deliverable</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map(([code, leads, desc]) => (
                    <tr key={code} className={code === role ? "s2-role-you" : ""}>
                      <td>
                        {ROLE_LABELS[code] || code}
                        {code === role ? <span className="s2-sub"> — you</span> : null}
                      </td>
                      <td>
                        <span className="s2-role-badge">{leads}</span>
                      </td>
                      <td>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="s2-sub" style={{ marginTop: 10 }}>
                Discussion is collaborative, but the role that owns a round is the only one who submits
                it — every other member's screen is read-only during that round.
              </p>
            </div>
          )}
        </div>

        <div className="s2-row" style={{ justifyContent: "flex-end" }}>
          <button onClick={onContinue}>
            {hasRole ? "Continue to the team room" : "Create or Join a team"}
          </button>
        </div>
      </div>
    </div>
  );
}
