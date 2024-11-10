import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Server } from "lucide-react";
import MetricChart from "./MetricChart";
import CPUCoreGrid from "./CPUCoreGrid";
import { Node, Metrics } from "@/lib/types";
import { formatUptime } from "@/lib/utils";
import SystemInfo from "./SystemInfo";
import CurrentUsage from "./CurrentUsage";
import LoadingSkeleton from "./LoadingSkeleton";

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
  // Check if metrics is the full Metrics type by checking for memoryDetails
  const hasDetailedMetrics = metrics && "memoryDetails" in metrics;

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
                  ? (metrics?.uptime ?? node.uptime ?? 0)
                  : (node.uptime ?? 0),
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
            <LoadingSkeleton />
          ) : (
            metrics && (
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <SystemInfo
                      cpuModel={node.details?.cpuModel || "Unknown"}
                      cpuCores={node.details?.cpuCores || 0}
                      totalMemory={node.details?.totalMemory || 0}
                      loadAverage={
                        hasDetailedMetrics && "loadAverage" in metrics
                          ? metrics.loadAverage?.slice(-1)[0]?.value
                          : undefined
                      }
                    />
                    <CurrentUsage metrics={metrics} />
                  </div>

                  <MetricChart
                    title="CPU Usage"
                    data={metrics.cpu}
                    color="#8884d8"
                  />

                  {hasDetailedMetrics && metrics.memoryDetails && (
                    <MetricChart
                      title="Memory Usage Details"
                      data={metrics.memoryDetails}
                      type="memory"
                    />
                  )}

                  {hasDetailedMetrics && metrics.cpuPerCore && (
                    <CPUCoreGrid cpuPerCore={metrics.cpuPerCore} />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MetricChart
                      title="Disk Usage"
                      data={metrics.disk}
                      color="#ffc658"
                    />
                    {hasDetailedMetrics && metrics.swapDetails && (
                      <MetricChart
                        title="Swap Usage"
                        data={metrics.swapDetails}
                        type="swap"
                      />
                    )}
                  </div>

                  {hasDetailedMetrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MetricChart
                        title="Disk I/O"
                        data={metrics.diskIO}
                        color="#ff7300"
                        format="bytes"
                      />
                      <MetricChart
                        title="Network I/O"
                        data={metrics.netIO}
                        color="#0088FE"
                        format="bytes"
                      />
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
