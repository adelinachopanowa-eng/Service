"use client";

import { useState } from "react";
import { signIn } from "./actions";

interface Props {
  nextPath: string;
}

function isNextRedirect(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const digest = (err as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function LoginForm({ nextPath }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const formData = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await signIn(formData);
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      const msg = err instanceof Error ? err.message : "Възникна грешка.";
      setError(msg);
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <div className="card space-y-3">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="input"
            placeholder="ime@example.com"
          />
        </div>
        <div>
          <label className="label">Парола</label>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="input"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#f0a0a0] bg-[#fce4e4] px-4 py-3 text-sm text-[#8b0000]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary btn-full disabled:opacity-60"
      >
        {pending ? "Влизане..." : "Влез"}
      </button>
    </form>
  );
}
