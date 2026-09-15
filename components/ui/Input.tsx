import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-card border border-ink-soft/20 bg-card px-4 py-3 text-ink outline-none ${className}`}
      {...props}
    />
  );
  // TODO: error / focus / disabled states
}
