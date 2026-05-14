// SlackArtifact.jsx

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Deterministic color per author so avatars stay consistent
const AVATAR_COLORS = [
  "#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626",
];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function SlackArtifact({ artifact, options, onDecide, loading }) {
  const payload =
    typeof artifact.payload === "string"
      ? JSON.parse(artifact.payload)
      : artifact.payload;

  const messages = payload?.messages || [];

  return (
    <div className="slack-artifact">

      {/* HEADER */}
      <div className="slack-artifact-header">
        <div className="slack-channel-name">
          {payload?.channel || payload?.title}
        </div>
        <div className="slack-channel-meta">
          {artifact.artifactType === "EXCERPT" ? "Excerpt" : "Engineering"}
        </div>
      </div>

      {/* THREAD */}
      <div className="slack-thread">
        {messages.map((msg, i) => (
          <div key={i} className="slack-message">
            <div
              className="slack-avatar-circle"
              style={{ background: avatarColor(msg.author) }}
            >
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

      {/* INNER VOICE */}
      {payload?.inner_voice && (
        <div className="slack-inner-voice">
          Inner note: {payload.inner_voice}
        </div>
      )}

      {/* DECISION ACTIONS */}
      {artifact.actionState === "OPEN" && options && (
        <div className="slack-actions">
          {options.map((opt) => (
            <button
              key={opt.id}
              disabled={loading}
              onClick={() => onDecide(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {artifact.actionState === "ACTED" && (
        <div className="decision-confirmation">
          Decision submitted: {artifact.chosenAction}
        </div>
      )}

      {artifact.actionState === "EXPIRED" && (
        <div className="decision-confirmation">
          Decision window expired
        </div>
      )}

    </div>
  );
}