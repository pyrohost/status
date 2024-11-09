import { useRef, useEffect } from "react";
import useSWR from "swr";
import { Metrics, Node, ClusterAverages, NodeDetailsMap } from "./types";
import {
  fetchClusterAverages,
  fetchNodeDetails,
  fetchNodeName,
  fetchMultipleNodeMetrics,
} from "./utils";

const REFRESH_INTERVALS = {
  FAST: 10000, // 10 seconds
  MEDIUM: 30000, // 30 seconds
  SLOW: 300000, // 5 minutes
};

// Cache for storing historical metric data
const metricsCache = new Map<string, { [instance: string]: Metrics }>();
const clusterCache = new Map<string, ClusterAverages>();

export function useClusterMetrics(timeScale: number) {
  const lastFetchTime = useRef<number>(0);
  const { data, error, mutate } = useSWR<ClusterAverages>(
    ["clusterAverages", timeScale],
    async () => {
      const now = Date.now();
      const cacheKey = `cluster-${timeScale}`;
      const cachedData = clusterCache.get(cacheKey);

      // Only fetch new data for the time range we don't have
      if (cachedData && lastFetchTime.current > 0) {
        const newData = await fetchClusterAverages(
          timeScale,
          lastFetchTime.current,
        );
        const mergedData = mergeCachedData<ClusterAverages>(
          cachedData,
          newData,
        );
        clusterCache.set(cacheKey, mergedData);
        return mergedData;
      }

      const data = await fetchClusterAverages(timeScale);
      clusterCache.set(cacheKey, data);
      lastFetchTime.current = now;
      return data;
    },
    {
      refreshInterval: REFRESH_INTERVALS.MEDIUM,
      revalidateOnFocus: false,
    },
  );

  return {
    data: data || {
      cpu: [],
      memory: [],
      disk: [],
      diskIO: [],
      netIO: [],
      loadAverage: [],
    },
    error,
    mutate,
  };
}

