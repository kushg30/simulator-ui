import { useState, useEffect } from "react";
import { useArtifacts } from "./useartifacts";
import ArtifactDetail from "./ArtifactDetail";
import { useSearchParams } from "react-router-dom";
import ArtifactList from "./ArtifactList";

// ─────────────────────────────────────────────────────────────
// Timer Hook
// ─────────────────────────────────────────────────────────────
function useSimulationTime(startedAt) {
 
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const update = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000
      );
      setSeconds(elapsed);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return seconds;
}

// ─────────────────────────────────────────────────────────────
// Format Time
// ─────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ARTIFACT_TYPE_LABELS = {
  INTERNAL_NOTE: "Internal Note",
  MEMO: "Memo",
  MESSAGE_TEXT: "Message",
  EXCERPT: "Slack Thread",
  OPS_DASHBOARD: "Ops Dashboard",
  PEOPLE_SIGNAL: "People Signals",
  INVESTOR_DRAFT: "Investor Draft",
  TAGGING_CHECK: "Tagging Check",
  DIAGNOSTIC_NOTE: "Diagnostic Note",
  MEETING_INVITE: "Meeting Invite",
  SCREEN_FLASH: "Alert",
};

const TABS = [
  { id: "inbox", icon: "📥", label: "Inbox" },
  { id: "excerpts", icon: "📊", label: "Excerpts" },
  { id: "meetings", icon: "📅", label: "Meetings" },
  { id: "decisions", icon: "⚖️", label: "Decisions" },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function SimulationPage() {

  /*
  const [searchParams] = useSearchParams();

  const runId = searchParams.get("runId");
  const participantId = searchParams.get("participantId");
  const role = searchParams.get("role");
  */

  const runId = "b863544b-ff4f-47dd-a7aa-ce23657b098b";
  const participantId = "09f7d1cf-fdca-404e-85bb-66d407342ca9";
  const role = "CFO";

  const { artifacts, loading, error, refetch } =
    useArtifacts(runId || "", participantId || "");

  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [artifactsState, setArtifactsState] = useState([]);

  // ─────────────────────────────────────────────────────────────
  // Stable Timer (no reset bug)
  // ─────────────────────────────────────────────────────────────
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (!startTime && artifacts?.length > 0) {
      const earliest = [...artifacts].sort(
        (a, b) => new Date(a.openAt) - new Date(b.openAt)
      )[0];
      setStartTime(earliest.openAt);
    } else if (!startTime) {
      setStartTime(new Date().toISOString());
    }
  }, [artifacts]);

  const simSeconds = useSimulationTime(startTime);

  // ─────────────────────────────────────────────────────────────
  // Polling (multiplayer sync)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!runId || !participantId) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [runId, participantId, refetch]);

  // ─────────────────────────────────────────────────────────────
  // Preserve READ / ACTED state
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!artifacts) return;

    setArtifactsState((prev) => {
      return artifacts.map((a) => {
        const existing = prev.find(p => p.artifactId === a.artifactId);

        return {
          ...a,
          status:
            a.actionState === "ACTED"
              ? "ACTED"
              : existing?.status || "UNREAD",
        };
      });
    });
  }, [artifacts]);

  // ─────────────────────────────────────────────────────────────
  // Keep selected artifact updated
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedArtifact) return;

    const updated = artifactsState.find(
      (a) => a.artifactId === selectedArtifact.artifactId
    );

    if (updated) {
      setSelectedArtifact(updated);
    }
  }, [artifactsState]);

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  const safeParse = (data) => {
    try {
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      return {};
    }
  };

  const getTab = (a) => {
    const payload = safeParse(a.payload);
    return payload?.tab || "inbox";
  };

  const visibleArtifacts = artifactsState.filter(
    (a) => getTab(a) === activeTab
  );

  // ─────────────────────────────────────────────────────────────
  // Select handler
  // ─────────────────────────────────────────────────────────────
  const handleSelect = (artifact) => {
    setArtifactsState((prev) =>
      prev.map((a) =>
        a.artifactId === artifact.artifactId
          ? {
              ...a,
              status: a.status === "UNREAD" ? "READ" : a.status,
            }
          : a
      )
    );

    setSelectedArtifact({
      ...artifact,
      status: artifact.status === "UNREAD" ? "READ" : artifact.status
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Update status (ACTED)
  // ─────────────────────────────────────────────────────────────
  const updateStatus = (id, status) => {
    setArtifactsState((prev) =>
      prev.map((a) =>
        a.artifactId === id ? { ...a, status } : a
      )
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Auto select
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visibleArtifacts.length > 0) {
      const stillVisible = visibleArtifacts.some(
        (a) => a.artifactId === selectedArtifact?.artifactId
      );

      if (!stillVisible) {
        setSelectedArtifact(visibleArtifacts[0]);
      }
    } else {
      setSelectedArtifact(null);
    }
  }, [activeTab, artifactsState]);

  // ─────────────────────────────────────────────────────────────
  // Unread counts
  // ─────────────────────────────────────────────────────────────
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.id] = artifactsState.filter(
      (a) =>
        getTab(a) === tab.id && a.status === "UNREAD"
    ).length;
    return acc;
  }, {});

  // ─────────────────────────────────────────────────────────────
  // Guards
  // ─────────────────────────────────────────────────────────────
  if (!runId || !participantId) {
    return <div>Invalid session. Please restart simulation.</div>;
  }

  if (loading) return <div>Loading artifacts...</div>;
  if (error) return <div>Error: {error}</div>;

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="round-screen">

      <div className="top-bar">
        <div className="top-left role-label">Role: {role}</div>

        <div className="top-center">
          <div className="app-title">Leadership Simulator</div>
          <div className="phase-label">INTERPRETATION PHASE</div>
        </div>

        <div className="top-right time-block">
          <div className="time-label">ROUND TIME</div>
          <div className="time-value">
            ⏱ {startTime ? formatTime(simSeconds) : "--:--"}
          </div>
        </div>
      </div>

      <div className="main">

        <div className="primary-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>

              {tabCounts[tab.id] > 0 && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: "10px",
                  background: activeTab === tab.id ? "#2563eb" : "#e5e7eb",
                  color: activeTab === tab.id ? "#ffffff" : "#6b7280",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontWeight: 600,
                }}>
                  {tabCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="secondary-list">
          {visibleArtifacts.length === 0 ? (
            <div style={{
              padding: "24px 14px",
              fontSize: "13px",
              color: "#9ca3af",
              textAlign: "center",
            }}>
              No items in {activeTab}
            </div>
          ) : (
            <ArtifactList
              artifacts={visibleArtifacts}
              selectedId={selectedArtifact?.artifactId}
              onSelect={handleSelect}
              typeLabels={ARTIFACT_TYPE_LABELS}
            />
          )}
        </div>

        <div className="content-canvas">
          <div className="viewer">
            <ArtifactDetail
              artifact={
                selectedArtifact
                  ? { ...selectedArtifact, updateStatus }
                  : null
              }
              runId={runId}
              participantId={participantId}
              refetch={refetch}
            />
          </div>
        </div>

      </div>
    </div>
  );
}