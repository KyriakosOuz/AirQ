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
import { metadataApi } from "@/lib/api";
import { toast } from "sonner";

// Fallback regions when API fails
const fallbackRegions = [
  { value: "ampelokipoi-menemeni", label: "Ampelokipoi-Menemeni" },
  { value: "kalamaria", label: "Kalamaria" },
  { value: "pavlos-melas", label: "Pavlos Melas" },
  { value: "neapoli-sykies", label: "Neapoli-Sykies" },
  { value: "thessaloniki", label: "Thessaloniki Center" },
  { value: "panorama", label: "Panorama" },
  { value: "pylaia-chortiatis", label: "Pylaia-Chortiatis" },
];

interface RegionSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function RegionSelector({ value, onValueChange }: RegionSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [regions, setRegions] = React.useState(fallbackRegions);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch regions from API
  React.useEffect(() => {
    const fetchRegions = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching regions from API");
        const response = await metadataApi.getRegions();
        if (response.success && response.data) {
          console.log("Regions fetched successfully:", response.data);
          setRegions(response.data);
        } else {
          console.error("Failed to fetch regions:", response.error);
          // Keep using fallback regions
        }
      } catch (error) {
        console.error("Error fetching regions:", error);
        // Keep using fallback regions
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegions();
  }, []);

  // Reset search when popup closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  const handleSelect = React.useCallback((currentValue: string) => {
    if (currentValue) {
      onValueChange(currentValue);
      setOpen(false);
    }
  }, [onValueChange]);

  // Get region label from value
  const selectedRegionLabel = React.useMemo(() => {
    if (!value) return "";
    return regions.find(region => region.value === value)?.label || "";
  }, [value, regions]);

  // Filter function for the Command component - returns a number for ranking
  // 1 = match, 0 = no match (could use different numbers for better/worse matches)
  const filterFn = React.useCallback((item: string, search: string) => {
    if (!search) return 1;
    const region = regions.find(r => r.value === item);
    if (!region) return 0;
    return region.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
  }, [regions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-primary rounded-full"></span>
              Loading...
            </span>
          ) : (
            selectedRegionLabel || "Select region..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command value={searchValue} filter={filterFn}>
          <CommandInput 
            placeholder="Search regions..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading regions...
            </div>
          ) : (
            <>
              <CommandEmpty>No region found.</CommandEmpty>
              <CommandGroup>
                {regions.map((region) => (
                  <CommandItem
                    key={region.value}
                    value={region.value}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === region.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {region.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
