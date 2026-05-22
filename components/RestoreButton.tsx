"use client";

import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
  label?: string;
  className?: string;
}

export function RestoreButton({
  action,
  label = "Възстанови",
  className = "btn-yellow btn-sm",
}: Props) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => action())}
      className={className}
    >
      {pending ? "Възстановяване..." : label}
    </button>
  );
}
