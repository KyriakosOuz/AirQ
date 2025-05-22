
import * as React from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface RegionOption {
  value: string;
  label: string;
}

interface RegionMultiSelectProps {
  values: string[];
  options: RegionOption[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function RegionMultiSelect({
  values = [],
  options = [],
  onChange,
  disabled = false,
  placeholder = "Select regions...",
  emptyMessage = "No regions found.",
  className,
}: RegionMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>(values);

  React.useEffect(() => {
    setSelected(values);
  }, [values]);

  // Map of value to label for quick lookups
  const valueToLabel = React.useMemo(() => {
    return options.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {});
  }, [options]);

  const handleSelect = React.useCallback((value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    
    setSelected(newSelected);
    onChange(newSelected);
  }, [selected, onChange]);

  const handleRemoveValue = (e: React.MouseEvent<HTMLButtonElement>, value: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(value);
  };

  const handleClearAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected([]);
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "min-h-10 w-full justify-between px-3 py-2 text-left",
            !selected.length && "text-muted-foreground",
            className
          )}
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.length <= 3 ? (
                selected.map(value => (
                  <Badge key={value} variant="secondary" className="flex items-center gap-1 px-2">
                    {valueToLabel[value] || value}
                    <button
                      className="rounded-full outline-none focus:ring-2 focus:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemoveValue(e as unknown as React.MouseEvent<HTMLButtonElement>, value);
                        }
                      }}
                      onMouseDown={(e) => handleRemoveValue(e, value)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span>{selected.length} regions selected</span>
              )}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search regions..." />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="max-h-60">
              <div className="p-1 flex justify-end">
                {selected.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleClearAll}
                  >
                    Clear all
                  </Button>
                )}
              </div>
              {options.map(option => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
