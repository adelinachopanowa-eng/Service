"use client";

import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
  confirmMessage?: string;
  label?: string;
  className?: string;
}

export function DeleteButton({
  action,
  confirmMessage = "Сигурни ли сте, че искате да изтриете този запис?",
  label = "Изтрий",
  className = "btn-danger btn-sm",
}: Props) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmMessage)) {
          start(() => action());
        }
      }}
      className={className}
    >
      {pending ? "Изтриване..." : label}
    </button>
  );
}
