import { useEffect, useState } from "react";
import { getWiki } from "./api";

/**
 * Reference wiki (spec 9F) as a slide-in drawer on the round page. Always available, self-serve,
 * and reveals no answers.
 *
 * FUNCTIONS are scoped to the current round; FACTS and FAQ are always shown. The expanded entry is
 * held in component state (not a native <details>), so the page's 3s poll re-render cannot collapse
 * what the user is reading.
 */
export default function Sim2Reference({ runId, round }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(null); // entryId currently open

  useEffect(() => {
    if (!open || loaded || !runId) return;
    getWiki(runId, round)
      .then((e) => {
        setEntries(e || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded, runId, round]);

  const sections = [
    ["FACTS", "Company facts"],
    ["FAQ", "FAQ"],
  ];

  return (
    <>
      <button className="s2-secondary s2-ref-toggle" onClick={() => setOpen(true)}>
        Reference
      </button>

      {open && (
        <>
          <div className="s2-ref-backdrop" onClick={() => setOpen(false)} />
          <aside className="s2-ref-drawer">
            <div className="s2-row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>Reference</h2>
              <button className="s2-secondary" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            {!loaded ? (
              <p className="s2-sub">Loading…</p>
            ) : (
              sections.map(([section, title]) => {
                const items = entries.filter((e) => e.section === section);
                if (items.length === 0) return null;
                return (
                  <div key={section} style={{ marginBottom: 18 }}>
                    <div className="s2-ref-section">{title}</div>
                    {items.map((e) => {
                      const isOpen = expanded === e.entryId;
                      return (
                        <div key={e.entryId} className="s2-ref-entry">
                          <button
                            type="button"
                            className="s2-ref-entry-head"
                            onClick={() => setExpanded(isOpen ? null : e.entryId)}
                          >
                            <span>{e.title}</span>
                            <span className="s2-ref-caret">{isOpen ? "–" : "+"}</span>
                          </button>
                          {isOpen && <div className="s2-ref-body">{e.body}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </aside>
        </>
      )}
    </>
  );
}
