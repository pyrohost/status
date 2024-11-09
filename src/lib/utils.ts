import {
  PrometheusResponse,
  Metrics,
  ClusterAverages,
  MemoryDetails,
  SwapDetails,
  Metric,
} from "@/lib/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const calculateStep = (timeScale: number): number => {
  // For ranges > 3 days, use larger steps to reduce data points
  if (timeScale > 259200) return 1800; // 30 min steps for > 3 days
  if (timeScale > 86400) return 600; // 10 min steps for > 1 day
  if (timeScale > 21600) return 300; // 5 min steps for > 6 hours
  return 60; // 1 min steps for shorter ranges
};

const fetchPrometheusData = async (
  queries: string[],
  timeScale: number,
  lastFetchTime?: number
) => {
  const now = Date.now();
  const endTime = Math.floor(now / 1000);
  // Ensure startTime is always before endTime
  const startTime = lastFetchTime
    ? Math.min(lastFetchTime, endTime - 60) // Ensure at least 60s difference
    : endTime - timeScale;

  const step = calculateStep(timeScale);

  const responses = await Promise.all(
    queries.map((query) =>
      fetch(
        `https://metrics.pyro.host/api/v1/query_range?query=${encodeURIComponent(
          query
        )}&start=${startTime}&end=${endTime}&step=${step}`
      )
        .then((res) => res.json())
        .catch((err) => {
          console.error(`Error fetching data for query: ${query}`, err);
          return null;
        })
    )
  );
  return responses;
};

const processMetricData = (response: PrometheusResponse): Metric[] => {
  if (!response?.data?.result[0]?.values) {
    console.warn("No metric data found in response", response);
    return [];
  }

  const values = response.data.result[0].values;
  const maxDataPoints = 300; // Limit max data points

  // If we have too many points, sample them
  if (values.length > maxDataPoints) {
    const step = Math.floor(values.length / maxDataPoints);
    return values
      .filter((_, i) => i % step === 0)
      .map(([time, value]: [number, string]) => ({
        timestamp: new Date(time * 1000),
        value: parseFloat(parseFloat(value).toFixed(2)),
      }));
  }

  return values.map(([time, value]: [number, string]) => ({
    timestamp: new Date(time * 1000),
    value: parseFloat(parseFloat(value).toFixed(2)),
  }));
};

