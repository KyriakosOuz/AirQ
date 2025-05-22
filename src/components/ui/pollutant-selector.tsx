
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
import { Pollutant } from "@/lib/types";
import ErrorBoundary from "@/components/ErrorBoundary";

// Defined pollutant options
const DEFAULT_POLLUTANT_OPTIONS = [
  { value: "no2_conc" as Pollutant, label: "Nitrogen Dioxide (NO₂)" },
  { value: "o3_conc" as Pollutant, label: "Ozone (O₃)" },
  { value: "co_conc" as Pollutant, label: "Carbon Monoxide (CO)" },
  { value: "no_conc" as Pollutant, label: "Nitric Oxide (NO)" },
  { value: "so2_conc" as Pollutant, label: "Sulfur Dioxide (SO₂)" },
  { value: "pm10_conc" as Pollutant, label: "Particulate Matter (PM10)" },
  { value: "pm25_conc" as Pollutant, label: "Fine Particulate Matter (PM2.5)" },
];

interface PollutantSelectorProps {
  value: Pollutant | "";
  onValueChange: (value: Pollutant) => void;
  pollutants?: Pollutant[]; // Add the pollutants prop as optional
  disabled?: boolean;
}

export function PollutantSelector({
  value,
  onValueChange,
  pollutants = [],
  disabled = false
}: PollutantSelectorProps) {
  // Get available pollutant options - use custom pollutants if provided, otherwise use defaults
  const availablePollutants = React.useMemo(() => {
    if (pollutants && pollutants.length > 0) {
      return DEFAULT_POLLUTANT_OPTIONS.filter(
        option => pollutants.includes(option.value)
      );
    }
    return DEFAULT_POLLUTANT_OPTIONS;
  }, [pollutants]);

  // Get pollutant label from value
  const selectedPollutantLabel = React.useMemo(() => {
    if (!value) return "";
    return availablePollutants.find(pollutant => pollutant.value === value)?.label || "";
  }, [value, availablePollutants]);

  return (
    <ErrorBoundary>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedPollutantLabel || "Select pollutant..."}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full" align="start">
          {availablePollutants.map((pollutant) => (
            <DropdownMenuItem
              key={pollutant.value}
              onClick={() => onValueChange(pollutant.value)}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === pollutant.value ? "opacity-100" : "opacity-0"
                )}
              />
              {pollutant.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ErrorBoundary>
  );
}
