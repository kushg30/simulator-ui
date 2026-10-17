import { useState } from "react";
import API_BASE from "../config";
import "./SimGate.css";

/**
 * Where the resolved batch is remembered for the rest of the browser session, so team creation can
 * attach the team to it. sessionStorage, not localStorage: a shared classroom machine should not
 * carry one cohort's identity into the next class.
 */
export const COHORT_KEY = "simCohortId";
export const COHORT_NAME_KEY = "simCohortName";

/** Reads the batch the student entered, if any. Null means a demo/internal run with no cohort. */
export function getCohortId() {
  return sessionStorage.getItem(COHORT_KEY) || null;
}

export function getCohortName() {
  return sessionStorage.getItem(COHORT_NAME_KEY) || null;
}

/**
 * Which simulation each gate guards, so a batch code issued for one cannot open another.
 * Kept here rather than imported from the faculty console, which students never load.
 */
const SIM_IDS = {
  sim1: "475db739-0708-48d4-b4db-5a23f1da50d9",
  sim3: "5c3d0000-0000-4000-a003-000000000003",
  sim2: "5116d200-0000-4000-a000-000000000002",
};

// Soft access gate for the live simulations. Before a student can reach a
// simulation, they must enter the access code the facilitator announces. This is
// a lightweight barrier to keep the public from wandering into a live sim — it is
// NOT a security boundary (the check runs in the browser). Real per-session
// enforcement, if needed later, belongs on the backend.
// Per-simulation access codes. Both simulations currently use SPARTA. They are still separate
// entries, each with its own grant flag, so unlocking one does not unlock the other and the two can
// be given different codes again without touching anything else. Codes are overridable
// per-environment via env vars; the legacy REACT_APP_SIM_ACCESS_CODE still backs Sim 2.
const CODES = {
  sim1: process.env.REACT_APP_SIM1_ACCESS_CODE || "SPARTA",
  sim3: process.env.REACT_APP_SIM3_ACCESS_CODE || "SPARTA",
  sim2:
    process.env.REACT_APP_SIM2_ACCESS_CODE ||
    process.env.REACT_APP_SIM_ACCESS_CODE ||
    "SPARTA",
};

export default function SimGate({ children, sim = "sim2" }) {
  const ACCESS_CODE = CODES[sim] || CODES.sim2;
  const FLAG_KEY = `simAccessGranted:${sim}`;

  const [granted, setGranted] = useState(
    () => sessionStorage.getItem(FLAG_KEY) === "1"
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  if (granted) return children;

  /**
   * Two kinds of code open this gate.
   *
   * A BATCH code identifies the cohort a facilitator created, and is the one that matters: it ties
   * every team the class goes on to create to the institution that holds the licence, which is what
   * makes the facilitator's console show their own students and nobody else's.
   *
   * The legacy static code still works, and grants access with no cohort. It is what the platform's
   * own demo and internal runs use, and removing it would break them for no gain. A team created
   * that way simply belongs to no customer.
   *
   * The batch code is tried first, so a real cohort always wins.
   */
  const submit = async (e) => {
    e.preventDefault();
    const entered = code.trim();
    if (!entered || checking) return;

    setChecking(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/cohorts/resolve/${encodeURIComponent(entered)}`
      );
      if (res.ok) {
        const cohort = await res.json();
        // A batch belongs to exactly one simulation. Entering Phoenix's code on the Meridian page
        // must not open it — the server refuses the mismatch too, but catching it here tells the
        // student something useful instead of letting them fail later at team creation.
        if (SIM_IDS[sim] && cohort.simulationId !== SIM_IDS[sim]) {
          setError("That batch code is for a different simulation.");
          return;
        }
        sessionStorage.setItem(FLAG_KEY, "1");
        sessionStorage.setItem(COHORT_KEY, cohort.cohortId);
        sessionStorage.setItem(COHORT_NAME_KEY, cohort.cohortName || "");
        setGranted(true);
        return;
      }
    } catch {
      // Network or cold backend. Fall through to the static code so a demo is never blocked by
      // the cohort lookup being unreachable.
    } finally {
      setChecking(false);
    }

    if (entered.toUpperCase() === ACCESS_CODE.toUpperCase()) {
      sessionStorage.setItem(FLAG_KEY, "1");
      // No cohort: this is a demo or internal run, and belongs to no institution.
      sessionStorage.removeItem(COHORT_KEY);
      sessionStorage.removeItem(COHORT_NAME_KEY);
      setGranted(true);
      return;
    }

    setError("That code was not recognised. Please check with your facilitator.");
  };

  return (
    <div className="simgate">
      <form className="simgate-card" onSubmit={submit}>
        <div className="simgate-eyebrow">CaseRun · Access required</div>
        <h1>Enter your batch code</h1>
        <p>
          This simulation is open only during a facilitated session. Enter the
          batch code your facilitator gave you to continue.
        </p>
        <input
          type="text"
          className="simgate-input"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError("");
          }}
          placeholder="Batch code"
          autoFocus
          autoComplete="off"
          spellCheck="false"
          aria-label="Batch code"
        />
        {error && <div className="simgate-error">{error}</div>}
        <button type="submit" className="simgate-btn" disabled={!code.trim() || checking}>
          {checking ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
