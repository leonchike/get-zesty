"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useController, Control } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ComboboxInputProps = {
  id: string;
  placeholder?: string;
  emptyMessage?: string;
  control: Control<any>;
  options: {
    value: string;
    label: string;
  }[];
};

export function Combobox({
  id,
  placeholder = "Select...",
  emptyMessage = "No results found",
  control,
  options,
}: ComboboxInputProps) {
  const {
    field: { onChange, value },
  } = useController({ control, name: id });
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[200px] h-10 justify-between font-normal text-sm dark:bg-primaryHover-dark dark:border-primaryHover-dark dark:text-textColor-dark dark:placeholder:text-textColor-dark/80 dark:focus:ring-pageBg-light"
        >
          {value
            ? options.find(
                (option) =>
                  option.value.toLowerCase() === String(value).toLowerCase()
              )?.label ?? value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[200px] p-0">
        <Command className="dark:bg-primaryHover-dark dark:border-primaryHover-dark dark:text-textColor-dark dark:placeholder:text-textColor-dark/80 dark:focus:ring-pageBg-light">
          <CommandInput
            placeholder={placeholder}
            className="dark:text-textColor-dark dark:placeholder:text-textColor-dark/80"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="dark:text-textColor-dark"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
