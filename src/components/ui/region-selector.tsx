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

// Predefined regions with consistent formatting and hyphenation for keys
const DEFAULT_REGIONS = [
  { value: "thessaloniki", label: "Thessaloniki" },
  { value: "ampelokipoi-menemeni", label: "Ampelokipoi - Menemeni" },
  // { value: "neapoli-sykies", label: "Neapoli - Sykies" },
  // { value: "kalamaria", label: "Kalamaria" },
  // { value: "pavlos-melas", label: "Pavlos Melas" },
  // { value: "pylaia-chortiatis", label: "Pylaia - Chortiatis" },
  // { value: "panorama", label: "Panorama" },
];

interface RegionSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  regions?: string[]; // Add the regions prop as optional
  disabled?: boolean;
}

export function RegionSelector({ value, onValueChange, regions = [], disabled = false }: RegionSelectorProps) {
  // Get available regions - use custom regions if provided, otherwise use defaults
  const availableRegions = React.useMemo(() => {
    if (regions && regions.length > 0) {
      // Convert string array to region objects
      return regions.map(regionValue => {
        // Find in default regions first
        const defaultRegion = DEFAULT_REGIONS.find(r => r.value === regionValue);
        return defaultRegion || { value: regionValue, label: regionValue.charAt(0).toUpperCase() + regionValue.slice(1).replace(/-/g, ' ') };
      });
    }
    return DEFAULT_REGIONS;
  }, [regions]);

  // Get region label from value
  const selectedRegionLabel = React.useMemo(() => {
    if (!value) return "";
    return availableRegions.find(region => region.value === value)?.label || "";
  }, [value, availableRegions]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedRegionLabel || "Select region..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full" align="start">
        {availableRegions.map((region) => (
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
