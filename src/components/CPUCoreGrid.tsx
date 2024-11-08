import React from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metric } from "@/lib/types";

interface CPUCoreGridProps {
  cpuPerCore?: { [core: string]: Metric[] };
}

const CPUCoreGrid: React.FC<CPUCoreGridProps> = ({ cpuPerCore }) => {
  if (!cpuPerCore) return null;

  return (
    <Card className="w-full bg-black border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-white/90 text-lg font-medium">
          CPU Cores Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(cpuPerCore).map(([core, data]) => {
            const lastValue = data[data.length - 1]?.value || 0;
            return (
              <div
                key={core}
                className="p-3 border border-white/10 bg-black/50"
              >
                <div className="text-sm text-white/60 mb-1">Core {core}</div>
                <div className="text-lg font-semibold text-white">
                  {lastValue.toFixed(1)}%
                </div>
                <div className="h-10 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6EE7B7"
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CPUCoreGrid;
