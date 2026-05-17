# ResultsDashboard — Integration Guide

## 1. Files to add
- `ResultsDashboard.jsx` → `src/simulation/`
- `ResultsDashboard.css` → `src/simulation/`

## 2. Wire into SimulationPage.jsx

Add a `roundComplete` state and show the dashboard when Round 1 ends:

```jsx
import ResultsDashboard from "./ResultsDashboard";

// Inside SimulationPage:
const [roundComplete, setRoundComplete] = useState(false);

// Trigger when T+27 screen flash (CEO final decision) is submitted,
// OR when the run timer hits 30 minutes:
useEffect(() => {
  if (simSeconds >= 1800) {   // 30 min = 1800 seconds
    setRoundComplete(true);
  }
}, [simSeconds]);

// In your return:
if (roundComplete) {
  return (
    <ResultsDashboard
      runId={runId}
      participantId={participantId}
      role={role}
      onContinue={() => {
        // Navigate to Round 2, or reset state
        setRoundComplete(false);
      }}
    />
  );
}
```

## 3. Or trigger manually after CEO final decision

In `ArtifactDetail.jsx`, after the final SCREEN_FLASH decision is submitted,
call a prop callback:

```jsx
// Pass onRoundComplete down from SimulationPage → ArtifactDetail
// After handleDecision succeeds and artifact.payload.is_final_round_decision:
if (payload?.is_final_round_decision) {
  onRoundComplete?.();
}
```

## 4. Band logic (0–100 → Low/Medium/High)
| Score  | Band   |
|--------|--------|
| 0–33   | Low    |
| 34–66  | Medium |
| 67–100 | High   |

## 5. Color logic (direction-aware)
| Construct           | High is... |
|---------------------|------------|
| stakeholder_trust   | Good (green) |
| organizational_risk | Bad  (red)   |
| ethical_exposure    | Bad  (red)   |
| execution_quality   | Good (green) |
