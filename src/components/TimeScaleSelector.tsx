"use client";

import React from "react";
import { timeScales } from "./StatusDashboard";
import { useTimeScale } from "@/components/TimeScaleContext";

const TimeScaleSelector: React.FC = () => {
  const { timeScale, isTimeScaleLoading, setTimeScale, setIsTimeScaleLoading } =
    useTimeScale();

  const handleTimeScaleChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newTimeScale = parseInt(e.target.value);
    setIsTimeScaleLoading(true);
    setTimeScale(newTimeScale);

    // Wait for next render cycle to ensure state is updated
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Trigger data refresh via custom event
    window.dispatchEvent(
      new CustomEvent("timeScaleChange", { detail: newTimeScale })
    );
  };

  return (
    <select
      value={timeScale}
      onChange={handleTimeScaleChange}
      className={`bg-black !h-6 text-xs text-white border border-neutral-700 p-1 ${
        isTimeScaleLoading ? "opacity-50" : ""
      }`}
      disabled={isTimeScaleLoading}
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
