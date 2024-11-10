import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingSkeleton: React.FC = () => (
  <div className="p-6">
    <Skeleton className="h-[100px] w-full bg-white/5 mb-4" />
    <Skeleton className="h-[100px] w-full bg-white/5 mb-4" />
    <Skeleton className="h-[100px] w-full bg-white/5" />
  </div>
);

export default LoadingSkeleton;
