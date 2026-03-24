"use client";

import { type ReactNode } from "react";

type ConfirmDialogProps = {
  children: ReactNode;
  message: string;
  className?: string;
};

export function ConfirmDialog({
  children,
  message,
  className = "",
}: ConfirmDialogProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      className={className}
    >
      {children}
    </button>
  );
}
