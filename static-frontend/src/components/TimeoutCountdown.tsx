// components/TimeoutCountdown.tsx
"use client"
import { useEffect, useState } from "react"

export function TimeoutCountdown({ timeout, lastPing }: { timeout: number; lastPing: number }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const deadline = lastPing + timeout
    return Math.max(0, deadline - Math.floor(Date.now() / 1000))
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatted = formatTimeLeft(timeLeft);

  return (
    <div className={`mt-4 p-4 rounded text-center font-mono text-lg font-semibold ${timeLeft === 0
      ? 'bg-red-700 text-white'
      : 'bg-gray-900 text-green-300'
      }`}
    >
      {timeLeft === 0
        ? '⚠️ Timeout Reached! Inheritance will be triggered.'
        : `⏱️ Time Left: ${formatted}`}
    </div>
  );
}

function formatTimeLeft(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
