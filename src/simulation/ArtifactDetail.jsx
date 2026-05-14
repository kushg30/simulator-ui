import { useState } from "react";

// ─── Slack helpers ────────────────────────────────────────────────────────────

function getInitials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626"];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Decision strip (shared) ─────────────────────────────────────────────────

function DecisionStrip({ artifact, options, onDecide, loading, error, className = "artifact-actions" }) {
  const [selected, setSelected] = useState(null);
  
  if (artifact.actionState === "ACTED") {
    return <div className="decision-confirmation">Decision submitted: {artifact.chosenAction}</div>;
  }
  if (artifact.actionState === "EXPIRED") {
    return <div className="decision-confirmation expired">Decision window expired</div>;
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
                onClick={() => {
                  setSelected(opt.id);
                  onDecide(opt.id);
                }}
                style={{
                  opacity: selected && !isSelected ? 0.4 : 1,
                  background: isSelected ? "#16a34a" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#111827",
                  border: isSelected ? "1px solid #16a34a" : "1px solid #d1d5db",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {isSelected
                ? loading
                  ? `Submitting: ${opt.label}...`
                  : `✓ ${opt.label}`
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

// ─── MEMO ─────────────────────────────────────────────────────────────────────

function MemoArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="finance-memo">
      <div className="finance-memo-header">
        <div className="finance-label">Memo</div>
        <div className="finance-meta">From: {payload?.from}</div>
      </div>
      <div className="finance-subject">{payload?.title}</div>
      <div className="finance-body"><p>{payload?.body}</p></div>
      {payload?.inner_voice && (
        <div className="finance-inner-voice">
          <em>Inner Voice: {payload.inner_voice}</em>
        </div>
      )}
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="finance-actions"
      />
    </div>
  );
}

// ─── MESSAGE_TEXT ─────────────────────────────────────────────────────────────

function MessageArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="finance-message">
      <div className="finance-message-header">
        <span className="finance-message-from">{payload?.from}</span>
        <span>{payload?.title}</span>
      </div>
      <div className="finance-message-bubble">
        <p>{payload?.body}</p>
      </div>
      {payload?.inner_voice && (
        <div className="finance-inner-voice" style={{ margin: "12px 0 0" }}>
          <em>Inner Voice: {payload.inner_voice}</em>
        </div>
      )}
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="finance-message-actions"
      />
    </div>
  );
}

// ─── EMAIL ARTIFACT (Outlook-style) ──────────────────────────────────────────

function EmailArtifact({ artifact, payload }) {
  const bodyText = payload?.body || "";

  const formattedBody = `Hi Team,\n\n${bodyText}\n\nRegards,\n${payload?.from || ""}`;

  const paragraphs = formattedBody
    .split("\n\n")
    .filter((p) => p.trim());

  const initials = (payload?.from || "CR")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{
      width: "100%",
      background: "#ffffff",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      overflow: "hidden",
    }}>

      {/* Top bar */}
      <div style={{
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
        padding: "8px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ fontSize: "11px", color: "#9ca3af" }}>
          Read-only · Simulation artifact
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {["Reply", "Reply All", "Forward"].map((action) => (
            <button key={action} style={{
              fontSize: "12px",
              color: "#374151",
              background: "none",
              border: "none",
              cursor: "default",
            }}>
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div style={{
        padding: "16px 20px 12px",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#111827",
          marginBottom: "14px"
        }}>
          {payload?.subject || payload?.title}
        </div>

        {/* Sender */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#1e3a8a",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between"
            }}>
              <div>
                <span style={{ fontWeight: 600 }}>
                  {payload?.from}
                </span>
                <span style={{ color: "#6b7280", marginLeft: "6px" }}>
                  &lt;{payload?.from_email}&gt;
                </span>
              </div>

              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                {payload?.sent_at}
              </span>
            </div>

            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
              To: {payload?.to}
            </div>
          </div>
        </div>

        {/* Label */}
        <div style={{
          marginTop: "10px",
          fontSize: "11px",
          color: "#92400e",
          background: "#fef3c7",
          display: "inline-block",
          padding: "2px 6px",
          borderRadius: "3px",
        }}>
          Preliminary — Not for Circulation
        </div>
      </div>

      {/* Body */}
      <div style={{
        padding: "20px",
        maxWidth: "720px",
        lineHeight: 1.8,
        fontSize: "14px",
        color: "#1f2937"
      }}>
        {paragraphs.map((para, i) => {
          if (para.includes("\n-") || para.startsWith("-")) {
            const lines = para.split("\n").filter((l) => l.trim());
            const intro = lines[0].startsWith("-") ? null : lines[0];
            const bullets = lines.filter((l) => l.trim().startsWith("-"));

            return (
              <div key={i}>
                {intro && <p>{intro}</p>}
                <ul style={{ paddingLeft: "20px" }}>
                  {bullets.map((b, j) => (
                    <li key={j}>{b.replace(/^-\s*/, "")}</li>
                  ))}
                </ul>
              </div>
            );
          }

          return <p key={i}>{para}</p>;
        })}
      </div>

      {/* Signature */}
      <div style={{
        padding: "0 20px 20px",
        fontSize: "12px",
        color: "#6b7280"
      }}>
        <div style={{ fontWeight: 600 }}>{payload?.from}</div>
        <div>Chief Risk Officer · ANP Phoenix</div>
        <div>{payload?.from_email}</div>
      </div>
    </div>
  );
}


// ─── INTERNAL_NOTE ────────────────────────────────────────────────────────────

function InternalNoteArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="artifact-card">
      <div className="artifact-header">
        <div className="artifact-title">{payload?.title}</div>
        <div className="artifact-meta">From: {payload?.from}</div>
      </div>
      <div className="artifact-body"><p>{payload?.body}</p></div>
      {payload?.inner_voice && (
        <div className="inner-voice">
          <span className="iv-label">Inner Voice</span>
          <p>{payload.inner_voice}</p>
        </div>
      )}
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
      />
    </div>
  );
}

// ─── DIAGNOSTIC_NOTE ─────────────────────────────────────────────────────────

function DiagnosticNoteArtifact({ artifact, payload, options, onDecide, loading, error }) {
  const paragraphs = payload?.body
    ? payload.body.split(". ").reduce((acc, sentence, i, arr) => {
        const text = i < arr.length - 1 ? sentence + "." : sentence;
        if (text.trim()) acc.push(text.trim());
        return acc;
      }, [])
    : [];

  const now = new Date();
  const timestamp = now.toLocaleString("en-US", {
    weekday: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{
      width: "100%",
      background: "#ffffff",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      overflow: "hidden",
    }}>

      {/* System banner */}
      <div style={{
        background: "#f1f5f9",
        borderBottom: "1px solid #e2e8f0",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <div style={{
          width: "6px", height: "6px",
          borderRadius: "50%",
          background: "#64748b",
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: "11px", color: "#64748b",
          fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          Internal System Note
        </span>
        {payload?.conditional && (
          <span style={{
            marginLeft: "auto",
            fontSize: "10px",
            color: "#92400e",
            background: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: "3px",
            padding: "1px 6px",
            fontWeight: 500,
          }}>
            Triggered
          </span>
        )}
      </div>

      {/* Metadata */}
      <div style={{
        padding: "14px 20px 0",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}>
        {[
          { label: "System", value: payload?.from || "Internal Systems" },
          { label: "Audience", value: "Engineering Leadership" },
          { label: "Timestamp", value: timestamp },
        ].map(({ label, value }) => (
          <div key={label} style={{ fontSize: "13px", color: "#374151" }}>
            <span style={{ color: "#6b7280", marginRight: "6px" }}>{label}:</span>
            {value}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ margin: "14px 20px 0", borderTop: "1px solid #e5e7eb" }} />

      {/* Title + body */}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
          {payload?.title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#1f2937" }}>
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Inner voice */}
      {payload?.inner_voice && (
        <div style={{
          margin: "16px 20px 0",
          paddingTop: "10px",
          borderTop: "1px dashed #d1d5db",
          fontSize: "12px",
          fontStyle: "italic",
          color: "#6b7280",
        }}>
          Inner note: {payload.inner_voice}
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: "16px 20px 20px" }}>
        <DecisionStrip
          artifact={artifact} options={options}
          onDecide={onDecide} loading={loading} error={error}
        />
      </div>

    </div>
  );
}

// ─── EXCERPT (Slack thread) ───────────────────────────────────────────────────

function SlackArtifact({ artifact, payload, options, onDecide, loading, error }) {
  const messages = payload?.messages || [];
  return (
    <div className="slack-artifact">
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
        <div className="slack-inner-voice">Inner note: {payload.inner_voice}</div>
      )}
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="slack-actions"
      />
    </div>
  );
}

// ─── OPS_DASHBOARD ────────────────────────────────────────────────────────────

const STATUS_COLOR = { GREEN: "#16a34a", AMBER: "#d97706", RED: "#dc2626" };

function OpsArtifact({ artifact, payload, options, onDecide, loading, error }) {
  const dash = payload?.dashboard || {};
  return (
    <div className="artifact-card">
      <div className="artifact-header">
        <div className="artifact-title">{payload?.title}</div>
        <div className="artifact-meta">From: {payload?.from}</div>
      </div>
      <div style={{ display: "flex", gap: "12px", margin: "14px 0" }}>
        {[
          { label: "Rollout", value: dash.rollout },
          { label: "Manual Checks", value: dash.manual_checks },
          { label: "Red Indicators", value: dash.red_indicators ? "RED" : "NONE" },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: 1, padding: "10px 12px",
            border: "1px solid #e5e7eb", borderRadius: "4px",
            background: "#f9fafb",
          }}>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: STATUS_COLOR[value] || "#111827" }}>
              {value}
            </div>
          </div>
        ))}
      </div>
      <div className="artifact-body"><p>{payload?.body}</p></div>
      {payload?.inner_voice && (
        <div className="inner-voice">
          <span className="iv-label">Inner Voice</span>
          <p>{payload.inner_voice}</p>
        </div>
      )}
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
      />
    </div>
  );
}