export const fetchNodeMetrics = async (
  instance: string,
  timeScale: number,
  lastFetchTime?: number
): Promise<Metrics> => {
  try {
    const queries = {
      cpu: `100 - (avg by (instance) (rate(node_cpu_seconds_total{instance="${instance}",mode="idle"}[5m])) * 100)`,
      memory: `100 * (1 - ((node_memory_MemAvailable_bytes{instance="${instance}"} or node_memory_Available_bytes{instance="${instance}"}) / node_memory_MemTotal_bytes{instance="${instance}"}))`,
      diskIO: `sum by (instance) (rate(node_disk_read_bytes_total{instance="${instance}"}[5m]) + rate(node_disk_written_bytes_total{instance="${instance}"}[5m]))`,
      netIO: `sum by (instance) (rate(node_network_receive_bytes_total{instance="${instance}"}[5m]) + rate(node_network_transmit_bytes_total{instance="${instance}"}[5m]))`,
      disk: `100 - ((node_filesystem_avail_bytes{instance="${instance}",mountpoint="/"} * 100) / node_filesystem_size_bytes{instance="${instance}",mountpoint="/"})`,
      memoryTotal: `node_memory_MemTotal_bytes{instance="${instance}"}`,
      memoryFree: `node_memory_MemFree_bytes{instance="${instance}"}`,
      memoryAvailable: `node_memory_MemAvailable_bytes{instance="${instance}"}`,
      memoryBuffers: `node_memory_Buffers_bytes{instance="${instance}"}`,
      memoryCached: `node_memory_Cached_bytes{instance="${instance}"}`,
      swapTotal: `node_memory_SwapTotal_bytes{instance="${instance}"}`,
      swapFree: `node_memory_SwapFree_bytes{instance="${instance}"}`,
      loadAverage: `node_load1{instance="${instance}"}`,
      cpuPerCore: `sum by (cpu) (rate(node_cpu_seconds_total{instance="${instance}",mode!="idle"}[5m])) * 100`,
    };
    const queryRangeResponses = await fetchPrometheusData(
      Object.values(queries),
      timeScale,
      lastFetchTime
    );
    const [
      cpuResponse,
      memoryResponse,
      diskIOResponse,
      netIOResponse,
      diskResponse,
      memoryTotalResponse,
      memoryFreeResponse,
      memoryAvailableResponse,
      memoryBuffersResponse,
      memoryCachedResponse,
      swapTotalResponse,
      swapFreeResponse,
      loadAverageResponse,
      cpuPerCoreResponse,
    ] = queryRangeResponses;

    const cpuMetrics = processMetricData(cpuResponse);
    const memoryMetrics = processMetricData(memoryResponse);
    const diskIOMetrics = processMetricData(diskIOResponse);
    const netIOMetrics = processMetricData(netIOResponse);
    const diskMetrics = processMetricData(diskResponse);

    const memoryDetails: MemoryDetails = {
      total: processMetricData(memoryTotalResponse),
      free: processMetricData(memoryFreeResponse),
      available: processMetricData(memoryAvailableResponse),
      buffers: processMetricData(memoryBuffersResponse),
      cached: processMetricData(memoryCachedResponse),
      used: [],
    };

    // Calculate used memory
    memoryDetails.used = memoryDetails.total.map((totalMetric, index) => {
      const usedValue =
        totalMetric.value -
        memoryDetails.free[index].value -
        memoryDetails.buffers[index].value -
        memoryDetails.cached[index].value;
      return { timestamp: totalMetric.timestamp, value: usedValue };
    });

    const swapDetails: SwapDetails = {
      total: processMetricData(swapTotalResponse),
      free: processMetricData(swapFreeResponse),
      used: [],
    };

    // Calculate used swap
    swapDetails.used = swapDetails.total.map((totalMetric, index) => {
      const usedValue = totalMetric.value - swapDetails.free[index].value;
      return { timestamp: totalMetric.timestamp, value: usedValue };
    });

    // Process CPU per core metrics
    const cpuPerCoreData: { [core: string]: Metric[] } = {};
    if (cpuPerCoreResponse?.data?.result) {
      cpuPerCoreResponse.data.result.forEach(
        (result: { metric: { cpu: string }; values: [number, string][] }) => {
          const core: string = result.metric.cpu;
          const metrics: Metric[] = result.values.map(
            ([time, value]: [number, string]): Metric => ({
              timestamp: new Date(time * 1000),
              value: parseFloat(parseFloat(value).toFixed(2)),
            })
          );
          cpuPerCoreData[core] = metrics;
        }
      );
    }

    const loadAverage = processMetricData(loadAverageResponse);

    const uptimeQueries = {
      currentTime: `node_time_seconds{instance="${instance}"}`,
      bootTime: `node_boot_time_seconds{instance="${instance}"}`,
    };
    const uptimeResponses = await Promise.all(
      Object.values(uptimeQueries).map((query) =>
        fetch(
          `https://metrics.pyro.host/api/v1/query?query=${encodeURIComponent(
            query
          )}`
        ).then((res) => res.json())
      )
    );
    const currentTime = parseFloat(
      uptimeResponses[0]?.data?.result[0]?.value[1] || "0"
    );
    const bootTime = parseFloat(
      uptimeResponses[1]?.data?.result[0]?.value[1] || "0"
    );
    const uptime = currentTime - bootTime;

    return {
      cpu: cpuMetrics,
      memory: memoryMetrics,
      diskIO: diskIOMetrics,
      netIO: netIOMetrics,
      disk: diskMetrics,
      uptime: uptime,
      memoryDetails,
      swapDetails,
      loadAverage,
      cpuPerCore: cpuPerCoreData,
    };
  } catch (err) {
    console.error(`Error fetching metrics for instance ${instance}:`, err);
    throw err;
  }
};

