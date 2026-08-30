// src/simulation/ScreenFlashOverlay.jsx
import { useState } from "react";
import "./ScreenFlashOverlay.css";

export default function ScreenFlashOverlay({
  artifact,
  payload,
  options,
  onDecide,
  onDismiss,
  loading,
}) {
  const [selected, setSelected] = useState(null);

  const isFinal    = payload?.is_final_round_decision;
  const isInfoOnly = !artifact.decisionId || artifact.actionState === "READ_ONLY";

  const handleAction = async (optionId) => {
    setSelected(optionId);
    await onDecide(optionId);
  };

  // ── Render action area based on state ───────────────────
  const renderActions = () => {

    // Already acted
    if (artifact.actionState === "ACTED") {
      return (
        <div className="flash-acted">
          <span className="flash-acted-check">✓</span>
          Decision recorded: <strong>{artifact.chosenAction}</strong>
        </div>
      );
    }

    // Expired
    if (artifact.actionState === "EXPIRED") {
      return (
        <div className="flash-expired">Decision window closed</div>
      );
    }

    // Info-only / READ_ONLY — just dismiss
    if (isInfoOnly) {
      return (
        <button className="flash-dismiss" onClick={onDismiss}>
          Acknowledge →
        </button>
      );
    }

    // CEO only — explicit options (not CEO role → show read-only message)
    if (isFinal && options) {
      return (
        <div className="flash-options">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                className={[
                  "flash-option",
                  isSelected              ? "flash-option-selected" : "",
                  selected && !isSelected ? "flash-option-faded"    : "",
                ].join(" ")}
                disabled={loading || selected !== null}
                onClick={() => handleAction(opt.id)}
              >
                {isSelected
                  ? loading ? "Submitting…" : `✓ ${opt.label}`
                  : opt.label}
              </button>
            );
          })}
          <p className="flash-ceo-note">
            Team discusses — CEO submits the final framing.
          </p>
        </div>
      );
    }

    // Generic OPEN with options
    if (options) {
      return (
        <div className="flash-options">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                className={[
                  "flash-option",
                  isSelected              ? "flash-option-selected" : "",
                  selected && !isSelected ? "flash-option-faded"    : "",
                ].join(" ")}
                disabled={loading || selected !== null}
                onClick={() => handleAction(opt.id)}
              >
                {isSelected
                  ? loading ? "Submitting…" : `✓ ${opt.label}`
                  : opt.label}
              </button>
            );
          })}
        </div>
      );
    }

    // Fallback dismiss
    return (
      <button className="flash-dismiss" onClick={onDismiss}>
        Acknowledge →
      </button>
    );
  };

  return (
    <div className="flash-overlay">

      <div className="flash-bg">
        <div className="flash-grid" />
        <div className={`flash-orb ${isFinal ? "orb-final" : "orb-default"}`} />
      </div>

      <div className={`flash-card ${isFinal ? "flash-card-final" : ""}`}>

        <div className="flash-eyebrow">
          {isFinal    ? "CEO Decision Required" :
           isInfoOnly ? "System Broadcast"      :
                        "Action Required"}
        </div>

        <div className="flash-icon">
          {isFinal ? "⚖️" : isInfoOnly ? "📢" : "❗"}
        </div>

        <h2 className="flash-title">{payload?.title}</h2>

        {payload?.body && (
          <p className="flash-body">{payload.body}</p>
        )}

        {renderActions()}

      </div>
    </div>
  );
}
