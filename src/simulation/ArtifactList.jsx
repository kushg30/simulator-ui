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

        const typeLabel = typeLabels[artifact.artifactType] || artifact.artifactType;

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
            <div className="meta">{typeLabel}</div>
          </div>
        );
      })}
    </div>
  );
}
