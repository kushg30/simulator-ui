// src/pages/ResultsDashboard.jsx
// LJS Round 1 Analytics Dashboard — Faculty Debrief Tool
// Spec: LJS_Dashboard_Spec_Part1 + Part2
// Step 1+2: Scaffold, lock screen, all reusable components, 4 views with mock data

import { useState, useEffect } from "react";
import "./ResultsDashboard.css";

// ─────────────────────────────────────────────────────────────
// MOCK DATA — replace with real API calls when backend is ready
// ─────────────────────────────────────────────────────────────
const MOCK_SESSION = {
  runId: "b863544b-ff4f-47dd-a7aa-ce23657b098b",
  teamCount: 4,
  roleCount: 24,
  decisionsLogged: 87,
  computedAt: "14:32",
  roundComplete: true, // set false to see lock screen
};

const MOCK_TEAMS = [
  {
    teamId: "t1", teamName: "Team Alpha",
    constructs: {
      signal_legitimization: { level: "Low",    score: 28 },
      silence_accumulation:  { level: "High",   score: 74 },
      framing_commitment:    { level: "High",   score: 71 },
      authority_centralization: { level: "Medium", score: 55 },
      option_space_contraction: { level: "High",  score: 68 },
    },
    timing: { early: 20, moderate: 35, delayed: 45 },
    riskR2: "High",
  },
  {
    teamId: "t2", teamName: "Team Beta",
    constructs: {
      signal_legitimization: { level: "Medium", score: 52 },
      silence_accumulation:  { level: "Medium", score: 48 },
      framing_commitment:    { level: "Low",    score: 31 },
      authority_centralization: { level: "Low",   score: 29 },
      option_space_contraction: { level: "Medium", score: 44 },
    },
    timing: { early: 55, moderate: 30, delayed: 15 },
    riskR2: "Medium",
  },
  {
    teamId: "t3", teamName: "Team Gamma",
    constructs: {
      signal_legitimization: { level: "High",   score: 79 },
      silence_accumulation:  { level: "Low",    score: 22 },
      framing_commitment:    { level: "Low",    score: 26 },
      authority_centralization: { level: "Low",   score: 24 },
      option_space_contraction: { level: "Low",   score: 19 },
    },
    timing: { early: 70, moderate: 22, delayed: 8 },
    riskR2: "Low",
  },
  {
    teamId: "t4", teamName: "Team Delta",
    constructs: {
      signal_legitimization: { level: "Low",    score: 31 },
      silence_accumulation:  { level: "High",   score: 66 },
      framing_commitment:    { level: "Medium", score: 58 },
      authority_centralization: { level: "High",  score: 72 },
      option_space_contraction: { level: "Medium", score: 53 },
    },
    timing: { early: 15, moderate: 42, delayed: 43 },
    riskR2: "High",
  },
];

const MOCK_STUDENTS = [
  { name: "Arjun M.",   role: "CEO",         teamId: "t1", constructs: { signal_legitimization: { level: "Low" }, silence_accumulation: { level: "High" }, framing_commitment: { level: "High" }, option_space_contraction: { level: "High" } } },
  { name: "Priya K.",   role: "CFO",         teamId: "t1", constructs: { signal_legitimization: { level: "Medium" }, silence_accumulation: { level: "Medium" }, framing_commitment: { level: "High" }, option_space_contraction: { level: "Medium" } } },
  { name: "Rahul S.",   role: "CHRO",        teamId: "t1", constructs: { signal_legitimization: { level: "Low" }, silence_accumulation: { level: "High" }, framing_commitment: { level: "Medium" }, option_space_contraction: { level: "High" } } },
  { name: "Meera T.",   role: "Engineering", teamId: "t1", constructs: { signal_legitimization: { level: "Low" }, silence_accumulation: { level: "High" }, framing_commitment: { level: "Low" }, option_space_contraction: { level: "Medium" } } },
  { name: "Vikram N.",  role: "Operations",  teamId: "t2", constructs: { signal_legitimization: { level: "High" }, silence_accumulation: { level: "Low" }, framing_commitment: { level: "Low" }, option_space_contraction: { level: "Low" } } },
  { name: "Anjali R.",  role: "Product",     teamId: "t2", constructs: { signal_legitimization: { level: "Medium" }, silence_accumulation: { level: "Medium" }, framing_commitment: { level: "Medium" }, option_space_contraction: { level: "Medium" } } },
];