export function useNodes() {
  const {
    data: nodes,
    error,
    mutate,
  } = useSWR<Node[]>(
    "nodes",
    async () => {
      try {
        const response = await fetch(
          "https://metrics.pyro.host/api/v1/targets",
        );
        const data = await response.json();

        if (data.status !== "success") {
          throw new Error("Failed to fetch targets");
        }

        interface TargetResponse {
          scrapePool: string;
          scrapeUrl: string;
          globalUrl: string;
          health: string;
          labels: {
            instance: string;
            job: string;
            nodename?: string;
          };
          lastError: string;
          lastScrape: string;
          lastScrapeDuration: number;
        }

        const nodes = await Promise.all(
          data.data.activeTargets
            .filter(
              (target: TargetResponse) =>
                target.labels.job === "node" && target.health === "up",
            )
            .map(async (target: TargetResponse): Promise<Node> => {
              // Fetch both nodename and initial uptime
              const [nodenameRes, uptimeRes] = await Promise.all([
                fetch(
                  `https://metrics.pyro.host/api/v1/query?query=node_uname_info{instance="${target.labels.instance}"}`,
                ),
                fetch(
                  `https://metrics.pyro.host/api/v1/query?query=(node_time_seconds{instance="${target.labels.instance}"} - node_boot_time_seconds{instance="${target.labels.instance}"})`,
                ),
              ]);

              const [nodenameData, uptimeData] = await Promise.all([
                nodenameRes.json(),
                uptimeRes.json(),
              ]);

              const nodename = nodenameData.data?.result[0]?.metric?.nodename;
              const uptime = parseFloat(
                uptimeData.data?.result[0]?.value?.[1] || "0",
              );

              if (!nodename) {
                console.error(
                  `Failed to fetch hostname for ${target.labels.instance}`,
                );
              }

              return {
                scrapePool: target.scrapePool,
                scrapeUrl: target.scrapeUrl,
                globalUrl: target.globalUrl,
                health: target.health,
                labels: {
                  instance: target.labels.instance,
                  job: target.labels.job,
                  nodename: nodename || "Unknown Host",
                },
                lastError: target.lastError,
                lastScrape: target.lastScrape,
                lastScrapeDuration: target.lastScrapeDuration,
                uptime,
                lastUptimeFetch: Date.now(),
                details: undefined, // Will be populated later
              };
            }),
        );

        return nodes;
      } catch (error) {
        console.error("Error fetching nodes:", error);
        return [];
      }
    },
    {
      refreshInterval: REFRESH_INTERVALS.SLOW,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  );

  // Update uptime every minute for non-expanded nodes
  useEffect(() => {
    if (!nodes) return;

    const interval = setInterval(() => {
      nodes.forEach((node) => {
        if (node.uptime && node.lastUptimeFetch) {
          const timeDiff = (Date.now() - node.lastUptimeFetch) / 1000;
          node.uptime += timeDiff;
          node.lastUptimeFetch = Date.now();
        }
      });
      mutate(nodes, false); // Update without revalidating
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [nodes, mutate]);

  return {
    nodes: nodes ?? [],
    error,
    mutate,
    loading: !nodes && !error,
  };
}

export function useNodeDetails(instance: string, enabled: boolean) {
  const { data, error } = useSWR<NodeDetailsMap>(
    enabled && instance ? ["nodeDetails", instance] : null,
    async () => {
      const instances = instance.split(",").filter(Boolean);
      if (!instances.length) return {};

      const results = await Promise.all(
        instances.map(async (inst) => {
          try {
            const [details, nodename] = await Promise.all([
              fetchNodeDetails(inst),
              fetchNodeName(inst),
            ]);
            return [inst, { details, nodename }];
          } catch (error) {
            console.error(`Error fetching details for ${inst}:`, error);
            return [
              inst,
              {
                details: { cpuCores: 0, totalMemory: 0 },
                nodename: inst.split(":")[0],
              },
            ];
          }
        }),
      );
      return Object.fromEntries(results);
    },
    {
      refreshInterval: REFRESH_INTERVALS.SLOW,
      revalidateOnFocus: false,
    },
  );

  return { data, error };
}

export function useNodeMetrics(
  instances: string[],
  timeScale: number,
  enabled: boolean,
) {
  const lastFetchTime = useRef<number>(0);
  const { data, error, mutate } = useSWR(
    enabled ? ["nodeMetrics", instances.join(","), timeScale] : null,
    async () => {
      const now = Date.now();
      const cacheKey = `${instances.join(",")}-${timeScale}`;
      const cachedData = metricsCache.get(cacheKey);

      if (cachedData && lastFetchTime.current > 0) {
        const newData = await fetchMultipleNodeMetrics(
          instances,
          timeScale,
          lastFetchTime.current,
        );
        const mergedData = mergeCachedData(cachedData, newData);
        metricsCache.set(cacheKey, mergedData);
        return mergedData;
      }

      const data = await fetchMultipleNodeMetrics(instances, timeScale);
      metricsCache.set(cacheKey, data);
      lastFetchTime.current = now;
      return data;
    },
    {
      refreshInterval: enabled ? REFRESH_INTERVALS.FAST : 0,
      revalidateOnFocus: false,
    },
  );

  return { data, error, mutate };
}

function mergeCachedData<T extends Record<string, unknown>>(
  oldData: T,
  newData: T,
): T {
  const result = { ...oldData };

  for (const key in newData) {
    if (Object.prototype.hasOwnProperty.call(newData, key)) {
      const newValue = newData[key];
      const oldValue = oldData[key];

      if (Array.isArray(newValue)) {
        result[key] = [
          ...(Array.isArray(oldValue) ? oldValue : []),
          ...newValue,
        ].slice(-300) as unknown as T[Extract<keyof T, string>];
      } else if (newValue && typeof newValue === "object") {
        result[key] = mergeCachedData(
          (oldValue || {}) as Record<string, unknown>,
          newValue as Record<string, unknown>,
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = newValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}