// ─── PEOPLE_SIGNAL ────────────────────────────────────────────────────────────

function PeopleSignalArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="artifact-card">
      <div className="artifact-header">
        <div className="artifact-title">{payload?.title}</div>
        <div className="artifact-meta">From: {payload?.from}</div>
      </div>
      {payload?.pulse && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Pulse Survey</div>
          <div style={{ fontSize: "14px", color: "#111827", lineHeight: 1.5 }}>{payload.pulse}</div>
        </div>
      )}
      {payload?.exit_note && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Exit Interview Note</div>
          <div style={{ fontSize: "14px", fontStyle: "italic", color: "#374151", lineHeight: 1.5 }}>"{payload.exit_note}"</div>
        </div>
      )}
      {!payload?.pulse && !payload?.exit_note && (
        <div className="artifact-body"><p>{payload?.body}</p></div>
      )}
      {payload?.inner_voice && (
        <div className="inner-voice">
          <span className="iv-label">Inner Voice</span>
          <p>{payload.inner_voice}</p>
        </div>
      )}
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
      />
    </div>
  );
}

// ─── INVESTOR_DRAFT ───────────────────────────────────────────────────────────

function InvestorDraftArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="investor-draft">
      <div className="investor-header">
        <div className="investor-title">{payload?.title}</div>
        <div className="investor-meta">From: {payload?.from} · Draft — not yet published</div>
      </div>
      <div className="investor-body">
        <p>{payload?.body}</p>
      </div>
      {(payload?.inner_voice_cfo || payload?.inner_voice_product) && (
        <div className="investor-inner-voices">
          {payload?.inner_voice_cfo && (
            <div className="inner-voice-block">
              <strong>CFO:</strong> {payload.inner_voice_cfo}
            </div>
          )}
          {payload?.inner_voice_product && (
            <div className="inner-voice-block">
              <strong>Head of Product:</strong> {payload.inner_voice_product}
            </div>
          )}
        </div>
      )}
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="investor-actions"
      />
    </div>
  );
}

