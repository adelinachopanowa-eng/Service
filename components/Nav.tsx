"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/lib/actions";

const tabs = [
  { href: "/", label: "Табло" },
  { href: "/machines", label: "Машини" },
  { href: "/greasing", label: "Гресиране" },
  { href: "/machines/new", label: "+ Нова" },
  { href: "/trash", label: "Кошче" },
];

export function Nav() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/login/")) return null;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/machines") {
      return pathname === "/machines" || pathname.startsWith("/machines/");
    }
    if (href === "/greasing") return pathname.startsWith("/greasing");
    return pathname === href;
  };

  return <NavInner isActive={isActive} />;
}

function NavInner({
  isActive,
}: {
  isActive: (href: string) => boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-topbar">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-2.5 pt-3.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-yellow font-extrabold text-brand">
          П
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold tracking-tight">
            Сервиз на машини
          </h1>
          <p className="truncate text-[0.72rem] opacity-70">
            Камиони и индустриална техника
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => signOut())}
          className="rounded-md border border-white/30 px-2.5 py-1 text-[0.72rem] font-bold text-white/90
            active:bg-white/10 disabled:opacity-60"
          aria-label="Изход"
        >
          {pending ? "..." : "Изход"}
        </button>
      </div>
      <nav
        className="mx-auto flex max-w-3xl overflow-x-auto border-t border-white/10
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={
                "flex-1 whitespace-nowrap border-b-[3px] px-4 py-2.5 text-center text-[0.82rem] font-bold transition " +
                (active
                  ? "border-brand-yellow text-brand-yellow"
                  : "border-transparent text-white/60 hover:text-white")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
