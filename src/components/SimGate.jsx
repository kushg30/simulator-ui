import { useState } from "react";
import "./SimGate.css";

// Soft access gate for the live simulations. Before a student can reach a
// simulation, they must enter the access code the facilitator announces. This is
// a lightweight barrier to keep the public from wandering into a live sim — it is
// NOT a security boundary (the check runs in the browser). Real per-session
// enforcement, if needed later, belongs on the backend.
// Per-simulation access codes. Sim 1 uses SIBM, Sim 2 uses SPARTA. Each keeps its
// own grant flag so unlocking one does not unlock the other. Codes are overridable
// per-environment via env vars; the legacy REACT_APP_SIM_ACCESS_CODE still backs Sim 2.
const CODES = {
  sim1: process.env.REACT_APP_SIM1_ACCESS_CODE || "SIBM",
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

  if (granted) return children;

  const submit = (e) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === ACCESS_CODE.toUpperCase()) {
      sessionStorage.setItem(FLAG_KEY, "1");
      setGranted(true);
    } else {
      setError("Incorrect access code. Please check with your facilitator.");
    }
  };

  return (
    <div className="simgate">
      <form className="simgate-card" onSubmit={submit}>
        <div className="simgate-eyebrow">CaseRun · Access required</div>
        <h1>Enter the access code</h1>
        <p>
          This simulation is open only during a facilitated session. Enter the
          access code your facilitator gave you to continue.
        </p>
        <input
          type="text"
          className="simgate-input"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError("");
          }}
          placeholder="Access code"
          autoFocus
          autoComplete="off"
          spellCheck="false"
          aria-label="Access code"
        />
        {error && <div className="simgate-error">{error}</div>}
        <button type="submit" className="simgate-btn">
          Continue
        </button>
      </form>
    </div>
  );
}
