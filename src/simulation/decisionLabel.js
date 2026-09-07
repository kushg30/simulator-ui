// Human-readable label for a recorded decision.
//
// The timeout outcome is stored internally as "SILENCE" and displayed as the script's "No Response"
// (spec 1.7). It is deliberately NOT the same as the Board Message's real option "Do not respond"
// (action code NO_RESPONSE) — 1.7 requires the no-answer outcome to stay distinct from every real
// option, so only SILENCE maps to "No Response"; NO_RESPONSE resolves to its own option label.
export function decisionLabel(artifact) {
  const action = artifact?.chosenAction;
  if (!action) return "";
  if (action === "SILENCE") return "No Response";
  try {
    const opts =
      typeof artifact.decisionOptions === "string"
        ? JSON.parse(artifact.decisionOptions)
        : artifact.decisionOptions;
    const match = (opts || []).find((o) => o.id === action);
    if (match?.label) return match.label;
  } catch {
    /* fall through to the raw code */
  }
  return action;
}
