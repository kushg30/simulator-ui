export default function ArtifactList({ artifacts, selectedId, onSelect, typeLabels = {} }) {

  const safeParse = (data) => {
    try { return typeof data === "string" ? JSON.parse(data) : data; }
    catch { return {}; }
  };

  return (
    <div className="artifact-list">
      {artifacts.map((artifact) => {
        const isSelected = selectedId === artifact.artifactId;
        const payload    = safeParse(artifact.payload);

        const title =
          payload?.title   ||
          payload?.channel ||
          payload?.subject ||
          typeLabels[artifact.artifactType] ||
          artifact.artifactType;

        // Script 1.3: the category tab already says what kind of artifact this is, so the row must
        // NOT repeat a sub-type tag ("Internal Note", "Message", …). Show the sender instead — that is
        // the line the reader actually needs, and it matches the sender convention in 1.4.
        const meta = payload?.from || payload?.channel || "";

        return (
          <div
            key={artifact.artifactId}
            onClick={() => onSelect(artifact)}
            className={[
              "artifact-item",
              artifact.status === "UNREAD" ? "unread"   : "",
              artifact.status === "ACTED"  ? "acted"    : "",
              isSelected                   ? "selected" : "",
            ].join(" ")}
          >
            <div className="title">
              {title}
              {artifact.status === "UNREAD" && <span className="unread-dot" />}
            </div>
            {meta && <div className="meta">{meta}</div>}
          </div>
        );
      })}
    </div>
  );
}
