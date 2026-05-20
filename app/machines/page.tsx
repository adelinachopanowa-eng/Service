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
      <div className="card p-6 text-sm text-red-600">
        Грешка при зареждане: {error.message}
      </div>
    );
  }

  const machines = (data ?? []) as Machine[];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Машини</h1>
          <p className="mt-1 text-sm text-slate-600">
            {machines.length === 0
              ? "Все още няма добавени машини."
              : `Общо ${machines.length} ${machines.length === 1 ? "машина" : "машини"}.`}
          </p>
        </div>
        <Link href="/machines/new" className="btn-primary">
          + Нова машина
        </Link>
      </div>

      {machines.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-base font-medium text-slate-900">
            Започнете с добавяне на машина
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Камиони и индустриална техника – на едно място.
          </p>
          <Link href="/machines/new" className="btn-primary mt-4">
            + Нова машина
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {machines.map((m) => (
            <Link
              key={m.id}
              href={`/machines/${m.id}`}
              className="card p-5 transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-slate-900">{m.name}</div>
                <span
                  className={
                    m.machine_type === "truck" ? "badge-blue" : "badge-amber"
                  }
                >
                  {machineTypeLabel(m.machine_type)}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {[m.brand, m.model].filter(Boolean).join(" ") || "—"}
              </div>
              {m.registration_number && (
                <div className="mt-1 text-xs text-slate-500">
                  Рег. № {m.registration_number}
                </div>
              )}
              <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Текущо показание
                </div>
                <div className="font-semibold text-slate-900">
                  {formatReading(Number(m.current_reading), m.reading_unit)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
