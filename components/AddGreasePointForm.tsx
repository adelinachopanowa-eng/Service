"use client";

import { useRef, useState } from "react";

interface Props {
  action: (formData: FormData) => Promise<void>;
}

function isNextRedirect(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const digest = (err as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function AddGreasePointForm({ action }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("name") ?? "").trim()) return;
    setPending(true);
    try {
      await action(formData);
      formRef.current?.reset();
    } catch (err) {
      if (isNextRedirect(err)) throw err;
    } finally {
      setPending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
      <input
        name="name"
        placeholder="напр. Щипка, Кофа, Кран..."
        className="input flex-1"
      />
      <button
        type="submit"
        disabled={pending}
        className="btn-primary btn-sm shrink-0 disabled:opacity-60"
      >
        {pending ? "..." : "Добави"}
      </button>
    </form>
  );
}
