
import { AqiLevel, aqiLevelLabels } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AqiBadgeProps {
  level: AqiLevel;
  className?: string;
  showLabel?: boolean;
}

export function AqiBadge({ level, className, showLabel = true }: AqiBadgeProps) {
  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-md",
        `aqi-${level}`,
        className
      )}
    >
      {showLabel ? aqiLevelLabels[level] : ""}
    </span>
  );
}
