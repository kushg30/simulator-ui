import { useEffect, useState } from "react";
import { getWiki } from "./api";

/**
 * Reference wiki (spec 9F) as a slide-in drawer on the round page. Always available, self-serve,
 * and reveals no answers — it exists so a student is not blocked by forgetting a function or a
 * detail already in the dataset, and so the facilitator is not pulled into low-value questions.
 *
 * FUNCTIONS are scoped to the current round; FACTS and FAQ are always shown.
 */
export default function Sim2Reference({ runId, round }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded || !runId) return;
    getWiki(runId, round)
      .then((e) => {
        setEntries(e || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded, runId, round]);

  const bySection = (s) => entries.filter((e) => e.section === s);
  const SectionBlock = ({ title, items }) =>
    items.length === 0 ? null : (
      <div style={{ marginBottom: 18 }}>
        <div className="s2-ref-section">{title}</div>
        {items.map((e) => (
          <details key={e.entryId} className="s2-ref-entry">
            <summary>{e.title}</summary>
            <div className="s2-ref-body">{e.body}</div>
          </details>
        ))}
      </div>
    );

  return (
    <>
      <button className="s2-secondary s2-ref-toggle" onClick={() => setOpen(true)}>
        Reference
      </button>

      {open && (
        <div className="s2-ref-overlay" onClick={() => setOpen(false)}>
          <aside className="s2-ref-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="s2-row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>Reference</h2>
              <button className="s2-secondary" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <p className="s2-sub">
              Functions for this round, company facts, and the faculty FAQ. Nothing here gives away
              an answer.
            </p>
            {!loaded ? (
              <p className="s2-sub">Loading…</p>
            ) : (
              <>
                <SectionBlock title="Functions for this round" items={bySection("FUNCTIONS")} />
                <SectionBlock title="Company facts" items={bySection("FACTS")} />
                <SectionBlock title="FAQ" items={bySection("FAQ")} />
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
