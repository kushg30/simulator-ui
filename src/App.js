import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimulationPage from "./simulation/simulationPage";
import HomePage from "./pages/HomePage";
import ContextPage from "./pages/ContextPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import TeamJoinPage from "./pages/TeamJoin";
import WaitingPage from "./pages/WaitingPage";
import ResultsDashboard from "./pages/ResultsDashboard";

export default function App() {
  return (
  
      <Routes>
        <Route path="/teamjoin" element={<TeamJoinPage />} />
        <Route path="/context" element={<ContextPage />} />
        <Route path="/role-selection" element={<RoleSelectionPage />} />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/simulator" element={<SimulationPage />} />

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