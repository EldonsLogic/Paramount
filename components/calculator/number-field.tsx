"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max"> {
  value: number;
  onValueChange: (n: number) => void;
  min: number;
  max: number;
  integer?: boolean;
}

/**
 * Numeric input that lets the user clear/retype freely, updates the model on every valid keystroke,
 * and snaps back into range on blur.
 */
export function NumberField({ value, onValueChange, min, max, integer, className, onBlur, ...props }: NumberFieldProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    // Sync when the model changes from outside (reset, load) without clobbering in-progress typing.
    setText((t) => (Number(t) === value ? t : String(value)));
  }, [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, integer ? Math.round(n) : n));

  return (
    <Input
      type="number"
      inputMode={integer ? "numeric" : "decimal"}
      min={min}
      max={max}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        if (Number.isFinite(n)) onValueChange(clamp(n));
      }}
      onBlur={(e) => {
        const n = parseFloat(text);
        const next = Number.isFinite(n) ? clamp(n) : value;
        setText(String(next));
        if (next !== value) onValueChange(next);
        onBlur?.(e);
      }}
      className={cn("tabular-nums", className)}
      {...props}
    />
  );
}
