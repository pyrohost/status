"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MetricCard from "./MetricCard";
import NodeCard from "./NodeCard";
import {
  fetchClusterAverages,
  fetchBasicMetrics,
  fetchNodeDetails,
  fetchNodeMetrics,
  fetchNodeName,
} from "@/lib/utils";
import { Metrics, ClusterAverages, Node } from "@/lib/types";
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
import { useTimeScale } from "@/components/TimeScaleContext";

export const timeScales = {
  "30m": 1800,
  "1h": 3600,
  "3h": 10800,
  "6h": 21600,
  "12h": 43200,
  "24h": 86400,
  "3d": 259200,
  "1w": 604800,
  "1m": 2592000,
};

export default function StatusDashboard() {
  const { timeScale, setIsTimeScaleLoading, isTimeScaleLoading } = useTimeScale();
  const [metrics, setMetrics] = useState<Record<string, Metrics>>({});
  const [basicMetrics, setBasicMetrics] = useState<
    Record<string, Pick<Metrics, "cpu" | "memory" | "disk">>
  >({});
  const [nodes, setNodes] = useState<Node[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [clusterMetrics, setClusterMetrics] = useState<ClusterAverages | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsCache, setMetricsCache] = useState<
    Record<number, ClusterAverages>
  >({});

  const debouncedTimeScaleChange = useCallback(
    async (newTimeScale: number) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsTimeScaleLoading(true);

      try {
        // Check cache first
        if (metricsCache[newTimeScale]) {
          setClusterMetrics(metricsCache[newTimeScale]);
        } else {
          const clusterData = await fetchClusterAverages(newTimeScale);
          setClusterMetrics(clusterData);
          // Cache the results
          setMetricsCache((prev) => ({
            ...prev,
            [newTimeScale]: clusterData,
          }));
        }

        // Update basic metrics
        const basicNodeMetrics: Record<
          string,
          Pick<Metrics, "cpu" | "memory" | "disk">
        > = {};

        await Promise.all(
          nodes.map(async (node) => {
            const instance = node.labels.instance;
            const basic = await fetchBasicMetrics(instance, newTimeScale);
            basicNodeMetrics[instance] = basic;
          }),
        );

        setBasicMetrics(basicNodeMetrics);
      } catch (err) {
        console.error("Error updating time scale:", err);
      } finally {
        setIsTimeScaleLoading(false);
      }
    },
    [nodes, metricsCache, setIsTimeScaleLoading],
  );

  // Listen for time scale changes
  useEffect(() => {
    const handleTimeScaleChange = (event: CustomEvent<number>) => {
      debouncedTimeScaleChange(event.detail);
    };

    window.addEventListener('timeScaleChange', handleTimeScaleChange as EventListener);
    return () => {
      window.removeEventListener('timeScaleChange', handleTimeScaleChange as EventListener);
    };
  }, [debouncedTimeScaleChange]);

  // Fetch nodes effect
  useEffect(() => {
    const fetchNodes = async () => {
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const response = await fetch(
            "https://metrics.pyro.host/api/v1/targets",
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (!data || !data.data || !data.data.activeTargets) {
            throw new Error("Invalid data format received from API");
          }

          const activeTargets = data.data.activeTargets.filter(
            (target: Node) => target.labels.job === "node",
          );

          if (activeTargets.length === 0) {
            throw new Error("No active node targets found");
          }

          const nodesWithDetails = await Promise.all(
            activeTargets.map(async (node: Node) => {
              try {
                const details = await fetchNodeDetails(node.labels.instance);
                const nodename = await fetchNodeName(node.labels.instance);
                return {
                  ...node,
                  details,
                  labels: { ...node.labels, nodename },
                };
              } catch (err) {
                console.error(
                  `Error fetching details for node ${node.labels.instance}:`,
                  err,
                );
                return node;
              }
            }),
          );

          setNodes(nodesWithDetails);
          setError(null);
          setLoading(false);
          break;
        } catch (err) {
          console.error(`Attempt ${retryCount + 1} failed:`, err);
          retryCount++;

          if (retryCount === maxRetries) {
            const errorMessage =
              err instanceof Error ? err.message : "Unknown error";
            setError(
              `Failed to fetch node targets after ${maxRetries} attempts: ${errorMessage}`,
            );
            setNodes([]);
            setLoading(false);
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000),
            );
          }
        }
      }
    };

    fetchNodes();
  }, []);

  // Fetch cluster metrics
  useEffect(() => {
    const fetchClusterData = async () => {
      try {
        const clusterData = await fetchClusterAverages(timeScale);
        setClusterMetrics(clusterData);
      } catch (err) {
        console.error("Error fetching cluster metrics:", err);
      }
    };

    fetchClusterData();
    const clusterInterval = setInterval(fetchClusterData, 15000); // Every 15 seconds
    return () => clearInterval(clusterInterval);
  }, [timeScale]);

  // Fetch basic metrics
  useEffect(() => {
    const fetchBasicData = async () => {
      try {
        // Fetch cluster averages
        const clusterData = await fetchClusterAverages(timeScale);
        setClusterMetrics(clusterData);

        // Fetch basic metrics for all nodes
        const basicNodeMetrics: Record<
          string,
          Pick<Metrics, "cpu" | "memory" | "disk">
        > = {};
        await Promise.all(
          nodes.map(async (node) => {
            const instance = node.labels.instance;
            const basic = await fetchBasicMetrics(instance, timeScale);
            basicNodeMetrics[instance] = basic;
          }),
        );
        setBasicMetrics(basicNodeMetrics);
      } catch (err) {
        console.error("Error fetching basic metrics:", err);
      }
    };

    fetchBasicData(); // Initial fetch
    const intervalId = setInterval(fetchBasicData, 15000);
    return () => clearInterval(intervalId);
  }, [nodes, timeScale]);

  // Fetch detailed metrics
  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        const detailedMetrics = await Promise.all(
          expandedNodes.map(async (instance) => {
            const nodeMetrics = await fetchNodeMetrics(instance, timeScale);
            return { instance, nodeMetrics };
          }),
        );
        setMetrics((prev) => {
          const newMetrics = { ...prev };
          detailedMetrics.forEach(({ instance, nodeMetrics }) => {
            newMetrics[instance] = nodeMetrics;
          });
          return newMetrics;
        });
      } catch (err) {
        console.error("Error fetching detailed metrics:", err);
      }
    };

    if (expandedNodes.length > 0) {
      fetchDetailedData(); // Initial fetch
      const intervalId = setInterval(fetchDetailedData, 3000);
      return () => clearInterval(intervalId);
    }
  }, [expandedNodes, timeScale]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      setMetricsCache({});
    };
  }, []);

  const handleNodeToggle = (instance: string) => {
    setExpandedNodes((prev) => {
      const isCurrentlyExpanded = prev.includes(instance);
      if (!isCurrentlyExpanded) {
        // Immediately fetch detailed metrics when expanding
        fetchNodeMetrics(instance, timeScale).then((nodeMetrics) => {
          setMetrics((prev) => ({
            ...prev,
            [instance]: nodeMetrics,
          }));
        });
        return [...prev, instance];
      } else {
        // Clear detailed metrics when collapsing
        setMetrics((prevMetrics) => {
          const newMetrics = { ...prevMetrics };
          delete newMetrics[instance];
          return newMetrics;
        });
        return prev.filter((n) => n !== instance);
      }
    });
  };

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="m-4 border-red-500/20 bg-red-950/10"
      >
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            {isTimeScaleLoading && (
              <span className="text-sm text-gray-400">Updating metrics...</span>
            )}
          </div>
        </div>
        <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-white font-semibold">
              <div className="flex items-center space-x-2">
                <ServerCogIcon className="h-6 w-6 text-white" />
                <span>Cluster Metrics</span>
              </div>
            </CardTitle>

            <section className="text-sm text-gray-400">
              <p>Real-time monitoring of the cluster&apos;s performance.</p>
              <p>Metrics are updated every 15 seconds.</p>
            </section>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="CPU Usage"
                value={clusterMetrics?.cpu.slice(-1)[0]?.value || 0}
                data={clusterMetrics?.cpu || []}
                dataKey="value"
                color="#FF6384"
                loading={loading}
                icon={<CpuIcon className="h-5 w-5 text-white" />}
              />
              <MetricCard
                title="Memory Usage"
                value={clusterMetrics?.memory.slice(-1)[0]?.value || 0}
                data={clusterMetrics?.memory || []}
                dataKey="value"
                color="#36A2EB"
                loading={loading}
                icon={<MemoryStick className="h-5 w-5 text-white" />}
              />
              <MetricCard
                title="Disk Usage"
                value={clusterMetrics?.disk.slice(-1)[0]?.value || 0}
                data={clusterMetrics?.disk || []}
                dataKey="value"
                color="#FFCE56"
                loading={loading}
                icon={<HardDriveIcon className="h-5 w-5 text-white" />}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <MetricCard
                title="Load Average"
                value={clusterMetrics?.loadAverage.slice(-1)[0]?.value || 0}
                data={clusterMetrics?.loadAverage || []}
                dataKey="value"
                color="#4BC0C0"
                loading={loading}
                format="number"
                icon={<ActivityIcon className="h-5 w-5 text-white" />}
              />
              <MetricCard
                title="Disk I/O"
                value={clusterMetrics?.diskIO.slice(-1)[0]?.value || 0}
                data={clusterMetrics?.diskIO || []}
                dataKey="value"
                color="#9966FF"
                loading={loading}
                format="bytes"
                icon={<DiscIcon className="h-5 w-5 text-white" />}
              />
              <MetricCard
                title="Network I/O"
                value={clusterMetrics?.netIO.slice(-1)[0]?.value || 0}
                data={clusterMetrics?.netIO || []}
                dataKey="value"
                color="#FF9F40"
                loading={loading}
                format="bytes"
                icon={<NetworkIcon className="h-5 w-5 text-white" />}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-white font-semibold">
              <div className="flex items-center space-x-2">
                <ServerIcon className="h-6 w-6 text-white" />
                <span>Node Metrics</span>
              </div>
            </CardTitle>

            <section className="text-sm text-gray-400">
              <p>Performance and health metrics for individual nodes.</p>
              <p>
                Basic metrics are updated every 15 seconds. Detailed metrics are
                updated every 3 seconds when expanded.
              </p>
            </section>
          </CardHeader>
          <CardContent>
            {nodes.map((node) => (
              <NodeCard
                key={node.labels.instance}
                node={node}
                metrics={
                  expandedNodes.includes(node.labels.instance)
                    ? metrics[node.labels.instance]
                    : basicMetrics[node.labels.instance]
                }
                isExpanded={expandedNodes.includes(node.labels.instance)}
                onToggle={() => handleNodeToggle(node.labels.instance)}
                loading={
                  loading && expandedNodes.includes(node.labels.instance)
                }
              />
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
