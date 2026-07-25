import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useArtifacts } from "./useartifacts";
import ArtifactDetail from "./ArtifactDetail";
import ArtifactList from "./ArtifactList";
import ScreenFlashOverlay from "./ScreenFlashOverlay";
import "../simulator.css";
import API_BASE from "../config";

// ─────────────────────────────────────────────────────────────
// Timer
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
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return seconds;
}

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  INTERNAL_NOTE:   "Internal Note",
  MEMO:            "Memo",
  MESSAGE_TEXT:    "Message",
  EXCERPT:         "Slack Thread",
  OPS_DASHBOARD:   "Ops Dashboard",
  PEOPLE_SIGNAL:   "People Signals",
  INVESTOR_DRAFT:  "Investor Draft",
  TAGGING_CHECK:   "Tagging Check",
  DIAGNOSTIC_NOTE: "Diagnostic Note",
  MEETING_INVITE:  "Meeting Invite",
  SCREEN_FLASH:    "Alert",
};

const TABS = [
  { id: "inbox",     icon: "📥", label: "Inbox"     },
  { id: "excerpts",  icon: "📊", label: "Excerpts"  },
  { id: "meetings",  icon: "📅", label: "Meetings"  },
  { id: "decisions", icon: "⚖️", label: "Decisions" },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function SimulationPage() {
  // Read the live session from the URL instead of hardcoded ids, so each
  // participant fetches their own artifacts for the real run.
  const [params] = useSearchParams();
  const runId         = params.get("runId");
  const participantId = params.get("participantId");
  const role          = params.get("role");

  const { artifacts, loading, error, refetch } = useArtifacts(runId, participantId);

  const [activeTab,        setActiveTab]        = useState("inbox");
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [artifactsState,   setArtifactsState]   = useState([]);
  const [startTime,        setStartTime]        = useState(null);
  const [activeFlash,      setActiveFlash]      = useState(null);
  const [flashLoading,     setFlashLoading]     = useState(false);
  const [dismissed,        setDismissed]        = useState(new Set());

  useEffect(() => {
    if (startTime) return;
    if (artifacts?.length > 0) {
      const earliest = [...artifacts].sort(
        (a, b) => new Date(a.openAt) - new Date(b.openAt)
      )[0];
      setStartTime(earliest.openAt);
    } else {
      setStartTime(new Date().toISOString());
    }
  }, [artifacts]); // eslint-disable-line

  const simSeconds = useSimulationTime(startTime);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 3000);
    return () => clearInterval(id);
  }, [refetch]);

  useEffect(() => {
    if (!artifacts) return;
    setArtifactsState(prev =>
      artifacts.map(a => {
        const ex = prev.find(p => p.artifactId === a.artifactId);
        return {
          ...a,
          status: a.actionState === "ACTED" ? "ACTED" : ex?.status || "UNREAD",
        };
      })
    );
  }, [artifacts]);

  useEffect(() => {
    if (!selectedArtifact) return;
    const updated = artifactsState.find(
      a => a.artifactId === selectedArtifact.artifactId
    );
    if (updated) setSelectedArtifact(updated);
  }, [artifactsState]); // eslint-disable-line

  useEffect(() => {
    if (activeFlash) return;
    const flash = artifactsState.find(
      a =>
        a.artifactType === "SCREEN_FLASH" &&
        (a.actionState === "OPEN" || a.actionState === "READ_ONLY") &&
        !dismissed.has(a.artifactId)
    );
    if (flash) setActiveFlash(flash);
  }, [artifactsState, activeFlash, dismissed]);

  const safeParse = d => {
    try { return typeof d === "string" ? JSON.parse(d) : d; }
    catch { return {}; }
  };

  const getTab = a => safeParse(a.payload)?.tab || "inbox";

  const visibleArtifacts = artifactsState.filter(
    a => getTab(a) === activeTab && a.artifactType !== "SCREEN_FLASH"
  );

  const handleSelect = artifact => {
    setArtifactsState(prev =>
      prev.map(a =>
        a.artifactId === artifact.artifactId
          ? { ...a, status: a.status === "UNREAD" ? "READ" : a.status }
          : a
      )
    );
    setSelectedArtifact({
      ...artifact,
      status: artifact.status === "UNREAD" ? "READ" : artifact.status,
    });
  };

  const updateStatus = (id, status) => {
    setArtifactsState(prev =>
      prev.map(a => a.artifactId === id ? { ...a, status } : a)
    );
  };

  useEffect(() => {
    if (visibleArtifacts.length > 0) {
      const still = visibleArtifacts.some(
        a => a.artifactId === selectedArtifact?.artifactId
      );
      if (!still) setSelectedArtifact(visibleArtifacts[0]);
    } else {
      setSelectedArtifact(null);
    }
  }, [activeTab, artifactsState]); // eslint-disable-line

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.id] = artifactsState.filter(
      a =>
        getTab(a) === tab.id &&
        a.status === "UNREAD" &&
        a.artifactType !== "SCREEN_FLASH"
    ).length;
    return acc;
  }, {});

  const handleFlashDecision = async action => {
    if (!activeFlash?.decisionId) return;
    try {
      setFlashLoading(true);
      const res = await fetch(`${API_BASE}/api/runs/${runId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          decisionId: activeFlash.decisionId,
          action,
        }),
      });
      if (!res.ok) throw new Error("failed");
      await refetch();
      updateStatus(activeFlash.artifactId, "ACTED");
      setTimeout(() => {
        setDismissed(prev => new Set([...prev, activeFlash.artifactId]));
        setActiveFlash(null);
      }, 1400);
    } catch (e) {
      console.error(e);
    } finally {
      setFlashLoading(false);
    }
  };

  const handleFlashDismiss = () => {
    if (!activeFlash) return;
    setDismissed(prev => new Set([...prev, activeFlash.artifactId]));
    setActiveFlash(null);
  };

  const timerClass =
    simSeconds > 900 ? "critical" :
    simSeconds > 600 ? "warn" : "";

  if (!runId || !participantId)
    return <div className="sim-error">Invalid session.</div>;
  if (loading)
    return <div className="sim-loading">Loading session</div>;
  if (error)
    return <div className="sim-error">Error: {error}</div>;

  const flashPayload = activeFlash ? safeParse(activeFlash.payload) : null;
  const flashOptions = activeFlash
    ? (typeof activeFlash.decisionOptions === "string"
        ? JSON.parse(activeFlash.decisionOptions)
        : activeFlash.decisionOptions)
    : null;

  // Opened directly without a live session — send the user back to the start.
  if (!runId || !participantId) {
    return (
      <div className="round-screen" style={{ padding: 24 }}>
        No active session. Please start from the team join page.
      </div>
    );
  }

  return (
    <div className="round-screen">

      {activeFlash && (
        <ScreenFlashOverlay
          artifact={activeFlash}
          payload={flashPayload}
          options={flashOptions}
          onDecide={handleFlashDecision}
          onDismiss={handleFlashDismiss}
          loading={flashLoading}
        />
      )}

      <div className="top-bar">
        <div className="top-left role-label">
          Role:&nbsp;<span className="role-value">{role}</span>
        </div>
        <div className="top-center">
          <div className="app-title">Leadership Simulator</div>
          <div className="phase-label">Interpretation Phase</div>
        </div>
        <div className="top-right time-block">
          <span className="time-label">Round Time</span>
          <div className={`time-value ${timerClass}`}>
            {startTime ? formatTime(simSeconds) : "--:--"}
          </div>
        </div>
      </div>

      <div className="main">
        <div className="primary-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {tabCounts[tab.id] > 0 && (
                <span className="nav-badge">{tabCounts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="secondary-list">
          <div className="list-header">
            <div className="list-header-label">{activeTab}</div>
          </div>
          {visibleArtifacts.length === 0 ? (
            <div className="list-empty">No items</div>
          ) : (
            <ArtifactList
              artifacts={visibleArtifacts}
              selectedId={selectedArtifact?.artifactId}
              onSelect={handleSelect}
              typeLabels={TYPE_LABELS}
            />
          )}
        </div>

        <div className="content-canvas">
          <div className="viewer">
            <ArtifactDetail
              artifact={
                selectedArtifact ? { ...selectedArtifact, updateStatus } : null
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
