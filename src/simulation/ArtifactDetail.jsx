import { useState, useEffect } from "react";
import API_BASE from "../config";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626"];
function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Document Header Strip ───────────────────────────────────────────────────
function DocHeaderStrip({ type, actionState }) {
  const statusLabel =
    actionState === "ACTED"   ? "Acted"   :
    actionState === "EXPIRED" ? "Expired" : "Open";

  const statusClass =
    actionState === "ACTED"   ? "acted"   :
    actionState === "EXPIRED" ? "expired" : "open";

  return (
    <div className="doc-header-strip">
      <span className="doc-type-tag">{type}</span>
      <span className={`doc-status-tag ${statusClass}`}>{statusLabel}</span>
    </div>
  );
}

// ─── Inner Voice block ───────────────────────────────────────────────────────
function InnerVoice({ text }) {
  if (!text) return null;
  return (
    <div className="doc-inner-voice">
      <div className="doc-inner-voice-label">Inner Voice</div>
      {text}
    </div>
  );
}

// ─── Decision Strip ──────────────────────────────────────────────────────────
function DecisionStrip({ artifact, options, onDecide, loading, error, className = "doc-actions" }) {
  const [selected, setSelected] = useState(null);

  if (artifact.actionState === "ACTED") {
    return (
      <div className="decision-confirmation">
        Decision recorded: {artifact.chosenAction}
      </div>
    );
  }

  if (artifact.actionState === "EXPIRED") {
    return <div className="decision-confirmation expired">Decision window closed</div>;
  }

  if (artifact.actionState === "OPEN" && options) {
    return (
      <>
        {error && <div className="error-msg">{error}</div>}
        <div className={className}>
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                disabled={loading || selected !== null}
                className={isSelected ? "selected" : selected ? "faded" : ""}
                onClick={() => { setSelected(opt.id); onDecide(opt.id); }}
              >
                {isSelected
                  ? loading ? `Submitting…` : `✓ ${opt.label}`
                  : opt.label}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMO
// ─────────────────────────────────────────────────────────────────────────────
function MemoArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="finance-memo">
      <DocHeaderStrip type="Memo" actionState={artifact.actionState} />

      <div className="doc-content">
        <div className="doc-meta-row">
          <div className="doc-meta-item">
            <span className="doc-meta-label">From</span>
            <span className="doc-meta-value">{payload?.from}</span>
          </div>
        </div>
        <div className="doc-title">{payload?.title}</div>
        <div className="doc-body"><p>{payload?.body}</p></div>
        <InnerVoice text={payload?.inner_voice} />
      </div>

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="doc-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
function MessageArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="finance-message">
      <DocHeaderStrip type="Message" actionState={artifact.actionState} />

      <div className="doc-content">
        <div className="doc-meta-row">
          <div className="doc-meta-item">
            <span className="doc-meta-label">From</span>
            <span className="doc-meta-value">{payload?.from}</span>
          </div>
          {payload?.title && (
            <div className="doc-meta-item">
              <span className="doc-meta-label">Subject</span>
              <span className="doc-meta-value">{payload.title}</span>
            </div>
          )}
        </div>
        <div className="message-bubble">{payload?.body}</div>
        <InnerVoice text={payload?.inner_voice} />
      </div>

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="doc-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL / INTERNAL NOTE
// ─────────────────────────────────────────────────────────────────────────────
function EmailArtifact({ artifact, payload }) {
  const bodyText = payload?.body || "";
  const formattedBody = `Hi Team,\n\n${bodyText}\n\nRegards,\n${payload?.from || ""}`;
  const paragraphs = formattedBody.split("\n\n").filter((p) => p.trim());
  const initials = (payload?.from || "CR").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="mail-viewer">
      <DocHeaderStrip type="Internal Note" actionState={artifact.actionState} />

      {/* Email chrome */}
      <div className="email-topbar">
        <span className="email-topbar-label">Read-only · Simulation artifact</span>
        <div className="email-topbar-actions">
          {["Reply", "Reply All", "Forward"].map((a) => (
            <button key={a}>{a}</button>
          ))}
        </div>
      </div>

      {/* Subject + sender */}
      <div className="email-subject-block">
        <div className="email-subject">{payload?.subject || payload?.title}</div>
        <div className="email-sender-row">
          <div className="email-avatar">{initials}</div>
          <div className="email-sender-meta">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <span className="email-from-name">{payload?.from}</span>
                <span className="email-from-addr">&lt;{payload?.from_email}&gt;</span>
              </div>
              <span className="email-sent-time">{payload?.sent_at}</span>
            </div>
            <div className="email-to-line">To: {payload?.to}</div>
          </div>
        </div>
        <span className="email-prelim-tag">Preliminary — Not for Circulation</span>
      </div>

      {/* Body */}
      <div className="email-body">
        {paragraphs.map((para, i) => {
          if (para.includes("\n-") || para.startsWith("-")) {
            const lines  = para.split("\n").filter((l) => l.trim());
            const intro  = lines[0].startsWith("-") ? null : lines[0];
            const bullets = lines.filter((l) => l.trim().startsWith("-"));
            return (
              <div key={i}>
                {intro && <p>{intro}</p>}
                <ul>{bullets.map((b, j) => <li key={j}>{b.replace(/^-\s*/, "")}</li>)}</ul>
              </div>
            );
          }
          return <p key={i}>{para}</p>;
        })}
      </div>

      {/* Signature */}
      <div className="email-signature">
        <div style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{payload?.from}</div>
        <div>Chief Risk Officer · ANP Phoenix</div>
        <div>{payload?.from_email}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC NOTE
// ─────────────────────────────────────────────────────────────────────────────
function DiagnosticNoteArtifact({ artifact, payload, options, onDecide, loading, error }) {
  const paragraphs = payload?.body
    ? payload.body.split(". ").reduce((acc, s, i, arr) => {
        const text = i < arr.length - 1 ? s + "." : s;
        if (text.trim()) acc.push(text.trim());
        return acc;
      }, [])
    : [];

  const now = new Date();
  const timestamp = now.toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="artifact-card">
      {/* System banner */}
      <div className="diagnostic-banner">
        <div className="diagnostic-dot" />
        <span className="diagnostic-label">Internal System Note</span>
        {payload?.conditional && (
          <span className="diagnostic-triggered">Triggered</span>
        )}
      </div>

      <div className="doc-content">
        <div className="doc-meta-row">
          {[
            { label: "System",    value: payload?.from || "Internal Systems" },
            { label: "Audience",  value: "Engineering Leadership"             },
            { label: "Timestamp", value: timestamp                            },
          ].map(({ label, value }) => (
            <div className="doc-meta-item" key={label}>
              <span className="doc-meta-label">{label}</span>
              <span className="doc-meta-value">{value}</span>
            </div>
          ))}
        </div>

        <div className="doc-title">{payload?.title}</div>
        <div className="doc-body">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <InnerVoice text={payload?.inner_voice} />
      </div>

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="doc-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCERPT (Slack thread)
// ─────────────────────────────────────────────────────────────────────────────
function SlackArtifact({ artifact, payload, options, onDecide, loading, error }) {
  const messages = payload?.messages || [];
  return (
    <div className="slack-artifact">
      <DocHeaderStrip type="Slack Thread" actionState={artifact.actionState} />

      <div className="slack-artifact-header">
        <div className="slack-channel-name">{payload?.channel || payload?.title}</div>
        <div className="slack-channel-meta">{payload?.department || "Engineering"}</div>
      </div>

      <div className="slack-thread">
        {messages.map((msg, i) => (
          <div key={i} className="slack-message">
            <div className="slack-avatar-circle" style={{ background: avatarColor(msg.author) }}>
              {getInitials(msg.author)}
            </div>
            <div className="slack-message-content">
              <div className="slack-message-header">
                <span className="slack-author">{msg.author}</span>
                <span className="slack-time">{msg.time}</span>
              </div>
              <div className="slack-text">{msg.text}</div>
            </div>
          </div>
        ))}
      </div>

      {payload?.inner_voice && (
        <div className="slack-inner-voice">
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-amber)",
            marginBottom: "4px",
            fontStyle: "normal",
          }}>
            Inner Voice
          </div>
          {payload.inner_voice}
        </div>
      )}

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="slack-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPS DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function OpsArtifact({ artifact, payload, options, onDecide, loading, error }) {
  const dash = payload?.dashboard || {};
  return (
    <div className="artifact-card">
      <DocHeaderStrip type="Ops Dashboard" actionState={artifact.actionState} />

      <div className="doc-content">
        <div className="doc-meta-row">
          <div className="doc-meta-item">
            <span className="doc-meta-label">From</span>
            <span className="doc-meta-value">{payload?.from}</span>
          </div>
        </div>
        <div className="doc-title">{payload?.title}</div>

        {/* Stats */}
        <div className="ops-stats">
          {[
            { label: "Rollout",       value: dash.rollout },
            { label: "Manual Checks", value: dash.manual_checks },
            { label: "Red Indicators",value: dash.red_indicators ? "RED" : "NONE" },
          ].map(({ label, value }) => (
            <div key={label} className="ops-stat-card">
              <div className="ops-stat-label">{label}</div>
              <div className={`ops-stat-value ${value}`}>{value}</div>
            </div>
          ))}
        </div>

        <div className="doc-body"><p>{payload?.body}</p></div>
        <InnerVoice text={payload?.inner_voice} />
      </div>

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="doc-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PEOPLE SIGNAL
// ─────────────────────────────────────────────────────────────────────────────
function PeopleSignalArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="artifact-card">
      <DocHeaderStrip type="People Signal" actionState={artifact.actionState} />

      <div className="doc-content">
        <div className="doc-meta-row">
          <div className="doc-meta-item">
            <span className="doc-meta-label">From</span>
            <span className="doc-meta-value">{payload?.from}</span>
          </div>
        </div>
        <div className="doc-title">{payload?.title}</div>

        {payload?.pulse && (
          <div style={{ marginBottom: "14px" }}>
            <div className="doc-meta-label" style={{ marginBottom: "6px" }}>Pulse Survey</div>
            <div className="doc-body"><p>{payload.pulse}</p></div>
          </div>
        )}

        {payload?.exit_note && (
          <div style={{ marginBottom: "14px" }}>
            <div className="doc-meta-label" style={{ marginBottom: "6px" }}>Exit Interview Note</div>
            <div style={{
              fontStyle: "italic",
              fontSize: "14px",
              color: "#b8bccb",
              lineHeight: 1.7,
              borderLeft: "3px solid var(--border-default)",
              paddingLeft: "14px",
            }}>
              "{payload.exit_note}"
            </div>
          </div>
        )}

        {!payload?.pulse && !payload?.exit_note && (
          <div className="doc-body"><p>{payload?.body}</p></div>
        )}

        <InnerVoice text={payload?.inner_voice} />
      </div>

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="doc-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVESTOR DRAFT
// ─────────────────────────────────────────────────────────────────────────────
function InvestorDraftArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="investor-draft">
      <DocHeaderStrip type="Investor Draft" actionState={artifact.actionState} />

      <div className="doc-content">
        <div className="doc-meta-row">
          <div className="doc-meta-item">
            <span className="doc-meta-label">From</span>
            <span className="doc-meta-value">{payload?.from}</span>
          </div>
        </div>

        <span className="investor-draft-banner">Draft — Not for Circulation</span>
        <div className="doc-title">{payload?.title}</div>

        <div style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "16px",
          marginBottom: "16px",
        }}>
          <p style={{ fontSize: "14px", lineHeight: 1.75, color: "#b8bccb", margin: 0 }}>
            {payload?.body}
          </p>
        </div>

        {(payload?.inner_voice_cfo || payload?.inner_voice_product) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {payload?.inner_voice_cfo && (
              <div className="inner-voice-block">
                <strong>CFO</strong>
                {payload.inner_voice_cfo}
              </div>
            )}
            {payload?.inner_voice_product && (
              <div className="inner-voice-block">
                <strong>Head of Product</strong>
                {payload.inner_voice_product}
              </div>
            )}
          </div>
        )}
      </div>

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="doc-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MEETING INVITE
// ─────────────────────────────────────────────────────────────────────────────
function MeetingInviteArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="calendar-invite">
      <DocHeaderStrip type="Meeting Invite" actionState={artifact.actionState} />

      <div className="doc-content">
        <div className="doc-title">{payload?.title}</div>
        <div className="calendar-conflict-banner">
          ⚠ Scheduling conflict — two meetings overlap. You can only attend one.
        </div>

        <div className="calendar-meeting-block internal">
          <div className="meeting-title">{payload?.meeting_a}</div>
          <div className="meeting-meta">Internal · Anomaly Review</div>
        </div>

        <div className="calendar-meeting-block external">
          <div className="meeting-title">{payload?.meeting_b}</div>
          <div className="meeting-meta">External · Enterprise Client</div>
        </div>
      </div>

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="calendar-rsvp-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAGGING CHECK
// ─────────────────────────────────────────────────────────────────────────────
function TaggingCheckArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="artifact-card">
      <DocHeaderStrip type="Tagging Check" actionState={artifact.actionState} />

      <div className="doc-content">
        <div className="doc-meta-row">
          <div className="doc-meta-item">
            <span className="doc-meta-label">From</span>
            <span className="doc-meta-value">{payload?.from}</span>
          </div>
        </div>
        <div className="doc-title">{payload?.title}</div>
        <div className="doc-body"><p>{payload?.body}</p></div>
        <div className="tagging-check-system-note">
          ⚠ This classification is system-tracked and feeds Round 2 credibility scoring.
        </div>
      </div>

      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="doc-actions"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN FLASH / FINAL DECISION
// ─────────────────────────────────────────────────────────────────────────────
function ScreenFlashArtifact({ artifact, payload, options, onDecide, loading, error }) {
  const isFinal = payload?.is_final_round_decision;
  return (
    <div className={isFinal ? "final-decision-card" : "screen-flash-card"}>
      <div className={isFinal ? "final-decision-title" : "screen-flash-title"}>
        {payload?.title}
      </div>
      <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "#b8bccb", margin: "0 0 16px" }}>
        {payload?.body}
      </p>
      {isFinal && (
        <DecisionStrip
          artifact={artifact} options={options}
          onDecide={onDecide} loading={loading} error={error}
          className="final-decision-options"
        />
      )}
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
const ARTIFACT_COMPONENTS = {
  MEMO:            MemoArtifact,
  MESSAGE_TEXT:    MessageArtifact,
  EXCERPT:         SlackArtifact,
  INTERNAL_NOTE:   EmailArtifact,
  DIAGNOSTIC_NOTE: DiagnosticNoteArtifact,
  OPS_DASHBOARD:   OpsArtifact,
  PEOPLE_SIGNAL:   PeopleSignalArtifact,
  INVESTOR_DRAFT:  InvestorDraftArtifact,
  MEETING_INVITE:  MeetingInviteArtifact,
  TAGGING_CHECK:   TaggingCheckArtifact,
  SCREEN_FLASH:    ScreenFlashArtifact,
};

// ─── Main export ─────────────────────────────────────────────────────────────
export default function ArtifactDetail({ artifact, runId, participantId, refetch }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

 useEffect(() => {
    setError(null);
    setLoading(false);
  }, [artifact?.artifactId]);

  if (!artifact) {
    return <div className="viewer empty">Select an artifact to begin</div>;
  }



  let payload = {};
  try {
    payload = typeof artifact.payload === "string"
      ? JSON.parse(artifact.payload)
      : artifact.payload;
  } catch { payload = {}; }

  const options = typeof artifact.decisionOptions === "string"
    ? JSON.parse(artifact.decisionOptions)
    : artifact.decisionOptions;

  const handleDecision = async (action) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/runs/${runId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, decisionId: artifact.decisionId, action }),
      });
      if (!res.ok) throw new Error("Decision failed");
      await refetch();
      if (artifact.updateStatus) artifact.updateStatus(artifact.artifactId, "ACTED");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Component = ARTIFACT_COMPONENTS[artifact.artifactType] || EmailArtifact;

  return (
    <Component
      artifact={artifact}
      payload={payload}
      options={options}
      onDecide={handleDecision}
      loading={loading}
      error={error}
    />
  );
}
