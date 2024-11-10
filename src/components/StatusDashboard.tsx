"use client";

import React, {
  useState,
  useTransition,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeScale } from "@/components/TimeScaleContext";
import {
  ServerCogIcon,
  ServerIcon,
  CpuIcon,
  MemoryStick,
  HardDriveIcon,
  ActivityIcon,
  DiscIcon,
  NetworkIcon,
} from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import {
  useClusterMetrics,
  useNodes,
  useNodeDetails,
  useNodeMetrics,
} from "@/lib/hooks";
import {
  Node as AppNode,
  MergedNode,
  NodeDetailsMap,
  Metrics,
} from "@/lib/types";

const MetricCard = React.lazy(() => import("./MetricCard"));
const NodeCard = React.lazy(() => import("./NodeCard"));

export default function StatusDashboard() {
  const { timeScale } = useTimeScale();
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { data: clusterMetrics } = useClusterMetrics(timeScale);

  const safeMetricsData = {
    cpu: clusterMetrics?.cpu ?? [],
    memory: clusterMetrics?.memory ?? [],
    disk: clusterMetrics?.disk ?? [],
    diskIO: clusterMetrics?.diskIO ?? [],
    netIO: clusterMetrics?.netIO ?? [],
    loadAverage: clusterMetrics?.loadAverage ?? [],
  };

  const { nodes: basicNodes = [], loading: nodesLoading } = useNodes();
  const { data: nodeDetails } = useNodeDetails(
    expandedNodes.join(","),
    expandedNodes.length > 0,
  ) as { data: NodeDetailsMap | undefined };
  const { data: detailedMetricsData } = useNodeMetrics(
    expandedNodes,
    timeScale,
    expandedNodes.length > 0,
  );

  useEffect(() => {
    setError(
      !basicNodes.length && !nodesLoading
        ? "No nodes found. Please check your connection."
        : null,
    );
  }, [basicNodes.length, nodesLoading]);

  const getNodeDetails = useCallback(
    (node: AppNode) => {
      const instance = node.labels.instance;
      return {
        details: nodeDetails?.[instance]?.details ?? {
          cpuCores: 0,
          totalMemory: 0,
        },
        nodename: node.labels.nodename,
      };
    },
    [nodeDetails],
  );

  const handleNodeToggle = useCallback((instance: string) => {
    startTransition(() => {
      setExpandedNodes((prev) => {
        if (prev.includes(instance)) {
          return prev.filter((n) => n !== instance);
        }
        // Allow multiple nodes by adding to array
        return [...prev, instance];
      });
    });
  }, []);

  const mergedNodes = useMemo<MergedNode[]>(() => {
    if (!basicNodes?.length) return [];

    return basicNodes
      .filter((node) => node.health === "up" && node.labels.instance)
      .map((node) => {
        const { details } = getNodeDetails(node);
        const nodename =
          node.labels.nodename || node.labels.instance.split(":")[0];
        return {
          ...node,
          details: {
            cpuModel: details?.cpuModel ?? "Unknown",
            cpuCores: details?.cpuCores ?? 0,
            totalMemory: details?.totalMemory ?? 0,
          },
          labels: {
            ...node.labels,
            nodename,
            instance: node.labels.instance,
            job: node.labels.job,
            displayName: nodename,
          },
        };
      })
      .sort((a, b) =>
        (a.labels.nodename || "").localeCompare(b.labels.nodename || ""),
      );
  }, [basicNodes, getNodeDetails]);

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <main className="max-w-[84rem] w-full mx-auto px-4 pb-8">
        {error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex justify-between items-center"></div>
            <React.Suspense
              fallback={
                <div className="text-center text-white">
                  Loading cluster metrics...
                </div>
              }
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
                <CardHeader>
                  <CardTitle className="text-xl text-white font-semibold">
                    <div className="flex items-center space-x-2">
                      <ServerCogIcon className="h-6 w-6 text-white" />
                      <span>Cluster Metrics (Averages)</span>
                    </div>
                  </CardTitle>

                  <section className="text-sm text-neutral-400">
                    <p>
                      Real-time monitoring of the cluster&apos;s performance.
                    </p>
                    <p>
                      Metrics are updated every 30 seconds and represent the
                      averages of all nodes.
                    </p>
                  </section>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <React.Suspense
                      fallback={
                        <Skeleton className="h-[200px] w-full bg-white/5" />
                      }
                    >
                      <MetricCard
                        title="Average CPU Usage"
                        value={safeMetricsData.cpu.slice(-1)[0]?.value || 0}
                        data={safeMetricsData.cpu}
                        dataKey="value"
                        color="#FF6384"
                        icon={<CpuIcon className="h-5 w-5 text-white" />}
                        loading={!clusterMetrics}
                      />
                    </React.Suspense>
                    <React.Suspense
                      fallback={
                        <Skeleton className="h-[200px] w-full bg-white/5" />
                      }
                    >
                      <MetricCard
                        title="Average Memory Usage"
                        value={safeMetricsData.memory.slice(-1)[0]?.value || 0}
                        data={safeMetricsData.memory}
                        dataKey="value"
                        color="#36A2EB"
                        icon={<MemoryStick className="h-5 w-5 text-white" />}
                        loading={!clusterMetrics}
                      />
                    </React.Suspense>
                    <React.Suspense
                      fallback={
                        <Skeleton className="h-[200px] w-full bg-white/5" />
                      }
                    >
                      <MetricCard
                        title="Average Disk Usage"
                        value={safeMetricsData.disk.slice(-1)[0]?.value || 0}
                        data={safeMetricsData.disk}
                        dataKey="value"
                        color="#FFCE56"
                        icon={<HardDriveIcon className="h-5 w-5 text-white" />}
                        loading={!clusterMetrics}
                      />
                    </React.Suspense>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <React.Suspense
                      fallback={
                        <Skeleton className="h-[200px] w-full bg-white/5" />
                      }
                    >
                      <MetricCard
                        title="Average Load"
                        value={
                          safeMetricsData.loadAverage.slice(-1)[0]?.value || 0
                        }
                        data={safeMetricsData.loadAverage}
                        dataKey="value"
                        color="#4BC0C0"
                        format="number"
                        icon={<ActivityIcon className="h-5 w-5 text-white" />}
                        loading={!clusterMetrics}
                      />
                    </React.Suspense>
                    <React.Suspense
                      fallback={
                        <Skeleton className="h-[200px] w-full bg-white/5" />
                      }
                    >
                      <MetricCard
                        title="Average Disk I/O"
                        value={safeMetricsData.diskIO.slice(-1)[0]?.value || 0}
                        data={safeMetricsData.diskIO}
                        dataKey="value"
                        color="#9966FF"
                        format="bytes"
                        icon={<DiscIcon className="h-5 w-5 text-white" />}
                        loading={!clusterMetrics}
                      />
                    </React.Suspense>
                    <React.Suspense
                      fallback={
                        <Skeleton className="h-[200px] w-full bg-white/5" />
                      }
                    >
                      <MetricCard
                        title="Average Network I/O"
                        value={safeMetricsData.netIO.slice(-1)[0]?.value || 0}
                        data={safeMetricsData.netIO}
                        dataKey="value"
                        color="#FF9F40"
                        format="bytes"
                        icon={<NetworkIcon className="h-5 w-5 text-white" />}
                        loading={!clusterMetrics}
                      />
                    </React.Suspense>
                  </div>
                </CardContent>
              </Card>
            </React.Suspense>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-white font-semibold">
                  <div className="flex items-center space-x-2">
                    <ServerIcon className="h-6 w-6 text-white" />
                    <span>Node Metrics</span>
                  </div>
                </CardTitle>

                <section className="text-sm text-neutral-400">
                  <p>Performance and health metrics for individual nodes.</p>
                  <p>
                    Detailed metrics are updated every 10 seconds when expanded.
                  </p>
                </section>
              </CardHeader>
              <CardContent>
                {nodesLoading ? (
                  <Skeleton className="h-[100px] w-full bg-white/5" />
                ) : (
                  mergedNodes.map((node: MergedNode) => (
                    <React.Suspense
                      key={node.labels.instance}
                      fallback={
                        <Skeleton className="h-[100px] w-full bg-white/5" />
                      }
                    >
                      <NodeCard
                        node={node}
                        metrics={
                          expandedNodes.includes(node.labels.instance)
                            ? (detailedMetricsData?.[node.labels.instance] as
                                | Metrics
                                | undefined)
                            : undefined
                        }
                        isExpanded={expandedNodes.includes(
                          node.labels.instance,
                        )}
                        onToggle={() => handleNodeToggle(node.labels.instance)}
                        loading={
                          expandedNodes.includes(node.labels.instance) &&
                          !detailedMetricsData
                        }
                      />
                    </React.Suspense>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
