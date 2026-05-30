import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { GreaseEvent, GreaseDefect, Machine } from "@/lib/types";
import { formatReading, machineTypeLabel, timeSinceLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GreasingOverviewPage() {
  const supabase = await createSupabaseServer();

  const [machinesRes, eventsRes, defectsRes] = await Promise.all([
    supabase
      .from("tm_machines")
      .select("*")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("tm_grease_events")
      .select("*")
      .is("deleted_at", null)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("tm_grease_defects")
      .select("*")
      .is("deleted_at", null)
      .eq("status", "open"),
  ]);

  const machines = (machinesRes.data ?? []) as Machine[];
  const events = (eventsRes.data ?? []) as GreaseEvent[];
  const defects = (defectsRes.data ?? []) as GreaseDefect[];

  const lastByMachine = new Map<string, GreaseEvent>();
  for (const e of events) {
    if (!lastByMachine.has(e.machine_id)) lastByMachine.set(e.machine_id, e);
  }
  const openDefects = new Map<string, number>();
  for (const d of defects) {
    openDefects.set(d.machine_id, (openDefects.get(d.machine_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-text">Гресиране</h1>
        <p className="mt-1 text-sm text-soft">
          Бързо отбелязване на гресирани машини с дата и показание. Натисни
          &laquo;Гресирах&raquo; на машината.
        </p>
      </div>

      {defects.length > 0 && (
        <div className="rounded-lg border border-[#f0a0a0] bg-[#fce4e4] px-4 py-3 text-sm text-[#8b0000]">
          ⚠️ {defects.length}{" "}
          {defects.length === 1 ? "отворен дефект" : "отворени дефекта"} по
          системите за гресиране.
        </div>
      )}

      {machines.length === 0 ? (
        <div className="card text-center text-sm text-soft">
          Няма машини. Добави машина първо.
        </div>
      ) : (
        <ul className="space-y-3">
          {machines.map((m) => {
            const last = lastByMachine.get(m.id);
            const open = openDefects.get(m.id) ?? 0;
            return (
              <li key={m.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/greasing/${m.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-extrabold text-text">
                        {m.name}
                      </span>
                      {open > 0 && (
                        <span className="badge-red shrink-0">
                          {open} дефект{open === 1 ? "" : "а"}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-soft">
                      {machineTypeLabel(m.machine_type)}
                    </div>
                    {last ? (
                      <div className="mt-1 text-xs text-soft">
                        Последно{" "}
                        <span className="font-bold text-text">
                          {timeSinceLabel(last.event_date)}
                        </span>{" "}
                        · при{" "}
                        {formatReading(Number(last.reading), m.reading_unit)}
                        {last.scope === "partial" && (
                          <span className="badge-yellow ml-1">частично</span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs italic text-soft">
                        Все още не е гресирано
                      </div>
                    )}
                  </Link>
                  <Link
                    href={`/greasing/${m.id}/log`}
                    className="btn-yellow btn-sm shrink-0"
                  >
                    ✓ Гресирах
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
