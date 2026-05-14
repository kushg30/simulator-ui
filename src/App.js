import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimulationPage from "./simulation/simulationPage";
import HomePage from "./pages/HomePage";
import ContextPage from "./pages/ContextPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import TeamJoinPage from "./pages/TeamJoin";
import WaitingPage from "./pages/WaitingPage";

export default function App() {
  return (
  
      <Routes>
        <Route path="/teamjoin" element={<TeamJoinPage />} />
        <Route path="/context/:id" element={<ContextPage />} />
        <Route path="/role-selection" element={<RoleSelectionPage />} />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/simulator" element={<SimulationPage />} />

      </Routes>

    
  );
}