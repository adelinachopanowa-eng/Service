import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Machine } from "@/lib/types";
import { formatReading, machineTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MachinesPage() {
  const { data, error } = await supabase
    .from("tm_machines")
    .select("*")
    .order("name");

  if (error) {
    return (
      <div className="card text-sm text-[#8b0000]">
        Грешка при зареждане: {error.message}
      </div>
    );
  }

  const machines = (data ?? []) as Machine[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-text">Машини</h2>
          <p className="text-xs text-soft">
            {machines.length === 0
              ? "Все още няма добавени машини."
              : `Общо ${machines.length} ${machines.length === 1 ? "машина" : "машини"}.`}
          </p>
        </div>
        <Link href="/machines/new" className="btn-yellow btn-sm">
          + Нова
        </Link>
      </div>

      {machines.length === 0 ? (
        <div className="card text-center">
          <div className="text-base font-bold text-text">
            Започнете с добавяне на машина
          </div>
          <p className="mt-1 text-sm text-soft">
            Камиони и индустриална техника – на едно място.
          </p>
          <Link href="/machines/new" className="btn-primary btn-full mt-4">
            + Нова машина
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {machines.map((m) => (
            <li key={m.id}>
              <Link href={`/machines/${m.id}`} className="card block">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-extrabold text-text">
                      {m.name}
                    </div>
                    <div className="truncate text-xs text-soft">
                      {[m.brand, m.model].filter(Boolean).join(" ") || "—"}
                      {m.registration_number && ` · ${m.registration_number}`}
                    </div>
                  </div>
                  <span
                    className={
                      m.machine_type === "truck"
                        ? "badge-green shrink-0"
                        : "badge-yellow shrink-0"
                    }
                  >
                    {machineTypeLabel(m.machine_type)}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2 border-t border-bordergray pt-3">
                  <span className="stat-label">Показание</span>
                  <span className="text-lg font-extrabold text-brand">
                    {formatReading(Number(m.current_reading), m.reading_unit)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