const MOCK_INSIGHTS = [
  { tier: 1, text: "75% of teams normalised weak signals before escalation became organisationally legitimate.", icon: "📊" },
  { tier: 2, text: "Teams with High Framing Commitment showed reduced escalation visibility in later rounds.", icon: "🔗" },
  { tier: 3, text: "CEO early framing explained 51% of option space contraction variance across teams.", icon: "👤" },
  { tier: 4, text: "1 of 4 teams had a non-CEO role attempt counter-framing before T+15. That team showed lower Silence Accumulation than session average.", icon: "💡" },
];

const DEBRIEF_PROMPT = "Which role in your team saw the signal most clearly? What stopped that from changing the team's framing?";

// ─────────────────────────────────────────────────────────────
// CONSTRUCT METADATA
// ─────────────────────────────────────────────────────────────
const CONSTRUCTS = [
  { key: "signal_legitimization",    label: "Early Signal Legitimization" },
  { key: "silence_accumulation",     label: "Silence Accumulation"        },
  { key: "framing_commitment",       label: "Framing Commitment"          },
  { key: "authority_centralization", label: "Authority Centralization"    },
  { key: "option_space_contraction", label: "Option Space Contraction"    },
];

// From spec lookup table 6.1
const DOMINANT_PATTERNS = {
  t1: "Early normalisation under growth pressure",
  t2: "Deliberate ambiguity preserved",
  t3: "Active sensemaking, distributed",
  t4: "Deference cascade",
};

// From spec lookup table 6.2
const BAR_DESCRIPTIONS = {
  signal_legitimization: {
    Low:    "Signals treated as edge-case noise; no organisational attention initiated",
    Medium: "Signals acknowledged but not formally elevated",
    High:   "Signals surfaced and treated as worthy of structured attention",
  },
  silence_accumulation: {
    Low:    "Most roles engaged explicitly; implicit non-decisions were rare",
    Medium: "Some roles deferred; implicit silence contributed to the pattern",
    High:   "Multiple implicit non-decisions compounded across roles and time windows",
  },
  framing_commitment: {
    Low:    "Multiple interpretations held open; no single narrative locked in",
    Medium: "CEO framing partially adopted; some counter-narrative present",
    High:   "Early framing became fixed; alternative interpretations were not revisited",
  },
  authority_centralization: {
    Low:    "Judgment distributed; multiple roles contributed signal",
    Medium: "CEO bearing elevated interpretive weight; partial role deference present",
    High:   "Judgment effectively collapsed to CEO; other roles primarily deferring",
  },
  option_space_contraction: {
    Low:    "Most escalation and reframing paths remain available entering Round 2",
    Medium: "Some response options foreclosed; bounded choices available",
    High:   "Few viable escalation or reframing paths remain; Round 2 severely constrained",
  },
};

