
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
import { metadataApi } from "@/lib/api";
import { toast } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

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
  const [pollutantOptions, setPollutantOptions] = React.useState<Array<{label: string, value: Pollutant}>>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch pollutant options from API
  React.useEffect(() => {
    const fetchPollutants = async () => {
      setIsLoading(true);
      try {
        const response = await metadataApi.getPollutants();
        if (response.success && response.data) {
          // Cast the data to ensure it matches the expected Pollutant type
          const typedData = response.data.map(item => ({
            label: item.label,
            value: item.value as Pollutant
          }));
          setPollutantOptions(typedData);
        } else {
          // Safely handle the error without directly accessing the error property
          console.error("Failed to fetch pollutants:", response.success ? "No data" : "API error");
          toast.error("Failed to load pollutant options");
          // Initialize with empty array as fallback
          setPollutantOptions([]);
        }
      } catch (error) {
        console.error("Error fetching pollutants:", error);
        toast.error("Failed to load pollutant options");
        // Initialize with empty array as fallback
        setPollutantOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPollutants();
  }, []);

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
  }, [value, pollutantOptions]);

  // Filter pollutants based on search input with safety checks
  const filteredPollutantOptions = React.useMemo(() => {
    if (!Array.isArray(pollutantOptions)) return [];
    if (!searchValue) return pollutantOptions;
    
    return pollutantOptions.filter(pollutant => 
      pollutant.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [pollutantOptions, searchValue]);

  // Filter function for the Command component - returns a number for ranking
  const filterFn = React.useCallback((item: string, search: string) => {
    if (!search) return 1;
    if (!Array.isArray(pollutantOptions)) return 0;
    
    const pollutant = pollutantOptions.find(p => p.value === item);
    if (!pollutant) return 0;
    return pollutant.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
  }, [pollutantOptions]);

  return (
    <ErrorBoundary>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading || pollutantOptions.length === 0}
          >
            {isLoading ? "Loading..." : (selectedPollutantLabel || "Select pollutant...")}
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
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading pollutant options...
              </div>
            ) : (
              <>
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
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </ErrorBoundary>
  );
}
