
import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Predefined regions with consistent formatting and hyphenation
const REGIONS = [
  { value: "thessaloniki", label: "Thessaloniki" },
  { value: "ampelokipoi-menemeni", label: "Ampelokipoi - Menemeni" },
  { value: "neapoli-sykies", label: "Neapoli - Sykies" },
  { value: "kalamaria", label: "Kalamaria" },
  { value: "pavlos-melas", label: "Pavlos Melas" },
  { value: "pylaia-chortiatis", label: "Pylaia - Chortiatis" },
  { value: "panorama", label: "Panorama" },
];

interface RegionSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function RegionSelector({ value, onValueChange }: RegionSelectorProps) {
  // Get region label from value
  const selectedRegionLabel = React.useMemo(() => {
    if (!value) return "";
    return REGIONS.find(region => region.value === value)?.label || "";
  }, [value]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          {selectedRegionLabel || "Select region..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full" align="start">
        {REGIONS.map((region) => (
          <DropdownMenuItem
            key={region.value}
            onClick={() => onValueChange(region.value)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === region.value ? "opacity-100" : "opacity-0"
              )}
            />
            {region.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
