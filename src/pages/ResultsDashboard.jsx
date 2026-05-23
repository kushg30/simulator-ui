// src/simulation/ResultsDashboard.jsx
import { useState, useEffect } from "react";
import "../ResultsDashboard.css";
import API_BASE from "../config";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSTRUCT_META = {
  stakeholder_trust: {
    label:       "Stakeholder Trust",
    description: "How well leadership maintained trust with key internal and external stakeholders.",
    icon:        "🤝",
    highIsGood:  true,
  },
  organizational_risk: {
    label:       "Organizational Risk",
    description: "The degree of systemic risk accumulated through decisions and inaction.",
    icon:        "⚠️",
    highIsGood:  false,
  },
  ethical_exposure: {
    label:       "Ethical Exposure",
    description: "The extent to which decisions created ethical blind spots or accountability gaps.",
    icon:        "⚖️",
    highIsGood:  false,
  },
  execution_quality: {
    label:       "Execution Quality",
    description: "The coherence and timeliness of decisions relative to the information available.",
    icon:        "⚡",
    highIsGood:  true,
  },
};

// 0–100 → Low / Medium / High
function toBand(value) {
  if (value >= 67) return "High";
  if (value >= 34) return "Medium";
  return "Low";
}

// Band → colour token
function bandColor(band, highIsGood) {
  if (band === "High") return highIsGood ? "green"  : "red";
  if (band === "Low")  return highIsGood ? "red"    : "green";
  return "amber"; // Medium always amber
}

// Build label shown in the pill
function bandLabel(band, highIsGood) {
  return band; // always "Low" / "Medium" / "High"
}

// ─── Construct Card ───────────────────────────────────────────────────────────

function ConstructCard({ constructKey, value, animate }) {
  const meta  = CONSTRUCT_META[constructKey] || { label: constructKey, description: "", icon: "📊", highIsGood: true };
  const band  = toBand(value);
  const color = bandColor(band, meta.highIsGood);

  return (
    <div className={`construct-card ${animate ? "animate-in" : ""}`}>
      <div className="construct-icon">{meta.icon}</div>
      <div className="construct-body">
        <div className="construct-label">{meta.label}</div>
        <div className="construct-desc">{meta.description}</div>
      </div>
      <div className={`construct-band band-${color}`}>{band}</div>
    </div>
  );
}

// ─── Team Construct Row ───────────────────────────────────────────────────────

function TeamConstructRow({ constructKey, value }) {
  const meta  = CONSTRUCT_META[constructKey] || { label: constructKey, highIsGood: true };
  const band  = toBand(value);
  const color = bandColor(band, meta.highIsGood);

  return (
    <div className="team-row">
      <div className="team-row-label">{meta.label}</div>
      <div className="team-row-bar-wrap">
        <div
          className={`team-row-bar bar-${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className={`team-row-band band-${color}`}>{band}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsDashboard({ runId, participantId, role, onContinue }) {
  const [tab,            setTab]            = useState("individual");
  const [individualData, setIndividualData] = useState(null);
  const [teamData,       setTeamData]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [animated,       setAnimated]       = useState(false);

  // ── Fetch both endpoints in parallel ────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [indRes, teamRes] = await Promise.all([
          fetch(`${API_BASE}/api/runs/${runId}/participants/${participantId}/results`),
          fetch(`${API_BASE}/api/runs/${runId}/team-results`),
        ]);

        if (!indRes.ok || !teamRes.ok) throw new Error("Failed to load results");

        const indJson  = await indRes.json();
        const teamJson = await teamRes.json();

        // Convert [[name, value], ...] → { name: value, ... }
        setIndividualData(Object.fromEntries(indJson));
        setTeamData(Object.fromEntries(teamJson));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setTimeout(() => setAnimated(true), 100);
      }
    };

    fetchAll();
  }, [runId, participantId]);

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="results-page">
        <div className="results-loading">
          <span className="results-loading-dot" />
          Computing results…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <div className="results-error">Failed to load results: {error}</div>
      </div>
    );
  }

  const constructs = Object.keys(CONSTRUCT_META);

  return (
    <div className="results-page">

      {/* ── Header ── */}
      <div className="results-header">
        <div className="results-header-left">
          <div className="results-eyebrow">Round 1 Complete</div>
          <h1 className="results-title">Leadership Assessment</h1>
          <div className="results-meta">
            Role: <span className="results-role">{role}</span>
          </div>
        </div>

        <div className="results-header-right">
          <div className="results-round-badge">R1</div>
        </div>
      </div>

      {/* ── Tab toggle ── */}
      <div className="results-tabs">
        <button
          className={tab === "individual" ? "active" : ""}
          onClick={() => setTab("individual")}
        >
          My Results
        </button>
        <button
          className={tab === "team" ? "active" : ""}
          onClick={() => setTab("team")}
        >
          Team Results
        </button>
      </div>

      {/* ── Individual view ── */}
      {tab === "individual" && individualData && (
        <div className="results-section">
          <div className="results-section-header">
            <span className="results-section-label">Construct Scores</span>
            <span className="results-section-note">Scores reflect your decisions only — not shared with team</span>
          </div>

          <div className="construct-list">
            {constructs.map((key, i) => (
              <ConstructCard
                key={key}
                constructKey={key}
                value={individualData[key] ?? 50}
                animate={animated}
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>

          {/* Disclaimer */}
          <div className="results-disclaimer">
            <span className="disclaimer-icon">ℹ</span>
            Scores reflect accumulated decision effects across Round 1.
            Numerical values are not disclosed — only qualitative bands are shown.
          </div>
        </div>
      )}

      {/* ── Team view ── */}
      {tab === "team" && teamData && (
        <div className="results-section">
          <div className="results-section-header">
            <span className="results-section-label">Team Aggregates</span>
            <span className="results-section-note">Averaged across all roles in your group</span>
          </div>

          <div className="team-construct-list">
            {constructs.map((key) => (
              <TeamConstructRow
                key={key}
                constructKey={key}
                value={teamData[key] ?? 50}
              />
            ))}
          </div>

          <div className="results-disclaimer">
            <span className="disclaimer-icon">ℹ</span>
            Team scores represent the aggregate effect of all role decisions.
            Individual scores are not visible to other participants.
          </div>
        </div>
      )}

      {/* ── Continue button ── */}
      {onContinue && (
        <div className="results-footer">
          <button className="btn-continue" onClick={onContinue}>
            Proceed to Round 2 →
          </button>
        </div>
      )}

    </div>
  );
}
