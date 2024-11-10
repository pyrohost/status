import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, formatTimestamp, formatValue } from "@/lib/utils";
import { MetricCardData } from "@/lib/types";
import CustomTooltip from "./CustomTooltip";

interface MetricCardProps {
  title: string;
  value: number;
  data: MetricCardData[];
  dataKey: string;
  color: string;
  loading: boolean;
  format?: "percent" | "bytes" | "number";
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  data,
  dataKey,
  color,
  loading,
  format = "percent",
  icon,
}) => {
  if (loading) {
    return (
      <div className="border border-white/10 bg-black/30 p-4 space-y-4">
        <Skeleton className="h-4 w-24 bg-white/5" />
        <Skeleton className="h-8 w-16 bg-white/5" />
        <Skeleton className="h-[100px] w-full bg-white/5" />
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-black/30 p-4 transition-colors hover:border-white/20">
      <h3 className="text-sm font-medium text-white/60 flex items-center space-x-2">
        {icon}
        <span>{title}</span>
      </h3>
      <p className="text-3xl font-bold mt-1 text-white">
        {formatValue(value, format)}
      </p>
      <div className="h-[100px] text-xs mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              tickFormatter={(value) =>
                format === "percent"
                  ? `${value}%`
                  : format === "bytes"
                    ? formatBytes(value)
                    : value.toFixed(2)
              }
              domain={format === "percent" ? [0, 100] : [0, "auto"]}
              width={format === "percent" ? 30 : format === "bytes" ? 80 : 40}
            />
            <RechartsTooltip content={<CustomTooltip format={format} />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(MetricCard);
