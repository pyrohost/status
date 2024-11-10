import React from "react";
import { TooltipProps } from "recharts";
import { formatBytes, formatTimestamp } from "@/lib/utils";

interface CustomTooltipProps extends TooltipProps<number, string> {
  format?: "percent" | "bytes" | "number";
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  format = "percent",
}) => {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value;
  const formattedValue =
    format === "bytes"
      ? formatBytes(value || 0)
      : format === "number"
        ? value?.toFixed(2)
        : `${value?.toFixed(2)}%`;

  return (
    <div className="bg-black border border-white/10 p-3 shadow-lg">
      <p className="text-white/80 text-sm mb-1">{formatTimestamp(label)}</p>
      <p className="text-white font-medium text-base">
        {value !== undefined ? formattedValue : "N/A"}
        {/* {format === "percent" && "%"} */}
      </p>
    </div>
  );
};

export default CustomTooltip;
