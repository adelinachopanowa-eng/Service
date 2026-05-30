"use client";

import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
  label: string;
  pendingLabel?: string;
  className?: string;
  confirmMessage?: string;
}

export function ActionButton({
  action,
  label,
  pendingLabel,
  className = "btn-outline btn-sm",
  confirmMessage,
}: Props) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirmMessage && !confirm(confirmMessage)) return;
        start(() => action());
      }}
      className={className + " disabled:opacity-60"}
    >
      {pending ? (pendingLabel ?? "...") : label}
    </button>
  );
}
