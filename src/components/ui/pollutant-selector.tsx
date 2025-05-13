
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
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
  const [searchValue, setSearchValue] = React.useState("");

  // Reset search when popup closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  const handleSelect = React.useCallback((currentValue: string) => {
    if (currentValue) {
      onValueChange(currentValue as Pollutant);
      setOpen(false);
    }
  }, [onValueChange]);

  // Get pollutant label from value
  const selectedPollutantLabel = React.useMemo(() => {
    if (!value) return "";
    return pollutantOptions.find(pollutant => pollutant.value === value)?.label || "";
  }, [value]);

  // Filter pollutants based on search input
  const filteredPollutantOptions = React.useMemo(() => {
    if (!searchValue) return pollutantOptions;
    
    return pollutantOptions.filter(pollutant => 
      pollutant.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue]);

  // Filter function for the Command component
  const filterFn = React.useCallback((item: string, search: string) => {
    if (!search) return 1;
    
    const pollutant = pollutantOptions.find(p => p.value === item);
    if (!pollutant) return 0;
    return pollutant.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
  }, []);

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
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command value={searchValue} filter={filterFn}>
            <CommandInput 
              placeholder="Search pollutants..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>No pollutant found.</CommandEmpty>
            <CommandGroup>
              {filteredPollutantOptions.map((pollutant) => (
                <CommandItem
                  key={pollutant.value}
                  value={pollutant.value}
                  onSelect={() => handleSelect(pollutant.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === pollutant.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {pollutant.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </ErrorBoundary>
  );
}
