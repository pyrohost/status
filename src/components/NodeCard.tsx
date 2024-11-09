import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronUp,
  Server,
  CpuIcon,
  MemoryStick,
  HardDriveIcon,
} from "lucide-react";
import MetricChart from "./MetricChart";
import CPUCoreGrid from "./CPUCoreGrid";
import { Node, Metrics } from "@/lib/types";
import { formatBytes, formatUptime } from "@/lib/utils";

const LOADING_PHASES = {
  NONE: "NONE",
  BASIC_METRICS: "BASIC_METRICS",
  MEMORY_DETAILS: "MEMORY_DETAILS",
  CPU_GRID: "CPU_GRID",
  DISK_SWAP: "DISK_SWAP",
  IO_METRICS: "IO_METRICS",
} as const;

type LoadingPhase = (typeof LOADING_PHASES)[keyof typeof LOADING_PHASES];

const PHASE_ORDER: LoadingPhase[] = [
  LOADING_PHASES.BASIC_METRICS,
  LOADING_PHASES.MEMORY_DETAILS,
  LOADING_PHASES.CPU_GRID,
  LOADING_PHASES.DISK_SWAP,
  LOADING_PHASES.IO_METRICS,
];

interface NodeCardProps {
  node: Node;
  metrics?:
    | Metrics
    | (Pick<Metrics, "cpu" | "memory" | "disk"> & { uptime?: number });
  isExpanded: boolean;
  onToggle: () => void;
  loading: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  metrics,
  isExpanded,
  onToggle,
  loading,
}) => {
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(
    LOADING_PHASES.NONE
  );
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const mountedRef = useRef(false);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => clearTimeouts, [clearTimeouts]);

  useEffect(() => {
    if (!isExpanded) {
      clearTimeouts();
      setLoadingPhase(LOADING_PHASES.NONE);
      mountedRef.current = false;
      return;
    }

    if (!loading && metrics && !mountedRef.current) {
      mountedRef.current = true;
      setLoadingPhase(LOADING_PHASES.NONE);

      PHASE_ORDER.forEach((phase, index) => {
        const timeout = setTimeout(() => {
          if (!mountedRef.current) return;
          setLoadingPhase(phase);
        }, index * 100);
        timeoutsRef.current.push(timeout);
      });
    }
  }, [isExpanded, loading, metrics, clearTimeouts]);

  const isPhaseLoaded = (phase: LoadingPhase) => {
    if (loadingPhase === LOADING_PHASES.NONE) return false;
    return PHASE_ORDER.indexOf(loadingPhase) >= PHASE_ORDER.indexOf(phase);
  };

  return (
    <Card className="bg-black/50 border-white/10">
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="w-full p-4 pr-6 flex items-center justify-between text-left hover:bg-white/5 cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-4">
          <div className="grid place-content-center p-4 border border-white/10 bg-white/5">
            <Server className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg text-white/80 font-semibold">
              {node.labels.nodename}
            </h3>
            <p className="text-sm text-white/40">
              Uptime:{" "}
              {formatUptime(
                isExpanded
                  ? metrics?.uptime ?? node.uptime ?? 0
                  : node.uptime ?? 0
              )}
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-white/60">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExpanded ? "Show less" : "Show more"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isExpanded && (
        <div className="border-t border-white/10">
          {loading ? (
            <CardContent className="p-6">
              <Skeleton className="h-[100px] w-full bg-white/5 mb-4" />
              <Skeleton className="h-[100px] w-full bg-white/5 mb-4" />
              <Skeleton className="h-[100px] w-full bg-white/5" />
            </CardContent>
          ) : (
            metrics && (
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 border border-white/10 bg-black/50">
                      <h2 className="text-base font-semibold text-white/80 mb-2">
                        System Info
                      </h2>
                      <div className="space-y-1.5 text-sm text-white/60">
                        <p className="flex justify-between">
                          <span>CPU Cores:</span>
                          <span className="font-medium">
                            {node.details?.cpuCores}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span>Total Memory:</span>
                          <span className="font-medium">
                            {formatBytes(node.details?.totalMemory || 0)}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span>Load Average:</span>
                          <span className="font-medium">
                            {metrics && "loadAverage" in metrics
                              ? metrics.loadAverage
                                  ?.slice(-1)[0]
                                  ?.value.toFixed(2) ?? "N/A"
                              : "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>
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
                  </div>

                  {isPhaseLoaded(LOADING_PHASES.BASIC_METRICS) ? (
                    <MetricChart
                      title="CPU Usage"
                      data={metrics.cpu}
                      color="#8884d8"
                    />
                  ) : (
                    <Skeleton className="h-[200px] w-full bg-white/5" />
                  )}

                  {isPhaseLoaded(LOADING_PHASES.MEMORY_DETAILS) ? (
                    <MetricChart
                      title="Memory Usage Details"
                      data={
                        "memoryDetails" in metrics
                          ? metrics.memoryDetails
                          : undefined
                      }
                      type="memory"
                    />
                  ) : (
                    <Skeleton className="h-[200px] w-full bg-white/5" />
                  )}

                  {isPhaseLoaded(LOADING_PHASES.CPU_GRID) ? (
                    "cpuPerCore" in metrics ? (
                      <CPUCoreGrid cpuPerCore={metrics.cpuPerCore} />
                    ) : (
                      <Skeleton className="h-[200px] w-full bg-white/5" />
                    )
                  ) : (
                    <Skeleton className="h-[200px] w-full bg-white/5" />
                  )}

                  {isPhaseLoaded(LOADING_PHASES.DISK_SWAP) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MetricChart
                        title="Disk Usage"
                        data={metrics.disk}
                        color="#ffc658"
                      />
                      <MetricChart
                        title="Swap Usage"
                        data={
                          "swapDetails" in metrics
                            ? metrics.swapDetails
                            : undefined
                        }
                        type="swap"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-[200px] w-full bg-white/5" />
                      <Skeleton className="h-[200px] w-full bg-white/5" />
                    </div>
                  )}

                  {isPhaseLoaded(LOADING_PHASES.IO_METRICS) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MetricChart
                        title="Disk I/O"
                        data={"diskIO" in metrics ? metrics.diskIO : []}
                        color="#ff7300"
                        format="bytes"
                      />
                      <MetricChart
                        title="Network I/O"
                        data={"netIO" in metrics ? metrics.netIO : []}
                        color="#0088FE"
                        format="bytes"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-[200px] w-full bg-white/5" />
                      <Skeleton className="h-[200px] w-full bg-white/5" />
                    </div>
                  )}
                </div>
              </CardContent>
            )
          )}
        </div>
      )}
    </Card>
  );
};

export default React.memo(NodeCard, (prevProps, nextProps) => {
  return (
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.loading === nextProps.loading &&
    prevProps.node === nextProps.node &&
    prevProps.metrics === nextProps.metrics
  );
});
