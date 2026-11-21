import { useCallback, useEffect, useState } from "react";
import * as api from "./api";

/**
 * Batches — the cohorts a facilitator runs, and the join codes their students type.
 *
 * <p>A batch can only be created for a simulation the institution is licensed for; the server
 * enforces that and this screen simply does not offer the others, so a facilitator never picks an
 * option that is going to be refused.
 */
/** A year out, in the YYYY-MM-DD the licence endpoint expects. A sensible default nobody has to think about. */
function defaultValidUntil() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function FacultyBatches({ identity, simulations }) {
  const [cohorts, setCohorts] = useState(null); // null = not loaded yet
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [name, setName] = useState("");
  const [simulationId, setSimulationId] = useState("");
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(null); // cohortId awaiting confirmation
  const [copied, setCopied] = useState(null);

  // Platform staff only. A facilitator already belongs to one institution and never sees these.
  const isAdmin = !!identity?.platformAdmin;
  const [orgName, setOrgName] = useState("");
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [orgs, setOrgs] = useState([]);

  const refresh = useCallback(async () => {
    try {
      setCohorts(await api.listCohorts());
      setError("");
    } catch (e) {
      setError(e.message);
      setCohorts([]);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // The existing institutions, offered as suggestions so a second batch for the same college
  // reuses it instead of creating a near-duplicate ("IMT" vs "IMT ").
  useEffect(() => {
    if (!isAdmin) return;
    api.listOrganizations().then(setOrgs).catch(() => setOrgs([]));
  }, [isAdmin]);

  // Only simulations this institution may actually run. Platform staff are unrestricted, so they
  // see the full list.
  const available = identity?.unrestricted
    ? simulations
    : simulations.filter((s) => (identity?.entitledSimulationIds || []).includes(s.id));

  useEffect(() => {
    if (!simulationId && available.length) setSimulationId(available[0].id);
  }, [available, simulationId]);

  async function create(e) {
    e.preventDefault();
    if (!name.trim() || !simulationId || creating) return;
    if (isAdmin && !orgName.trim()) return;
    setCreating(true);
    setError("");
    setNotice("");
    try {
      let organizationId = identity?.organizationId || null;

      // Platform staff name the institution in plain words rather than pasting a UUID. Reuse the
      // existing one where the name already exists, so running a second batch for the same college
      // does not quietly create a second institution with its own separate results.
      if (isAdmin) {
        const wanted = orgName.trim();
        const existing = orgs.find(
          (o) => (o.name || "").trim().toLowerCase() === wanted.toLowerCase()
        );
        if (existing) {
          organizationId = existing.organizationId;
        } else {
          const org = await api.createOrganization(wanted, null, null);
          organizationId = org.organizationId;
          setOrgs((prev) => [...prev, { organizationId, name: wanted }]);
        }

        // The licence. Upserted, so re-running this for an institution that already has one simply
        // moves its end date rather than failing or stacking duplicates.
        await api.grantEntitlement(organizationId, simulationId, null, validUntil || null, null);
      }

      const made = await api.createCohort(simulationId, name.trim(), organizationId);
      setNotice(
        isAdmin
          ? `Batch created for ${orgName.trim()}. Students join with code ${made.joinCode}.`
          : `Batch created. Students join with code ${made.joinCode}.`
      );
      setName("");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function confirmClose(cohortId) {
    setError("");
    setNotice("");
    try {
      await api.closeCohort(cohortId);
      setNotice("Batch closed. Its join code no longer works.");
      setClosing(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
    } catch {
      // Clipboard is blocked in some embedded/insecure contexts. The code is on screen anyway,
      // so this is a convenience failing, not the feature failing — say nothing and move on.
    }
  };

  const simName = (id) => simulations.find((s) => s.id === id)?.name || "—";

  return (
    <div>
      <div className="f-spread">
        <h2 style={{ margin: 0 }}>Batches</h2>
        <span className="f-note">a batch is one cohort of students, with its own join code</span>
      </div>

      {available.length === 0 && !isAdmin ? (
        <p className="f-note" style={{ marginTop: 12 }}>
          Your institution has no active simulation licence, so there is nothing to create a batch
          for. If that looks wrong, contact CaseRun — a licence may have lapsed.
        </p>
      ) : (
        <form className="f-card" style={{ marginTop: 12 }} onSubmit={create}>
          {isAdmin && (
            <>
              <label htmlFor="b-org">Institution</label>
              <input
                id="b-org"
                type="text"
                value={orgName}
                placeholder="e.g. IMT Ghaziabad"
                onChange={(e) => setOrgName(e.target.value)}
                list="b-org-list"
                maxLength={120}
                autoComplete="off"
              />
              <datalist id="b-org-list">
                {orgs.map((o) => (
                  <option key={o.organizationId} value={o.name} />
                ))}
              </datalist>
              <span className="f-note">
                Type a new institution to set it up, or pick one you have run before.
              </span>
            </>
          )}

          <label htmlFor="b-name">Batch name</label>
          <input
            id="b-name"
            type="text"
            value={name}
            placeholder="e.g. MBA 2027 — Section A"
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
          <label htmlFor="b-sim">Simulation</label>
          <select id="b-sim" value={simulationId} onChange={(e) => setSimulationId(e.target.value)}>
            {available.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {isAdmin && (
            <>
              <label htmlFor="b-until">Licence runs until</label>
              <input
                id="b-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              <span className="f-note">
                After this date the institution cannot start new batches. Batches already running
                are unaffected, and the date can be extended later.
              </span>
            </>
          )}

          <div className="f-row" style={{ marginTop: 14 }}>
            <button
              type="submit"
              disabled={!name.trim() || creating || (isAdmin && !orgName.trim())}
            >
              {creating ? "Creating…" : "Create batch"}
            </button>
          </div>
        </form>
      )}

      {notice && <p className="f-ok">{notice}</p>}
      {error && <p className="f-error">{error}</p>}

      {cohorts === null && <p className="f-note">Loading batches…</p>}

      {cohorts !== null && cohorts.length === 0 && (
        <p className="f-note">No batches yet. Create one above and share its join code with the class.</p>
      )}

      {cohorts !== null && cohorts.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Batch</th>
                <th>Simulation</th>
                <th>Join code</th>
                <th>Teams</th>
                <th>Status</th>
                {identity?.platformAdmin && <th>Institution</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.cohortId} className={c.status === "CLOSED" ? "f-dim" : ""}>
                  <td><strong>{c.name}</strong></td>
                  <td className="f-note">{c.simulationName || simName(c.simulationId)}</td>
                  <td>
                    <button
                      className="f-ghost f-code"
                      title="Copy join code"
                      onClick={() => copyCode(c.joinCode)}
                    >
                      {copied === c.joinCode ? "Copied" : c.joinCode}
                    </button>
                  </td>
                  <td className="f-note">{c.teamCount ?? 0}</td>
                  <td className="f-note">{c.status === "ACTIVE" ? "Active" : "Closed"}</td>
                  {identity?.platformAdmin && <td className="f-note">{c.organizationName}</td>}
                  <td>
                    {c.status === "ACTIVE" && (
                      closing === c.cohortId ? (
                        <span className="f-row">
                          <button className="f-warn" onClick={() => confirmClose(c.cohortId)}>
                            Confirm close
                          </button>
                          <button className="f-ghost" onClick={() => setClosing(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button className="f-ghost" onClick={() => setClosing(c.cohortId)}>Close</button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="f-note" style={{ marginTop: 14 }}>
        Closing a batch retires its join code so the cohort cannot be re-entered next term. Teams
        already played keep their results.
      </p>
    </div>
  );
}
