import { useCallback, useEffect, useState } from "react";
import * as api from "./api";
import Collapsible from "./Collapsible";

/**
 * Provisioning — CaseRun staff only.
 *
 * <p>Onboarding an institution is three steps in order: create the organisation, record what they
 * bought, issue each facilitator a key. The screen is laid out in that order because doing them out
 * of order fails — a licence needs an organisation, and a facilitator without a licence cannot
 * create a batch.
 */
export default function FacultyAdmin({ simulations }) {
  const [orgs, setOrgs] = useState(null);
  const [users, setUsers] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [error, setError] = useState("");

  // The key is returned exactly once by the server and is not recoverable afterwards, so it is held
  // here until the operator explicitly dismisses it rather than disappearing on the next render.
  const [issuedKey, setIssuedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgDomain, setOrgDomain] = useState("");
  const [busy, setBusy] = useState("");

  const [licOrg, setLicOrg] = useState("");
  const [licSim, setLicSim] = useState("");
  const [licSeats, setLicSeats] = useState("");
  const [licUntil, setLicUntil] = useState("");

  const [facOrg, setFacOrg] = useState("");
  const [facName, setFacName] = useState("");
  const [facEmail, setFacEmail] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [o, u, e] = await Promise.all([
        api.listOrganizations(),
        api.listFacultyUsers(),
        api.listEntitlements(),
      ]);
      setOrgs(o);
      setUsers(u);
      setEntitlements(e);
      setError("");
    } catch (err) {
      setError(err.message);
      setOrgs([]);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (label, fn) => {
    setBusy(label);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const orgOptions = (orgs || []).map((o) => (
    <option key={o.organizationId} value={o.organizationId}>{o.name}</option>
  ));

  return (
    <div>
      <div className="f-spread">
        <h2 style={{ margin: 0 }}>Provisioning</h2>
        <span className="f-note">CaseRun staff only — institutions, licences and facilitator keys</span>
      </div>
      {error && <p className="f-error">{error}</p>}

      {/* The issued key is the one thing on this screen that cannot be looked up again. */}
      {issuedKey && (
        <div className="f-card f-keycard">
          <h3 style={{ margin: "0 0 6px" }}>Access key for {issuedKey.name}</h3>
          <p className="f-note" style={{ marginTop: 0 }}>
            Send this to {issuedKey.email}. It is stored only as a hash and <b>cannot be shown
            again</b> — if it is lost, issue a new one and disable this account.
          </p>
          <code className="f-keyvalue">{issuedKey.accessKey}</code>
          <div className="f-row" style={{ marginTop: 12 }}>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(issuedKey.accessKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch { /* clipboard blocked; the key is on screen regardless */ }
              }}
            >
              {copied ? "Copied" : "Copy key"}
            </button>
            <button className="f-ghost" onClick={() => { setIssuedKey(null); setCopied(false); }}>
              I have saved it
            </button>
          </div>
        </div>
      )}

      {/* ── 1 ─────────────────────────────────────────────────────────── */}
      <Collapsible title="1 · Institutions" subtitle={`${orgs?.length ?? 0} on the platform`} defaultOpen>
        <label htmlFor="o-name">Institution name</label>
        <input id="o-name" value={orgName} onChange={(e) => setOrgName(e.target.value)}
               placeholder="e.g. SIBM Hyderabad" maxLength={120} />
        <label htmlFor="o-domain">Email domain (optional)</label>
        <input id="o-domain" value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)}
               placeholder="sibm.edu.in" maxLength={120} />
        <div className="f-row" style={{ marginTop: 12 }}>
          <button
            disabled={!orgName.trim() || busy === "org"}
            onClick={() => run("org", async () => {
              await api.createOrganization(orgName.trim(), orgDomain.trim() || null, null);
              setOrgName("");
              setOrgDomain("");
            })}
          >
            {busy === "org" ? "Creating…" : "Add institution"}
          </button>
        </div>

        {orgs === null && <p className="f-note">Loading…</p>}
        {orgs !== null && orgs.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table>
              <thead>
                <tr><th>Institution</th><th>Domain</th><th>Facilitators</th><th>Licences</th><th>Status</th></tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.organizationId}>
                    <td><strong>{o.name}</strong></td>
                    <td className="f-note">{o.emailDomain || "—"}</td>
                    <td className="f-note">{o.facultyCount}</td>
                    <td className="f-note">{o.entitlementCount}</td>
                    <td className="f-note">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Collapsible>

      {/* ── 2 ─────────────────────────────────────────────────────────── */}
      <Collapsible title="2 · Licences" subtitle={`${entitlements.length} recorded`} defaultOpen>
        <p className="f-note" style={{ marginTop: 0 }}>
          A licence is what lets an institution create a batch. Without one, its facilitators can
          sign in but cannot run anything.
        </p>
        <label htmlFor="l-org">Institution</label>
        <select id="l-org" value={licOrg} onChange={(e) => setLicOrg(e.target.value)}>
          <option value="">Select…</option>
          {orgOptions}
        </select>
        <label htmlFor="l-sim">Simulation</label>
        <select id="l-sim" value={licSim} onChange={(e) => setLicSim(e.target.value)}>
          <option value="">Select…</option>
          {simulations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label htmlFor="l-seats">Seats (optional)</label>
        <input id="l-seats" type="number" min="1" value={licSeats}
               onChange={(e) => setLicSeats(e.target.value)} placeholder="e.g. 60" />
        <label htmlFor="l-until">Valid until (optional)</label>
        <input id="l-until" type="date" value={licUntil} onChange={(e) => setLicUntil(e.target.value)} />
        <div className="f-row" style={{ marginTop: 12 }}>
          <button
            disabled={!licOrg || !licSim || busy === "lic"}
            onClick={() => run("lic", async () => {
              await api.grantEntitlement(licOrg, licSim,
                licSeats ? Number(licSeats) : null, licUntil || null, null);
              setLicSeats("");
              setLicUntil("");
            })}
          >
            {busy === "lic" ? "Recording…" : "Grant licence"}
          </button>
        </div>

        {entitlements.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table>
              <thead>
                <tr><th>Institution</th><th>Simulation</th><th>Seats</th><th>Valid until</th></tr>
              </thead>
              <tbody>
                {entitlements.map((e) => (
                  <tr key={e.entitlementId}>
                    <td>{e.organizationName}</td>
                    <td className="f-note">{e.simulationName || e.simulationId}</td>
                    <td className="f-note">{e.seats ?? "unlimited"}</td>
                    <td className="f-note">{e.validUntil || "no expiry"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Collapsible>

      {/* ── 3 ─────────────────────────────────────────────────────────── */}
      <Collapsible title="3 · Facilitators" subtitle={`${users.length} accounts`} defaultOpen>
        <label htmlFor="f-org">Institution</label>
        <select id="f-org" value={facOrg} onChange={(e) => setFacOrg(e.target.value)}>
          <option value="">Select…</option>
          {orgOptions}
        </select>
        <label htmlFor="f-name">Name</label>
        <input id="f-name" value={facName} onChange={(e) => setFacName(e.target.value)}
               placeholder="e.g. Prof. Rao" maxLength={120} />
        <label htmlFor="f-email">Official email</label>
        <input id="f-email" type="email" value={facEmail} onChange={(e) => setFacEmail(e.target.value)}
               placeholder="rao@sibm.edu.in" maxLength={190} />
        <div className="f-row" style={{ marginTop: 12 }}>
          <button
            disabled={!facOrg || !facName.trim() || !facEmail.trim() || busy === "fac"}
            onClick={() => run("fac", async () => {
              const made = await api.createFacultyUser(facOrg, facName.trim(), facEmail.trim(), false);
              setIssuedKey(made);
              setFacName("");
              setFacEmail("");
            })}
          >
            {busy === "fac" ? "Issuing…" : "Create facilitator & issue key"}
          </button>
        </div>

        {users.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Institution</th><th>Last seen</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.facultyUserId} className={u.status === "DISABLED" ? "f-dim" : ""}>
                    <td>
                      <strong>{u.name}</strong>
                      {u.platformAdmin && <span className="f-flag"> staff</span>}
                    </td>
                    <td className="f-note">{u.email}</td>
                    <td className="f-note">{u.organizationName || "—"}</td>
                    <td className="f-note">{u.lastSeenAt ? String(u.lastSeenAt).replace("T", " ").slice(0, 16) : "never"}</td>
                    <td className="f-note">{u.status === "ACTIVE" ? "Active" : "Disabled"}</td>
                    <td>
                      <button
                        className="f-ghost"
                        onClick={() => run("tog", () =>
                          api.setFacultyEnabled(u.facultyUserId, u.status !== "ACTIVE"))}
                      >
                        {u.status === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="f-note" style={{ marginTop: 12 }}>
          Disabling revokes that person's key on their very next request. Use it when someone leaves,
          or when a key may have been shared.
        </p>
      </Collapsible>
    </div>
  );
}
