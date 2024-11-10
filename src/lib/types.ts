export interface Metric {
  timestamp: Date;
  value: number;
  [key: string]: number | Date;
}

export interface MemoryDetails {
  total: Metric[];
  free: Metric[];
  available: Metric[];
  used: Metric[];
  cached: Metric[];
  buffers: Metric[];
}

export interface SwapDetails {
  total: Metric[];
  free: Metric[];
  used: Metric[];
}

export interface NodeDetails {
  details: {
    cpuModel?: string;
    cpuCores: number;
    totalMemory: number;
  };
  nodename: string;
}

export interface NodeDetailsMap {
  [instance: string]: NodeDetails;
}

export interface Node {
  scrapePool: string;
  scrapeUrl: string;
  globalUrl: string;
  health: string;
  labels: {
    instance: string;
    job: string;
    nodename: string;
  };
  lastError: string;
  lastScrape: string;
  lastScrapeDuration: number;
  uptime?: number;
  lastUptimeFetch?: number;
  details?: {
    cpuModel: string;
    cpuCores: number;
    totalMemory: number;
  };
}

export interface MergedNode extends Node {
  details: {
    cpuModel: string;
    cpuCores: number;
    totalMemory: number;
  };
  labels: {
    instance: string;
    job: string;
    nodename: string;
    displayName: string;
  };
}

export interface Metrics {
  cpu: Metric[];
  memory: Metric[];
  disk: Metric[];
  diskIO: Metric[];
  netIO: Metric[];
  uptime: number;
  memoryDetails?: MemoryDetails;
  swapDetails?: SwapDetails;
  loadAverage?: Metric[];
  cpuPerCore?: { [core: string]: Metric[] };
  [key: string]:
    | Metric[]
    | number
    | MemoryDetails
    | SwapDetails
    | { [core: string]: Metric[] }
    | undefined;
}

export interface ClusterAverages {
  cpu: Metric[];
  memory: Metric[];
  disk: Metric[];
  diskIO: Metric[];
  netIO: Metric[];
  loadAverage: Metric[];
  [key: string]: Metric[];
}

export interface MetricCardData extends Metric {
  value: number;
  timestamp: Date;
}

export interface PrometheusResponse {
  data: {
    result: Array<{
      values: [number, string][];
    }>;
  };
}
