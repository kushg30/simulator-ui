import { useEffect, useState } from "react";
import { getRemainingSeconds } from "../utils/time";

export default function useCountdown(expiresAt) {
  const [seconds, setSeconds] = useState(
    getRemainingSeconds(expiresAt)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(getRemainingSeconds(expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return seconds;
}