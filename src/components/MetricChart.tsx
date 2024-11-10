import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CustomTooltip from "./CustomTooltip";
import { formatBytes, formatTimestamp, formatValue } from "@/lib/utils";
import { Metric, MemoryDetails, SwapDetails } from "@/lib/types";

interface MetricChartProps {
  title: string;
  data?: Metric[] | MemoryDetails | SwapDetails;
  color?: string;
  format?: "percent" | "bytes" | "number";
  type?: "memory" | "swap";
}

const MetricChart: React.FC<MetricChartProps> = ({
  title,
  data,
  color = "#2563eb",
  format = "percent",
  type,
}) => {
  if (!data) {
    return (
      <Card className="w-full bg-black border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white/90 text-lg font-medium">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full bg-white/5" />
        </CardContent>
      </Card>
    );
  }

  if (type === "memory" && data && "used" in data) {
    const memoryData = data as MemoryDetails;
    const mergedData = memoryData.used
      .map((item, index) => ({
        timestamp: item.timestamp,
        used: item.value,
        buffers: memoryData.buffers[index]?.value ?? 0,
        cached: memoryData.cached[index]?.value ?? 0,
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    return (
      <Card className="w-full bg-black border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white/90 text-lg font-medium">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedData}>
                <defs>
                  <linearGradient id="usedMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  stroke="rgba(255,255,255,0.3)"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tickFormatter={(value) => formatBytes(value)}
                />
                <RechartsTooltip
                  content={<CustomTooltip format="bytes" />}
                  cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <Area
                  type="monotone"
                  dataKey="used"
                  name="Used"
                  stackId="1"
                  stroke="#EF4444"
                  fill="url(#usedMemory)"
                />
                <Area
                  type="monotone"
                  dataKey="buffers"
                  name="Buffers"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                />
                <Area
                  type="monotone"
                  dataKey="cached"
                  name="Cached"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "swap" && data && "used" in data) {
    const swapData = data as SwapDetails;
    return (
      <Card className="w-full bg-black border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white/90 text-lg font-medium">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={swapData.used}>
                <defs>
                  <linearGradient id="usedSwap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                  stroke="rgba(255,255,255,0.3)"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tickFormatter={(value) => formatBytes(value)}
                />
                <RechartsTooltip
                  content={<CustomTooltip format="bytes" />}
                  cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Used Swap"
                  stackId="1"
                  stroke="#6366F1"
                  fill="url(#usedSwap)"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  const gradientId = `gradient-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <Card className="w-full bg-black border-white/10 transition-all duration-200 hover:border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-white/90 text-lg font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data as Metric[]}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                minTickGap={30}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickFormatter={(value) => formatValue(value, format)}
                domain={format === "percent" ? [0, 100] : undefined}
              />
              <RechartsTooltip
                content={<CustomTooltip format={format} />}
                cursor={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: color,
                  strokeWidth: 2,
                  fill: "black",
                }}
                fill={`url(#${gradientId})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(MetricChart);