// ─── MEETING_INVITE ───────────────────────────────────────────────────────────

function MeetingInviteArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="calendar-invite">
      <div className="calendar-invite-header">
        <div>
          <div className="calendar-invite-title">{payload?.title}</div>
          <div className="calendar-invite-time">Scheduling conflict detected</div>
        </div>
      </div>
      <div className="calendar-conflict-banner">
        ⚠ Two meetings overlap. You can only attend one.
      </div>
      <div className="calendar-meeting-block internal">
        <div className="meeting-title">{payload?.meeting_a}</div>
        <div className="meeting-meta">Internal · Anomaly Review</div>
      </div>
      <div className="calendar-meeting-block external">
        <div className="meeting-title">{payload?.meeting_b}</div>
        <div className="meeting-meta">External · Enterprise Client</div>
      </div>
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="calendar-rsvp-actions"
      />
    </div>
  );
}

// ─── TAGGING_CHECK ────────────────────────────────────────────────────────────

function TaggingCheckArtifact({ artifact, payload, options, onDecide, loading, error }) {
  return (
    <div className="artifact-card">
      <div className="artifact-header">
        <div className="artifact-title">{payload?.title}</div>
        <div className="artifact-meta">From: {payload?.from}</div>
      </div>
      <div className="artifact-body"><p>{payload?.body}</p></div>
      <div className="tagging-check-system-note">
        ⚠ This classification is system-tracked and feeds Round 2 credibility scoring.
      </div>
      <DecisionStrip
        artifact={artifact} options={options}
        onDecide={onDecide} loading={loading} error={error}
        className="tagging-check-options"
      />
    </div>
  );
}

// ─── SCREEN_FLASH ─────────────────────────────────────────────────────────────

function ScreenFlashArtifact({ artifact, payload, options, onDecide, loading, error }) {
  const isFinal = payload?.is_final_round_decision;
  return (
    <div className={isFinal ? "final-decision-card" : "screen-flash-card"}>
      <div className={isFinal ? "final-decision-title" : "screen-flash-title"}>
        {payload?.title}
      </div>
      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#374151", margin: "8px 0 16px" }}>
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

// ─── Type → Component router ──────────────────────────────────────────────────

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

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ArtifactDetail({ artifact, runId, participantId, refetch }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!artifact) {
    return <div className="viewer empty">Select an artifact</div>;
  }

  let payload = {};
  try {
    payload =
      typeof artifact.payload === "string"
        ? JSON.parse(artifact.payload)
        : artifact.payload;
  } catch (e) {
    payload = {};
  }

  const options =
    typeof artifact.decisionOptions === "string"
      ? JSON.parse(artifact.decisionOptions)
      : artifact.decisionOptions;

  const handleDecision = async (action) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `http://localhost:8080/api/runs/${runId}/decisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            decisionId: artifact.decisionId,
            action,
          }),
        }
      );
      if (!res.ok) throw new Error("Decision failed");
      await refetch();

       if (artifact.updateStatus) {
      artifact.updateStatus(artifact.artifactId, "ACTED");
    }
    
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Component = ARTIFACT_COMPONENTS[artifact.artifactType] || InternalNoteArtifact;

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