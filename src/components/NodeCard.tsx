import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  if (loading) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-32 bg-white/5" />
            <Skeleton className="h-4 w-24 bg-white/5" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px] w-full bg-white/5" />
          <Skeleton className="h-[100px] w-full bg-white/5" />
          <Skeleton className="h-[100px] w-full bg-white/5" />
        </CardContent>
      </Card>
    );
  }

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
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-4">
          <Server className="h-5 w-5 text-white" />
          <div>
            <h3 className="text-lg text-white/80 font-semibold">
              {node.labels.nodename}
            </h3>
            <p className="text-sm text-white/40">
              Uptime:{" "}
              {formatUptime(
                isExpanded ? metrics?.uptime ?? 0 : node.uptime ?? 0
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

      {isExpanded && metrics && (
        <div className="border-t border-white/10">
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
                        {metrics?.cpu.slice(-1)[0]?.value.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex flex-row items-center">
                        <MemoryStick className="h-4 w-4 text-white/60 mr-2" />
                        <span>Memory:</span>
                      </div>
                      <span className="font-medium">
                        {metrics?.memory.slice(-1)[0]?.value.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex flex-row items-center">
                        <HardDriveIcon className="h-4 w-4 text-white/60 mr-2" />
                        <span>Disk:</span>
                      </div>
                      <span className="font-medium">
                        {metrics?.disk.slice(-1)[0]?.value.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <MetricChart
                  title="CPU Usage"
                  data={metrics?.cpu}
                  color="#8884d8"
                />
                <MetricChart
                  title="Memory Usage Details"
                  data={
                    "memoryDetails" in metrics
                      ? metrics.memoryDetails
                      : undefined
                  }
                  type="memory"
                />
                {"cpuPerCore" in metrics && (
                  <CPUCoreGrid cpuPerCore={metrics.cpuPerCore} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricChart
                    title="Disk Usage"
                    data={metrics?.disk}
                    color="#ffc658"
                  />
                  <MetricChart
                    title="Swap Usage"
                    data={
                      "swapDetails" in metrics ? metrics.swapDetails : undefined
                    }
                    type="swap"
                  />
                </div>

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
              </div>
            </div>
          </CardContent>
        </div>
      )}
    </Card>
  );
};

export default React.memo(NodeCard);
