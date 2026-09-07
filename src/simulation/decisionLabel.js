// Human-readable label for a recorded decision. Maps the internal "SILENCE" outcome to the
// script's "No Response" wording (spec 1.7), and resolves an action code to its option label
// (from the artifact's decisionOptions) instead of showing the raw code.
export function decisionLabel(artifact) {
  const action = artifact?.chosenAction;
  if (!action) return "";
  if (action === "SILENCE" || action === "NO_RESPONSE") return "No Response";
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