// ─────────────────────────────────────────────────────────────
// 7.1 LMH INDICATOR — fundamental unit of the dashboard
// ─────────────────────────────────────────────────────────────
function LMHIndicator({ level }) {
  if (!level) return <span className="lmh-empty">—</span>;
  return (
    <span className={`lmh-indicator lmh-${level.toLowerCase()}`}>
      <span className="lmh-dot" />
      <span className="lmh-label">{level}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 7.3 HEATMAP CELL — used in View 2 and View 4
// ─────────────────────────────────────────────────────────────
function HeatmapCell({ level }) {
  if (!level) return <td className="heatmap-cell heatmap-empty">—</td>;
  return (
    <td className={`heatmap-cell heatmap-${level.toLowerCase()}`}>
      {level}
    </td>
  );
}

// ─────────────────────────────────────────────────────────────
// 7.5 PATTERN CHIP — used in View 2 and View 3
// ─────────────────────────────────────────────────────────────
function PatternChip({ pattern }) {
  const text = pattern || "Pattern under analysis";
  return (
    <span className="pattern-chip" title={text}>
      <em>{text}</em>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 7.2 CONSTRUCT BAR — used in View 3 (Team Detail)
// ─────────────────────────────────────────────────────────────
function ConstructBar({ constructKey, label, level, score }) {
  const desc = BAR_DESCRIPTIONS[constructKey]?.[level] || "";
  return (
    <div className="construct-bar-row">
      <div className="construct-bar-header">
        <span className="construct-bar-name">{label}</span>
        <LMHIndicator level={level} />
      </div>
      <div className="construct-bar-track">
        <div
          className={`construct-bar-fill fill-${level?.toLowerCase()}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="construct-bar-desc">{desc}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7.4 TIMING STRIP — used in View 3 (Team Detail)
// ─────────────────────────────────────────────────────────────
function TimingStrip({ early, moderate, delayed }) {
  return (
    <div className="timing-strip-wrap">
      <div className="timing-strip">
        <div className="timing-seg timing-early"    style={{ width: `${early}%` }}    />
        <div className="timing-seg timing-moderate" style={{ width: `${moderate}%` }} />
        <div className="timing-seg timing-delayed"  style={{ width: `${delayed}%` }}  />
      </div>
      <div className="timing-labels">
        <span className="timing-label-early">Early (T+0–10) · {early}%</span>
        <span className="timing-label-moderate">Moderate · {moderate}%</span>
        <span className="timing-label-delayed">Delayed (T+21–30) · {delayed}%</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7.6 INSIGHT CARD — used in View 1
// ─────────────────────────────────────────────────────────────
function InsightCard({ insight, isLast }) {
  const tierClass = { 1: "amber", 2: "red", 3: "blue", 4: "green" }[insight.tier];
  return (
    <div className={`insight-card ${insight.tier === 4 ? "insight-counter" : ""} ${isLast ? "insight-last" : ""}`}>
      <div className={`insight-icon icon-${tierClass}`}>{insight.icon}</div>
      <p className="insight-text">{insight.text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7.7 DEBRIEF PROMPT — used in View 1
// ─────────────────────────────────────────────────────────────
function DebriefPrompt({ prompt }) {
  return (
    <div className="debrief-prompt-wrap">
      <div className="debrief-prompt-label">Suggested opening question</div>
      <div className="debrief-prompt-box">
        <em>"{prompt}"</em>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7.8 WARNING BANNER — used in View 4 only
// ─────────────────────────────────────────────────────────────
function WarningBanner() {
  return (
    <div className="warning-banner">
      ⚠ This view shows individual student data. Do not project publicly during a debrief.
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7.10 ROLE BADGE — used in View 4
// ─────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  return <span className="role-badge">{role}</span>;
}

// ─────────────────────────────────────────────────────────────
// 7.9 DASHBOARD LOCK SCREEN
// ─────────────────────────────────────────────────────────────
function LockScreen({ session }) {
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="lock-screen">
      <div className="lock-icon">🔒</div>
      <h2 className="lock-title">Round 1 in progress</h2>
      <p className="lock-subtitle">The dashboard will unlock automatically when all teams submit their Round 1 decision.</p>
      <div className="lock-stats">
        <div className="lock-stat">
          <div className="lock-stat-value">{elapsed}</div>
          <div className="lock-stat-label">Time Elapsed</div>
        </div>
        <div className="lock-stat">
          <div className="lock-stat-value">2 of 4</div>
          <div className="lock-stat-label">Teams Submitted</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 1: CLASS INSIGHTS (default landing)
// ─────────────────────────────────────────────────────────────
function ViewClassInsights({ session, insights, prompt }) {
  return (
    <div className="view-content">
      {/* Session summary line */}
      <div className="session-summary">
        {session.teamCount} teams · {session.roleCount} roles · {session.decisionsLogged} decisions logged
      </div>

      {/* Insight cards */}
      <div className="insight-list">
        {insights.length === 0 ? (
          <p className="insights-placeholder">
            Insights will appear once at least 3 teams have completed Round 1.
          </p>
        ) : (
          insights.map((ins, i) => (
            <InsightCard
              key={i}
              insight={ins}
              isLast={i === insights.length - 1}
            />
          ))
        )}
      </div>

      {/* Debrief prompt */}
      <DebriefPrompt prompt={prompt} />

      {/* Legend — mandatory per spec */}
      <div className="dashboard-legend">
        Colour shows intensity, not quality — High is not bad, Low is not good.
      </div>

      {/* Computed at */}
      <div className="computed-at">Computed at {session.computedAt}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 2: TEAM COMPARISON
// ─────────────────────────────────────────────────────────────
function ViewTeamComparison({ teams, onSelectTeam }) {
  const [sortCol, setSortCol] = useState("teamName");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  };

  const sorted = [...teams].sort((a, b) => {
    if (sortCol === "teamName") {
      return sortAsc
        ? a.teamName.localeCompare(b.teamName)
        : b.teamName.localeCompare(a.teamName);
    }
    return 0;
  });

  const cols = [
    { key: "signal_legitimization",    label: "Signal Legitim." },
    { key: "silence_accumulation",     label: "Silence"         },
    { key: "framing_commitment",       label: "Framing Commit." },
    { key: "authority_centralization", label: "Authority Central." },
    { key: "option_space_contraction", label: "Option Space"    },
  ];

  return (
    <div className="view-content">
      <div className="table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("teamName")} className="th-sortable">
                Team {sortCol === "teamName" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              {cols.map(c => <th key={c.key}>{c.label}</th>)}
              <th>Dominant Pattern</th>
              <th>Risk → R2</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(team => (
              <tr
                key={team.teamId}
                className="team-row"
                onClick={() => onSelectTeam(team.teamId)}
              >
                <td className="td-team-name">
                  {team.teamName}
                  <span className="row-arrow">→</span>
                </td>
                {cols.map(c => (
                  <HeatmapCell
                    key={c.key}
                    level={team.constructs[c.key]?.level}
                  />
                ))}
                <td className="td-pattern">
                  <PatternChip pattern={DOMINANT_PATTERNS[team.teamId]} />
                </td>
                <HeatmapCell level={team.riskR2} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dashboard-legend">
        Colour shows intensity, not quality — High is not bad, Low is not good.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 3: TEAM DETAIL
// ─────────────────────────────────────────────────────────────
function ViewTeamDetail({ teams, selectedTeamId, onSelectTeam }) {
  const idx  = teams.findIndex(t => t.teamId === selectedTeamId);
  const team = teams[idx];
  const prev = idx > 0 ? teams[idx - 1] : null;
  const next = idx < teams.length - 1 ? teams[idx + 1] : null;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft"  && prev) onSelectTeam(prev.teamId);
      if (e.key === "ArrowRight" && next) onSelectTeam(next.teamId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onSelectTeam]);

  if (!team) return <div className="view-content">Select a team from the Team Comparison view.</div>;

  return (
    <div className="view-content">
      {/* Navigation */}
      <div className="team-detail-nav">
        <button
          className="team-nav-btn"
          onClick={() => prev && onSelectTeam(prev.teamId)}
          disabled={!prev}
        >
          ← {prev?.teamName || ""}
        </button>
        <h2 className="team-detail-name">{team.teamName}</h2>
        <button
          className="team-nav-btn"
          onClick={() => next && onSelectTeam(next.teamId)}
          disabled={!next}
        >
          {next?.teamName || ""} →
        </button>
      </div>

      {/* Construct bars — in spec order */}
      <div className="construct-bars-section">
        {CONSTRUCTS.map(c => (
          <ConstructBar
            key={c.key}
            constructKey={c.key}
            label={c.label}
            level={team.constructs[c.key]?.level}
            score={team.constructs[c.key]?.score || 0}
          />
        ))}
      </div>

      {/* Decision timing strip */}
      <div className="section-label">Decision Timing Distribution</div>
      <TimingStrip
        early={team.timing.early}
        moderate={team.timing.moderate}
        delayed={team.timing.delayed}
      />

      {/* Dominant pattern */}
      <div className="dominant-pattern-row">
        <span className="dominant-pattern-label">Dominant pattern</span>
        <PatternChip pattern={DOMINANT_PATTERNS[team.teamId]} />
      </div>

      <div className="dashboard-legend">
        Colour shows intensity, not quality — High is not bad, Low is not good.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 4: STUDENT VIEW (faculty-private)
// ─────────────────────────────────────────────────────────────
function ViewStudentView({ students, teams }) {
  // Group students by team
  const byTeam = teams.map(team => ({
    ...team,
    students: students.filter(s => s.teamId === team.teamId),
  }));

  const studentCols = [
    { key: "signal_legitimization",    label: "Signal Legitim." },
    { key: "silence_accumulation",     label: "Silence"         },
    { key: "framing_commitment",       label: "Framing Commit." },
    // Authority Centralization intentionally excluded per spec §4.4
    { key: "option_space_contraction", label: "Option Space"    },
  ];

  return (
    <div className="view-content view-student">
      {/* Non-dismissible warning banner — mandatory per spec §7.8 */}
      <WarningBanner />

      {byTeam.map(team => (
        <div key={team.teamId} className="student-team-section">
          <div className="student-team-name">{team.teamName}</div>
          <table className="student-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Role</th>
                {studentCols.map(c => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {team.students.length === 0 ? (
                <tr><td colSpan={6} className="td-empty">No student data available</td></tr>
              ) : (
                team.students.map((s, i) => (
                  <tr key={i}>
                    <td className="td-name">{s.name}</td>
                    <td><RoleBadge role={s.role} /></td>
                    {studentCols.map(c => (
                      <HeatmapCell key={c.key} level={s.constructs[c.key]?.level} />
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Outlier annotation placeholder — §7.11 */}
          {team.students.length > 0 && (
            <div className="outlier-note">
              <em>Arjun M. (CEO) showed a notably different pattern on Silence Accumulation — potential discussion anchor for role-specific accountability.</em>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "insights",   label: "Class Insights"   },
  { id: "comparison", label: "Team Comparison"  },
  { id: "detail",     label: "Team Detail"      },
  { id: "students",   label: "Student View"     },
];

export default function ResultsDashboard({ runId, participantId, role }) {
  const [activeTab,    setActiveTab]    = useState("insights");
  const [selectedTeam, setSelectedTeam] = useState(MOCK_TEAMS[0]?.teamId);

  // When clicking a team in View 2 → navigate to View 3
  const handleSelectTeam = (teamId) => {
    setSelectedTeam(teamId);
    setActiveTab("detail");
  };

  const session = MOCK_SESSION;

  // Lock screen — per spec §7.9, dashboard is fully locked during active round
  if (!session.roundComplete) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-topbar">
          <div className="dashboard-logo"><span className="logo-biz">BIZ</span><span className="logo-sim">SIMULATE</span></div>
          <div className="dashboard-topbar-title">Round 1 Analytics Dashboard</div>
          <div className="dashboard-topbar-role">{role}</div>
        </div>
        <LockScreen session={session} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* Top bar */}
      <div className="dashboard-topbar">
        <div className="dashboard-logo">
          <span className="logo-biz">BIZ</span>
          <span className="logo-sim">SIMULATE</span>
        </div>
        <div className="dashboard-topbar-center">
          <div className="dashboard-topbar-title">Round 1 Analytics Dashboard</div>
          <div className="dashboard-topbar-subtitle">Faculty Debrief Tool · Session {runId?.slice(0, 8)}</div>
        </div>
        <div className="dashboard-topbar-right">
          <div className="dashboard-topbar-role">{role || "Faculty"}</div>
        </div>
      </div>

      {/* Tab navigation — per spec, order matches debrief sequence */}
      <div className="dashboard-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`dashboard-tab ${activeTab === tab.id ? "active" : ""} ${tab.id === "students" ? "tab-private" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "students" && <span className="tab-private-badge">Faculty Only</span>}
          </button>
        ))}
      </div>

      {/* View content */}
      <div className="dashboard-body">
        {activeTab === "insights" && (
          <ViewClassInsights
            session={session}
            insights={MOCK_INSIGHTS}
            prompt={DEBRIEF_PROMPT}
          />
        )}
        {activeTab === "comparison" && (
          <ViewTeamComparison
            teams={MOCK_TEAMS}
            onSelectTeam={handleSelectTeam}
          />
        )}
        {activeTab === "detail" && (
          <ViewTeamDetail
            teams={MOCK_TEAMS}
            selectedTeamId={selectedTeam}
            onSelectTeam={setSelectedTeam}
          />
        )}
        {activeTab === "students" && (
          <ViewStudentView
            students={MOCK_STUDENTS}
            teams={MOCK_TEAMS}
          />
        )}
      </div>

    </div>
  );
}
