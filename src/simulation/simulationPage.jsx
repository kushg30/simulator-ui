import { useState, useEffect } from "react";
import { useArtifacts } from "./useartifacts";
import ArtifactDetail from "./ArtifactDetail";
import ArtifactList from "./ArtifactList";
import ScreenFlashOverlay from "./ScreenFlashOverlay";
import "../simulator.css";
import API_BASE from "../config";

// ─────────────────────────────────────────────────────────────
// Timer Hook
// ─────────────────────────────────────────────────────────────
function useSimulationTime(startedAt) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setSeconds(elapsed);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return seconds;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ARTIFACT_TYPE_LABELS = {
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

  const runId         = "b863544b-ff4f-47dd-a7aa-ce23657b098b";
  const participantId = "33166e16-2bbc-41e4-8149-bb11bf8592e0";
  const role          = "CEO";

  const { artifacts, loading, error, refetch } = useArtifacts(runId, participantId);

  const [activeTab,         setActiveTab]         = useState("inbox");
  const [selectedArtifact,  setSelectedArtifact]  = useState(null);
  const [artifactsState,    setArtifactsState]    = useState([]);
  const [startTime,         setStartTime]         = useState(null);

  // ── Screen flash state ───────────────────────────────────
  const [activeFlash,      setActiveFlash]      = useState(null);
  const [flashLoading,     setFlashLoading]     = useState(false);
  const [dismissedFlashes, setDismissedFlashes] = useState(new Set());

  // ── Timer ────────────────────────────────────────────────
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

  // ── Polling ──────────────────────────────────────────────
  useEffect(() => {
    if (!runId || !participantId) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [runId, participantId, refetch]);

  // ── Sync artifact state ──────────────────────────────────
  useEffect(() => {
    if (!artifacts) return;
    setArtifactsState((prev) =>
      artifacts.map((a) => {
        const existing = prev.find((p) => p.artifactId === a.artifactId);
        return {
          ...a,
          status: a.actionState === "ACTED" ? "ACTED" : existing?.status || "UNREAD",
        };
      })
    );
  }, [artifacts]);

  // ── Keep selected updated ────────────────────────────────
  useEffect(() => {
    if (!selectedArtifact) return;
    const updated = artifactsState.find(
      (a) => a.artifactId === selectedArtifact.artifactId
    );
    if (updated) setSelectedArtifact(updated);
  }, [artifactsState]);

  // ── Screen flash detection ───────────────────────────────
  useEffect(() => {
    if (activeFlash) return; // already showing one

    const flash = artifactsState.find(
      (a) =>
        a.artifactType === "SCREEN_FLASH" &&
        (a.actionState === "OPEN" || a.actionState === "READ_ONLY") &&
        !dismissedFlashes.has(a.artifactId)
    );

    if (flash) setActiveFlash(flash);
  }, [artifactsState, activeFlash, dismissedFlashes]);

  // ── Helpers ──────────────────────────────────────────────
  const safeParse = (data) => {
    try { return typeof data === "string" ? JSON.parse(data) : data; }
    catch { return {}; }
  };

  const getTab = (a) => {
    const payload = safeParse(a.payload);
    return payload?.tab || "inbox";
  };

  // SCREEN_FLASH never appears in the sidebar list
  const visibleArtifacts = artifactsState.filter(
    (a) => getTab(a) === activeTab && a.artifactType !== "SCREEN_FLASH"
  );

  // ── Select handler ───────────────────────────────────────
  const handleSelect = (artifact) => {
    setArtifactsState((prev) =>
      prev.map((a) =>
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
    setArtifactsState((prev) =>
      prev.map((a) => (a.artifactId === id ? { ...a, status } : a))
    );
  };

  // ── Auto-select ──────────────────────────────────────────
  useEffect(() => {
    if (visibleArtifacts.length > 0) {
      const stillVisible = visibleArtifacts.some(
        (a) => a.artifactId === selectedArtifact?.artifactId
      );
      if (!stillVisible) setSelectedArtifact(visibleArtifacts[0]);
    } else {
      setSelectedArtifact(null);
    }
  }, [activeTab, artifactsState]);

  // ── Tab counts (exclude SCREEN_FLASH) ───────────────────
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.id] = artifactsState.filter(
      (a) =>
        getTab(a) === tab.id &&
        a.status === "UNREAD" &&
        a.artifactType !== "SCREEN_FLASH"
    ).length;
    return acc;
  }, {});

  // ── Flash decision handler ───────────────────────────────
  const handleFlashDecision = async (action) => {
    if (!activeFlash || !activeFlash.decisionId) return;
    try {
      setFlashLoading(true);
      const res = await fetch(
        `${API_BASE}/api/runs/${runId}/decisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            decisionId: activeFlash.decisionId,
            action,
          }),
        }
      );
      if (!res.ok) throw new Error("Decision failed");
      await refetch();
      updateStatus(activeFlash.artifactId, "ACTED");

      // Brief delay so user sees ✓ confirmation before dismissing
      setTimeout(() => {
        setDismissedFlashes((prev) => new Set([...prev, activeFlash.artifactId]));
        setActiveFlash(null);
      }, 1400);

    } catch (err) {
      console.error("Flash decision error:", err);
    } finally {
      setFlashLoading(false);
    }
  };

  // ── Flash dismiss (implicit / info-only) ─────────────────
  const handleFlashDismiss = () => {
    if (!activeFlash) return;
    setDismissedFlashes((prev) => new Set([...prev, activeFlash.artifactId]));
    setActiveFlash(null);
  };

  // ── Timer color ──────────────────────────────────────────
  const timerClass =
    simSeconds > 900 ? "critical" :
    simSeconds > 600 ? "warn"     : "";

  // ── Guards ───────────────────────────────────────────────
  if (!runId || !participantId)
    return <div className="sim-error">Invalid session. Please restart.</div>;
  if (loading) return <div className="sim-loading">Loading session</div>;
  if (error)   return <div className="sim-error">Error: {error}</div>;

  // ── Parse flash payload + options ────────────────────────
  const flashPayload = activeFlash ? safeParse(activeFlash.payload) : null;
  const flashOptions = activeFlash
    ? (typeof activeFlash.decisionOptions === "string"
        ? JSON.parse(activeFlash.decisionOptions)
        : activeFlash.decisionOptions)
    : null;

  // ─────────────────────────────────────────────────────────
  return (
    <div className="round-screen">

      {/* ── SCREEN FLASH OVERLAY ── */}
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

      {/* ── TOP BAR ── */}
      <div className="top-bar">
        <div className="top-left role-label">
          Role:&nbsp;<span className="role-value">{role}</span>
        </div>
        <div className="top-center">
          <div className="app-title">Leadership Simulator</div>
          <div className="phase-label">Interpretation Phase</div>
        </div>
        <div className="top-right time-block">
          <div className="time-label">Round Time</div>
          <div className={`time-value ${timerClass}`}>
            {startTime ? formatTime(simSeconds) : "--:--"}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
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
              typeLabels={ARTIFACT_TYPE_LABELS}
            />
          )}
        </div>

        <div className="content-canvas">
          <div className="viewer">
            <ArtifactDetail
              artifact={selectedArtifact ? { ...selectedArtifact, updateStatus } : null}
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
