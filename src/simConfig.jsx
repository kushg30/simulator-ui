import { createContext, useContext, useMemo } from "react";

/**
 * Per-simulation configuration for the shared Simulator-1-style player.
 *
 * Simulations 1 and 3 run on the same engine and the same screens; what differs is which simulation
 * a new team is created against, where the routes live, and what the four hidden variables are
 * called at the end. Keeping that in one place means adding a simulation is a config entry rather
 * than a fork of the player — and, more importantly, it means Simulation 1 keeps working exactly as
 * it does today, because its entry restates its current behaviour rather than inheriting a new one.
 *
 * On the variable mapping: both simulations store four values under the same engine keys. Sim 3's
 * script redefines two of them — `organizational_risk` becomes Governance Accountability, where a
 * HIGH value is now good rather than adverse, and `execution_quality` becomes Diagnostic Rigor. The
 * engine arithmetic is untouched; only the label and the direction shown to the reader change.
 */

const SIM1 = {
  key: "sim1",
  id: "475db739-0708-48d4-b4db-5a23f1da50d9",
  name: "Phoenix AI Judgment",
  base: "", // Simulation 1 owns the unprefixed routes it has always owned
  // The final script renames two of the four variables and, for one of them, reverses which end is
  // good: `organizational_risk` now carries Governance Accountability, where a HIGH value means the
  // team could always point to who owned a decision. The storage keys are deliberately unchanged —
  // renaming them would orphan the recorded cohort sessions that reference them.
  reveal: [
    {
      construct: "stakeholder_trust",
      label: "Stakeholder Trust",
      adverse: false,
      meaning: "How much the people outside your leadership team believed you were being straight with them.",
    },
    {
      construct: "organizational_risk",
      label: "Governance Accountability",
      adverse: false,
      meaning: "How clearly your team could always point to who owned a decision, and why.",
    },
    {
      construct: "execution_quality",
      label: "Diagnostic Rigor",
      adverse: false,
      meaning: "How often your team checked claims with evidence instead of assuming.",
    },
    {
      construct: "ethical_exposure",
      label: "Ethical Exposure",
      adverse: true,
      meaning: "How exposed your company would be if today's choices became public tomorrow.",
    },
  ],
};

const SIM3 = {
  key: "sim3",
  id: "5c3d0000-0000-4000-a003-000000000003",
  name: "Trust the Machine",
  base: "/sim3",
  reveal: [
    {
      construct: "stakeholder_trust",
      label: "Stakeholder Trust",
      adverse: false,
      meaning: "How much the people outside your leadership team believed you were being straight with them.",
    },
    {
      construct: "organizational_risk",
      label: "Governance Accountability",
      adverse: false,
      meaning: "How clearly your team could always point to who owned a decision, and why.",
    },
    {
      construct: "execution_quality",
      label: "Diagnostic Rigor",
      adverse: false,
      meaning: "How often your team checked claims with evidence instead of assuming.",
    },
    {
      construct: "ethical_exposure",
      label: "Ethical Exposure",
      adverse: true,
      meaning: "How exposed your company would be if today's choices became public tomorrow.",
    },
  ],
};

export const SIMS = { sim1: SIM1, sim3: SIM3 };

const SimContext = createContext(SIM1);

export function SimProvider({ sim = "sim1", children }) {
  const value = useMemo(() => {
    const cfg = SIMS[sim] || SIM1;
    return {
      ...cfg,
      // Every in-simulation link goes through this, so one config entry moves a whole route tree.
      path: (p) => `${cfg.base}${p.startsWith("/") ? p : `/${p}`}`,
    };
  }, [sim]);
  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}

export function useSim() {
  const cfg = useContext(SimContext);
  // Defensive: a screen rendered outside a provider still behaves as Simulation 1 did before this
  // context existed, rather than throwing.
  return cfg.path ? cfg : { ...SIM1, path: (p) => (p.startsWith("/") ? p : `/${p}`) };
}
