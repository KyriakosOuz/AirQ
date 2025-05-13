
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

// Sample regions - will be fetched from API in real implementation
export const regions = [
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
  }, [value]);

  // Filter function for the Command component
  const filterFn = React.useCallback((item: string, search: string) => {
    if (!search) return true;
    const region = regions.find(r => r.value === item);
    if (!region) return false;
    return region.label.toLowerCase().includes(search.toLowerCase());
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedRegionLabel || "Select region..."}
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
