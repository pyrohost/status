"use client";

import React, { useTransition } from "react";
import { timeScales } from "@/lib/utils";
import { useTimeScale } from "@/components/TimeScaleContext";

const TimeScaleSelector: React.FC = () => {
  const { timeScale, setTimeScale } = useTimeScale();
  const [isPending, startTransition] = useTransition();

  const handleTimeScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeScale = parseInt(e.target.value);
    startTransition(() => {
      setTimeScale(newTimeScale);
      window.dispatchEvent(
        new CustomEvent("timeScaleChange", { detail: newTimeScale }),
      );
    });
  };

  return (
    <select
      value={timeScale}
      onChange={handleTimeScaleChange}
      className={`bg-black !h-6 text-xs text-white border border-neutral-700 p-1 ${
        isPending ? "opacity-50" : ""
      }`}
      disabled={isPending}
    >
      {Object.entries(timeScales).map(([label, value]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
};

export default TimeScaleSelector;
