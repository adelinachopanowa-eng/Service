import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white font-bold">
            T
          </span>
          <span className="text-lg font-semibold text-slate-900">
            Сервиз на машини
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            Табло
          </Link>
          <Link
            href="/machines"
            className="rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            Машини
          </Link>
          <Link href="/machines/new" className="btn-primary">
            + Нова машина
          </Link>
        </nav>
      </div>
    </header>
  );
}
