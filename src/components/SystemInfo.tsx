import React from "react";
import { formatBytes } from "@/lib/utils";

interface SystemInfoProps {
  cpuModel: string;
  cpuCores: number;
  totalMemory: number;
  loadAverage?: number;
}

const SystemInfo: React.FC<SystemInfoProps> = ({
  cpuModel,
  cpuCores,
  totalMemory,
  loadAverage,
}) => (
  <div className="p-4 border border-white/10 bg-black/50">
    <h2 className="text-base font-semibold text-white/80 mb-2">System Info</h2>
    <div className="space-y-1.5 text-sm text-white/60">
      <p className="flex justify-between">
        <span>CPU Model:</span>
        <span className="font-medium text-right">{cpuModel || "Unknown"}</span>
      </p>
      <p className="flex justify-between">
        <span>CPU Threads:</span>
        <span className="font-medium">{cpuCores}</span>
      </p>
      <p className="flex justify-between">
        <span>Total Memory:</span>
        <span className="font-medium">{formatBytes(totalMemory || 0)}</span>
      </p>
      <p className="flex justify-between">
        <span>Load Average:</span>
        <span className="font-medium">
          {loadAverage !== undefined ? loadAverage.toFixed(2) : "N/A"}
        </span>
      </p>
    </div>
  </div>
);

export default React.memo(SystemInfo);
