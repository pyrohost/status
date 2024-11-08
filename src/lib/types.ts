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

export interface Node {
  labels: {
    instance: string;
    job: string;
    nodename: string;
  };
  details?: {
    cpuModel: string;
    cpuCores: number;
    totalMemory: number;
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
}

export interface ClusterAverages {
  cpu: Metric[];
  memory: Metric[];
  disk: Metric[];
  diskIO: Metric[];
  netIO: Metric[];
  loadAverage: Metric[];
}

export interface MetricCardData {
  timestamp: Date;
  [key: string]: number | Date;
}

export interface PrometheusResponse {
  data: {
    result: Array<{
      values: [number, string][];
    }>;
  };
}
