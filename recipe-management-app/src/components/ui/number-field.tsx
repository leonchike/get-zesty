import * as React from "react";
import { useController, Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";

export interface NumberFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  name: string;
  control: Control<any>;
  min?: number;
  max?: number;
}

const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ className, name, control, min, max, ...props }, ref) => {
    const {
      field: { onChange, value },
    } = useController({
      name,
      control,
      defaultValue: 0,
    });

    const handleIncrement = () => {
      const newValue = Math.min(value + 1, max ?? Infinity);
      onChange(newValue);
    };

    const handleDecrement = () => {
      const newValue = Math.max(value - 1, min ?? -Infinity);
      onChange(newValue);
    };

    return (
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          className="absolute flex items-center justify-center h-10 w-10 rounded-md bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={value <= (min ?? -Infinity)}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          className={cn(
            "flex h-10 w-full text-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primaryHover-dark dark:border-primaryHover-dark dark:text-textColor-dark dark:placeholder:text-textColor-dark/80 dark:focus:ring-pageBg-light [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none",
            className
          )}
          ref={ref}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          {...props}
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="absolute right-0 flex items-center justify-center h-10 w-10 rounded-md bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={value >= (max ?? Infinity)}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
NumberField.displayName = "NumberField";

export { NumberField };
