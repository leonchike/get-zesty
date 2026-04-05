import React, { useState, useEffect, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomTimeInputProps {
  label: string;
  id: string;
  value: number | null;
  onChange: (value: number) => void;
  placeholder?: string;
}

const CustomTimeInput: React.FC<CustomTimeInputProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder,
}) => {
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    if (value === null || isNaN(value)) {
      setTimeString("");
    } else {
      const safeValue = isNaN(value) ? 0 : value;
      const hours = Math.floor(safeValue / 60);
      const minutes = safeValue % 60;
      setTimeString(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      );
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, "");

    if (input.length > 2) {
      input = input.slice(0, 2) + ":" + input.slice(2);
    }

    setTimeString(input);

    if (input === "") {
      onChange(0);
      return;
    }

    const [hours, minutes] = input.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const totalMinutes = hours * 60 + (minutes || 0);
      onChange(totalMinutes);
    }
  };

  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Input
        type="text"
        id={id}
        value={timeString}
        onChange={handleChange}
        placeholder={placeholder}
        pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
        maxLength={5}
      />
    </>
  );
};

export default CustomTimeInput;
