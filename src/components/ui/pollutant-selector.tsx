
import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Pollutant } from "@/lib/types";
import ErrorBoundary from "@/components/ErrorBoundary";

// Defined pollutant options
const pollutantOptions = [
  { value: "no2_conc" as Pollutant, label: "Nitrogen Dioxide (NO₂)" },
  { value: "o3_conc" as Pollutant, label: "Ozone (O₃)" },
  { value: "co_conc" as Pollutant, label: "Carbon Monoxide (CO)" },
  { value: "no_conc" as Pollutant, label: "Nitric Oxide (NO)" },
  { value: "so2_conc" as Pollutant, label: "Sulfur Dioxide (SO₂)" },
];

interface PollutantSelectorProps {
  value: Pollutant | "";
  onValueChange: (value: Pollutant) => void;
}

export function PollutantSelector({
  value,
  onValueChange,
}: PollutantSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Get pollutant label from value
  const selectedPollutantLabel = React.useMemo(() => {
    if (!value) return "";
    return pollutantOptions.find(pollutant => pollutant.value === value)?.label || "";
  }, [value]);

  return (
    <ErrorBoundary>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedPollutantLabel || "Select pollutant..."}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <div className="py-1">
            {pollutantOptions.map((pollutant) => (
              <div
                key={pollutant.value}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  value === pollutant.value && "bg-muted"
                )}
                onClick={() => {
                  onValueChange(pollutant.value);
                  setOpen(false);
                }}
              >
                {pollutant.label}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </ErrorBoundary>
  );
}
