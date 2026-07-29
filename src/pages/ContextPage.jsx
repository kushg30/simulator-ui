import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { simulator1 } from "../data/simulator1";
import { warmup } from "../config";
import "../ContextPage.css";

const TABS = [
  { id: "company",  label: "Company Brief",      icon: "🏛️" },
  { id: "problem",  label: "Problem Statement",  icon: "🔍" },
  { id: "roles",    label: "Role Structure",      icon: "👥" },
];

export default function ContextPage() {
  const [tab, setTab] = useState("company");
  const navigate = useNavigate();

  // Wake the backend while the brief is being read, so creating/joining is instant.
  useEffect(() => {
    warmup();
  }, []);

  return (
    <div className="context-page">

      {/* ── Background ── */}
      <div className="context-bg">
        <div className="context-grid" />
        <div className="context-orb orb1" />
        <div className="context-orb orb2" />
      </div>

      {/* ── Logo ── */}
      <div className="context-logo">
        <span className="logo-biz">CASE</span>
        <span className="logo-sim">RUN</span>
      </div>

      {/* ── Card ── */}
      <div className="context-card">

        {/* Header */}
        <div className="context-header">
          <div className="context-eyebrow">Simulation Briefing</div>
          <h1 className="context-title">{simulator1.title}</h1>
          <p className="context-subtitle">
            Read the briefing carefully before entering the simulation.
            Each tab contains critical context for your role.
          </p>
        </div>

        {/* Tabs */}
        <div className="context-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              <span className="ctx-tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="context-content">

          {tab === "company" && (
            <div className="ctx-section fade-in">
              <div className="ctx-section-label">Company Overview</div>
              <div className="ctx-body">
                {simulator1.companyBrief.trim().split("\n\n").map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            </div>
          )}

          {tab === "problem" && (
            <div className="ctx-section fade-in">
              <div className="ctx-section-label">Situation</div>
              <div className="ctx-body">
                {simulator1.problemStatement.trim().split("\n\n").map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            </div>
          )}

          {tab === "roles" && (
            <div className="ctx-section fade-in">
              <div className="ctx-section-label">Leadership Team</div>
              <div className="ctx-roles-grid">
                {simulator1.roles.map((role) => (
                  <div key={role} className="ctx-role-card">
                    <div className="ctx-role-name">{role}</div>
                    {simulator1.roleDescriptions?.[role] && (
                      <div className="ctx-role-desc">
                        {simulator1.roleDescriptions[role]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="context-footer">
          <div className="context-footer-note">
            <span className="footer-dot" />
            Next, create or join your team. Your private role brief appears once
            you enter the simulation.
          </div>
          <button
            className="btn-enter"
            onClick={() => navigate("/teamjoin")}
          >
            Continue — create or join a team
            <span className="btn-arrow">→</span>
          </button>
        </div>

      </div>
    </div>
  );
}
