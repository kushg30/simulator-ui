import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimulationPage from "./simulation/simulationPage";
import HomePage from "./pages/HomePage";
import ContextPage from "./pages/ContextPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import TeamJoinPage from "./pages/TeamJoin";
import WaitingPage from "./pages/WaitingPage";
import ResultsDashboard from "./pages/ResultsDashboard";

// Simulator 2 — Meridian Retail QBR
import Sim2JoinPage from "./sim2/Sim2JoinPage";
import Sim2ContextPage from "./sim2/Sim2ContextPage";
import Sim2RolePage from "./sim2/Sim2RolePage";
import Sim2WaitingPage from "./sim2/Sim2WaitingPage";
import Sim2RoundPage from "./sim2/Sim2RoundPage";
import Sim2ResultsPage from "./sim2/Sim2ResultsPage";

// Faculty console — platform-wide, controls every simulation
import FacultyConsole from "./faculty/FacultyConsole";

// Access gate — students must enter the facilitator's access code to reach a sim
import SimGate from "./components/SimGate";

// ─────────────────────────────────────────────────────────────
// Neural canvas — runs ONCE for the entire app lifetime.
// Draws on #neural-bg which lives in public/index.html.
// Never stops even when routes change.
// ─────────────────────────────────────────────────────────────
function useNeuralCanvas() {
  useEffect(() => {
    const canvas = document.getElementById("neural-bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const N = 55, DIST = 150;
    let nodes = [], raf;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      nodes = Array.from({ length: N }, () => ({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        vx:    (Math.random() - 0.5) * 0.28,
        vy:    (Math.random() - 0.5) * 0.28,
        r:     Math.random() * 2.2 + 1,
        pulse: Math.random() * Math.PI * 2,
        major: Math.random() < 0.18,
      }));
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.018;
        if (n.x < -10) n.x = W + 10;
        if (n.x > W + 10) n.x = -10;
        if (n.y < -10) n.y = H + 10;
        if (n.y > H + 10) n.y = -10;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < DIST) {
            const a   = (1 - d / DIST) * 0.55;
            const maj = nodes[i].major || nodes[j].major;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = maj
              ? `rgba(201,168,76,${a})`
              : `rgba(59,130,246,${a})`;
            ctx.lineWidth = maj ? 1.2 : 0.7;
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const pf = 0.85 + Math.sin(n.pulse) * 0.15;
        const r  = n.r * pf;
        if (n.major) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(201,168,76,0.12)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(201,168,76,0.25)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(201,168,76,${0.9 + Math.sin(n.pulse) * 0.1})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(59,130,246,0.1)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59,130,246,${0.65 + Math.sin(n.pulse) * 0.15})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    // Never cleans up — runs for entire app lifetime
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []); // empty deps = runs once, never re-runs
}

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
export default function App() {
  useNeuralCanvas();

  return (
    <Routes>
      {/* Public marketing homepage — open to everyone. */}
      <Route path="/"               element={<HomePage />} />

      {/* ── Simulator 1 — ANP Phoenix (access-gated) ─────────────────── */}
      <Route path="/sim1"           element={<SimGate><ContextPage /></SimGate>} />
      <Route path="/teamjoin"       element={<SimGate><TeamJoinPage /></SimGate>} />
      <Route path="/context"        element={<SimGate><ContextPage /></SimGate>} />
      <Route path="/role-selection" element={<SimGate><RoleSelectionPage /></SimGate>} />
      <Route path="/waiting"        element={<SimGate><WaitingPage /></SimGate>} />
      <Route path="/simulator"      element={<SimGate><SimulationPage /></SimGate>} />
      <Route path="/results"        element={<SimGate><ResultsDashboard /></SimGate>} />

      {/* ── Simulator 2 — Meridian Retail QBR (access-gated) ────────────
          Fully separate route tree; Simulation 1's routes above are untouched. */}
      <Route path="/sim2"                      element={<SimGate><Sim2ContextPage /></SimGate>} />
      <Route path="/sim2/join"                 element={<SimGate><Sim2JoinPage /></SimGate>} />
      <Route path="/sim2/roles"                element={<SimGate><Sim2RolePage /></SimGate>} />
      <Route path="/sim2/context"              element={<SimGate><Sim2ContextPage /></SimGate>} />
      <Route path="/sim2/waiting"              element={<SimGate><Sim2WaitingPage /></SimGate>} />
      <Route path="/sim2/round/:roundNumber"   element={<SimGate><Sim2RoundPage /></SimGate>} />
      <Route path="/sim2/results/:roundNumber" element={<SimGate><Sim2ResultsPage /></SimGate>} />

      {/* ── Faculty console — its own facilitator-token login, not the sim gate ── */}
      <Route path="/faculty" element={<FacultyConsole />} />
    </Routes>
  );
}
