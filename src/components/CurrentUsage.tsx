import React from "react";
import { CpuIcon, MemoryStick, HardDriveIcon } from "lucide-react";
import { Metrics } from "@/lib/types";

interface CurrentUsageProps {
  metrics: Pick<Metrics, "cpu" | "memory" | "disk">;
}

const CurrentUsage: React.FC<CurrentUsageProps> = ({ metrics }) => (
  <div className="p-4 border border-white/10 bg-black/50">
    <h2 className="text-base font-semibold text-white/80 mb-2">
      Current Usage
    </h2>
    <div className="space-y-1.5 text-sm text-white/60">
      <div className="flex justify-between">
        <div className="flex flex-row items-center">
          <CpuIcon className="h-4 w-4 text-white/60 mr-2" />
          <span>CPU:</span>
        </div>
        <span className="font-medium">
          {metrics.cpu.slice(-1)[0]?.value.toFixed(2)}%
        </span>
      </div>
      <div className="flex justify-between">
        <div className="flex flex-row items-center">
          <MemoryStick className="h-4 w-4 text-white/60 mr-2" />
          <span>Memory:</span>
        </div>
        <span className="font-medium">
          {metrics.memory.slice(-1)[0]?.value.toFixed(2)}%
        </span>
      </div>
      <div className="flex justify-between">
        <div className="flex flex-row items-center">
          <HardDriveIcon className="h-4 w-4 text-white/60 mr-2" />
          <span>Disk:</span>
        </div>
        <span className="font-medium">
          {metrics.disk.slice(-1)[0]?.value.toFixed(2)}%
        </span>
      </div>
    </div>
  </div>
);

export default React.memo(CurrentUsage);
