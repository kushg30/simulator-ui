import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimulationPage from "./simulation/simulationPage";
import HomePage from "./pages/HomePage";
import ContextPage from "./pages/ContextPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import TeamJoinPage from "./pages/TeamJoin";
import WaitingPage from "./pages/WaitingPage";
import ResultsDashboard from "./pages/ResultsDashboard";

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
    const N = 45, DIST = 130;
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
            const a   = (1 - d / DIST) * 0.2;
            const maj = nodes[i].major || nodes[j].major;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = maj
              ? `rgba(201,168,76,${a})`
              : `rgba(59,130,246,${a})`;
            ctx.lineWidth = maj ? 0.75 : 0.4;
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const pf = 0.85 + Math.sin(n.pulse) * 0.15;
        const r  = n.r * pf;
        if (n.major) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(201,168,76,0.05)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(201,168,76,${0.65 + Math.sin(n.pulse) * 0.2})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59,130,246,${0.3 + Math.sin(n.pulse) * 0.1})`;
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
      <Route path="/teamjoin"       element={<TeamJoinPage />} />
      <Route path="/context"        element={<ContextPage />} />
      <Route path="/role-selection" element={<RoleSelectionPage />} />
      <Route path="/waiting"        element={<WaitingPage />} />
      <Route path="/"               element={<HomePage />} />
      <Route path="/simulator"      element={<SimulationPage />} />
      <Route path="/results" element={
        <ResultsDashboard
          runId="b863544b-ff4f-47dd-a7aa-ce23657b098b"
          participantId="09f7d1cf-fdca-404e-85bb-66d407342ca9"
          role="CFO"
        />
      } />
    </Routes>
  );
}
