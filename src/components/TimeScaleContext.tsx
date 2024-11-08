
"use client";

import React, { createContext, useContext, useState } from "react";
import { timeScales } from "@/components/StatusDashboard";

interface TimeScaleContextType {
  timeScale: number;
  setTimeScale: (scale: number) => void;
  isTimeScaleLoading: boolean;
  setIsTimeScaleLoading: (loading: boolean) => void;
}

const TimeScaleContext = createContext<TimeScaleContextType | undefined>(undefined);

export function TimeScaleProvider({ children }: { children: React.ReactNode }) {
  const [timeScale, setTimeScale] = useState(timeScales["1h"]);
  const [isTimeScaleLoading, setIsTimeScaleLoading] = useState(false);

  return (
    <TimeScaleContext.Provider
      value={{ timeScale, setTimeScale, isTimeScaleLoading, setIsTimeScaleLoading }}
    >
      {children}
    </TimeScaleContext.Provider>
  );
}

export function useTimeScale() {
  const context = useContext(TimeScaleContext);
  if (context === undefined) {
    throw new Error("useTimeScale must be used within a TimeScaleProvider");
  }
  return context;
}