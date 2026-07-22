import { useCallback, useEffect, useState } from "react";
import { addFaq, deleteFaq, editFaq, getWiki } from "./api";

/**
 * Faculty view of the reference wiki (spec 9F). Functions and facts are read-only reference; the
 * FAQ is faculty-maintained and carried across cohorts, so this is where a facilitator adds, edits
 * and removes FAQ entries.
 */
export default function FacultyWiki({ simulationId }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [editing, setEditing] = useState(null); // entryId being edited
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const refresh = useCallback(() => {
    if (!simulationId) return;
    getWiki(simulationId)
      .then((e) => setEntries(e || []))
      .catch((e) => setError(e.message));
  }, [simulationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const faq = entries.filter((e) => e.section === "FAQ");
  const functions = entries.filter((e) => e.section === "FUNCTIONS");
  const facts = entries.filter((e) => e.section === "FACTS");

  async function add() {
    try {
      await addFaq(simulationId, newTitle.trim(), newBody.trim());
      setNewTitle("");
      setNewBody("");
      setMsg("FAQ added");
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function saveEdit() {
    try {
      await editFaq(editing, editTitle.trim(), editBody.trim());
      setEditing(null);
      setMsg("FAQ updated");
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function remove(id) {
    try {
      await deleteFaq(id);
      setMsg("FAQ removed");
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
  }

  if (error) return <p className="f-error">{error}</p>;

  return (
    <div>
      <h2>Faculty FAQ</h2>
      <p className="f-note" style={{ marginBottom: 12 }}>
        Editable and carried across sessions. Students see these in the in-round Reference drawer,
        alongside the read-only function and fact cards below.
      </p>

      {faq.map((e) =>
        editing === e.entryId ? (
          <div key={e.entryId} className="f-card" style={{ background: "#0b0f16" }}>
            <label>Question</label>
            <input value={editTitle} onChange={(ev) => setEditTitle(ev.target.value)} />
            <label>Answer</label>
            <textarea value={editBody} onChange={(ev) => setEditBody(ev.target.value)} />
            <div className="f-row" style={{ marginTop: 10 }}>
              <button onClick={saveEdit}>Save</button>
              <button className="f-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={e.entryId}
            style={{ padding: "10px 0", borderBottom: "1px solid var(--f-border)" }}
          >
            <div className="f-spread">
              <strong>{e.title}</strong>
              <span className="f-row">
                <button
                  className="f-mini"
                  onClick={() => {
                    setEditing(e.entryId);
                    setEditTitle(e.title);
                    setEditBody(e.body);
                  }}
                >
                  edit
                </button>
                <button className="f-mini" onClick={() => remove(e.entryId)}>
                  remove
                </button>
              </span>
            </div>
            <div className="f-note" style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
              {e.body}
            </div>
          </div>
        )
      )}

      {/* add new */}
      <div className="f-card" style={{ marginTop: 14 }}>
        <h2 style={{ marginTop: 0 }}>Add an FAQ</h2>
        <label>Question</label>
        <input
          value={newTitle}
          placeholder="e.g. Which currency are STR05 and STR06 in?"
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <label>Answer</label>
        <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} />
        <div className="f-row" style={{ marginTop: 10 }}>
          <button onClick={add} disabled={!newTitle.trim() || !newBody.trim()}>
            Add FAQ
          </button>
        </div>
      </div>

      {msg && <p className="f-ok">{msg}</p>}

      {/* read-only reference, so faculty can see exactly what students see */}
      <h2 style={{ marginTop: 22 }}>Read-only reference (what students see)</h2>
      <p className="f-note">Function cards ({functions.length}) and company facts ({facts.length})
        are fixed reference and cannot be edited here.</p>
      {[...functions, ...facts].map((e) => (
        <details key={e.entryId} style={{ margin: "6px 0" }}>
          <summary>
            {e.title}
            {e.roundNumber ? <span className="f-note"> · Round {e.roundNumber}</span> : null}
          </summary>
          <div className="f-note" style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
            {e.body}
          </div>
        </details>
      ))}
    </div>
  );
}
