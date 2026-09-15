import type { HTMLAttributes } from "react";

type PillProps = HTMLAttributes<HTMLSpanElement>;

export function Pill({ className = "", children, ...props }: PillProps) {
  return (
    <span
      className={`inline-flex rounded-pill bg-gold-pale px-3 py-1 text-sm text-navy-bg ${className}`}
      {...props}
    >
      {children ?? "Pill"}
    </span>
  );
  // TODO: selected / unselected / status variants
}
