"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { timeScales } from "@/lib/utils";

interface TimeScaleContextType {
  timeScale: number;
  setTimeScale: (scale: number) => void;
  isTimeScaleLoading: boolean;
  setIsTimeScaleLoading: (loading: boolean) => void;
}

const TimeScaleContext = createContext<TimeScaleContextType | undefined>(
  undefined,
);

export function TimeScaleProvider({ children }: { children: React.ReactNode }) {
  const [timeScale, setTimeScale] = useState(timeScales["1h"]);
  const [isTimeScaleLoading, setIsTimeScaleLoading] = useState(false);

  const contextValue = useMemo(
    () => ({
      timeScale,
      setTimeScale,
      isTimeScaleLoading,
      setIsTimeScaleLoading,
    }),
    [timeScale, isTimeScaleLoading],
  );

  return (
    <TimeScaleContext.Provider value={contextValue}>
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
