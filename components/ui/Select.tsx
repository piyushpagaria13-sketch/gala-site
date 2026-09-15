import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-card border border-ink-soft/20 bg-card px-4 py-3 text-ink ${className}`}
      {...props}
    >
      {children}
    </select>
  );
  // TODO: placeholder, error, and disabled states
}