export const fetchMultipleNodeMetrics = async (
  instances: string[],
  timeScale: number,
  lastFetchTime?: number
): Promise<{ [instance: string]: Metrics }> => {
  const results = await Promise.all(
    instances.map(async (instance) => {
      const metrics = await fetchNodeMetrics(
        instance,
        timeScale,
        lastFetchTime
      );
      return { instance, metrics };
    })
  );
  return Object.fromEntries(
    results.map(({ instance, metrics }) => [instance, metrics])
  );
};

export const fetchClusterAverages = async (
  timeScale: number,
  lastFetchTime?: number
): Promise<ClusterAverages> => {
  const queries = {
    cpu: `avg(100 - (rate(node_cpu_seconds_total{mode="idle"}[5m]) * 100))`,
    memory: `avg(100 * (1 - ((node_memory_MemAvailable_bytes or node_memory_Available_bytes) / node_memory_MemTotal_bytes)))`,
    disk: `avg(100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"}))`,
    diskIO: `avg(sum by (instance) (rate(node_disk_read_bytes_total[5m]) + rate(node_disk_written_bytes_total[5m])))`,
    netIO: `avg(sum by (instance) (rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])))`,
    loadAverage: `avg(node_load1)`,
  };

  const responses = await fetchPrometheusData(
    Object.values(queries),
    timeScale,
    lastFetchTime
  );

  return {
    cpu: processMetricData(responses[0]),
    memory: processMetricData(responses[1]),
    disk: processMetricData(responses[2]),
    diskIO: processMetricData(responses[3]),
    netIO: processMetricData(responses[4]),
    loadAverage: processMetricData(responses[5]),
  };
};

export const fetchBasicMetrics = async (
  instance: string,
  timeScale: number
): Promise<Pick<Metrics, "cpu" | "memory" | "disk">> => {
  const queries = {
    cpu: `100 - (avg by (instance) (rate(node_cpu_seconds_total{instance="${instance}",mode="idle"}[5m])) * 100)`,
    memory: `100 * (1 - ((node_memory_MemAvailable_bytes{instance="${instance}"} or node_memory_Available_bytes{instance="${instance}"}) / node_memory_MemTotal_bytes{instance="${instance}"}))`,
    disk: `100 - ((node_filesystem_avail_bytes{instance="${instance}",mountpoint="/"} * 100) / node_filesystem_size_bytes{instance="${instance}",mountpoint="/"})`,
  };

  const responses = await fetchPrometheusData(
    Object.values(queries),
    timeScale
  );

  return {
    cpu: processMetricData(responses[0]),
    memory: processMetricData(responses[1]),
    disk: processMetricData(responses[2]),
  };
};

export const fetchNodeDetails = async (instance: string) => {
  try {
    const queries = {
      cpuCores: `count(node_cpu_seconds_total{instance="${instance}",mode="idle"})`,
      totalMemory: `node_memory_MemTotal_bytes{instance="${instance}"}`,
    };

    const responses = await Promise.all(
      Object.entries(queries).map(([key, query]) =>
        fetch(
          `https://metrics.pyro.host/api/v1/query?query=${encodeURIComponent(
            query
          )}`
        )
          .then((res) => res.json())
          .then((data) => ({ key, data }))
          .catch((err) => {
            console.error(`Error fetching ${key} for ${instance}:`, err);
            return { key, data: null };
          })
      )
    );

    const details = {
      cpuCores: 0,
      totalMemory: 0,
    };

    responses.forEach(({ key, data }) => {
      if (data?.data?.result?.[0]?.value?.[1]) {
        if (key === "cpuCores") {
          details.cpuCores = parseInt(data.data.result[0].value[1]);
        } else if (key === "totalMemory") {
          details.totalMemory = parseInt(data.data.result[0].value[1]);
        }
      }
    });

    return details;
  } catch (err) {
    console.error(`Error in fetchNodeDetails for ${instance}:`, err);
    return {
      cpuCores: 0,
      totalMemory: 0,
    };
  }
};

export const fetchNodeName = async (instance: string) => {
  const response = await fetch(
    `https://metrics.pyro.host/api/v1/query?query=node_uname_info{instance="${instance}"}`
  );
  const data = await response.json();
  return data.data.result[0]?.metric.nodename || instance;
};

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const formatUptime = (seconds: number): string => {
  if (!seconds) return "N/A";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(" ") : "< 1m";
};
