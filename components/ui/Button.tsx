import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`rounded-pill bg-gold px-5 py-2 font-medium text-navy-bg disabled:opacity-[0.35] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
