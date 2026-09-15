"use client";

import type { ReactNode } from "react";

type ModalProps = {
  open?: boolean;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
};

export function Modal({ open, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-bg/70 p-4">
      <div className="w-full max-w-md rounded-card-lg bg-card p-6 text-ink">
        {title ? (
          <h2 className="font-display text-xl text-ink">{title}</h2>
        ) : (
          <p>Modal</p>
        )}
        <div className="mt-3">{children}</div>
        {/* TODO: overlay click + close button; trap focus */}
      </div>
    </div>
  );
}
