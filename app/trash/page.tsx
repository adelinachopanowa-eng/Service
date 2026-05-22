import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { DeleteButton } from "@/components/DeleteButton";
import { RestoreButton } from "@/components/RestoreButton";
import {
  hardDeleteMachine,
  hardDeleteRecord,
  hardDeleteSchedule,
  restoreMachine,
  restoreRecord,
  restoreSchedule,
} from "@/lib/actions";
import type {
  Machine,
  MaintenanceRecord,
  MaintenanceSchedule,
} from "@/lib/types";
import {
  formatDate,
  formatReading,
  machineTypeLabel,
  serviceTypeBadgeClass,
  serviceTypeLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const supabase = await createSupabaseServer();
  const [machinesRes, recordsRes, schedulesRes] = await Promise.all([
    supabase
      .from("tm_machines")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("tm_maintenance_records")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("tm_maintenance_schedules")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  const machines = (machinesRes.data ?? []) as Machine[];
  const records = (recordsRes.data ?? []) as MaintenanceRecord[];
  const schedules = (schedulesRes.data ?? []) as MaintenanceSchedule[];

  const machineNames = new Map<string, string>();
  const allMachineIds = new Set<string>([
    ...records.map((r) => r.machine_id),
    ...schedules.map((s) => s.machine_id),
  ]);
  if (allMachineIds.size > 0) {
    const { data } = await supabase
      .from("tm_machines")
      .select("id, name")
      .in("id", Array.from(allMachineIds));
    for (const m of data ?? []) machineNames.set(m.id, m.name);
  }
  for (const m of machines) machineNames.set(m.id, m.name);

  const total = machines.length + records.length + schedules.length;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/"
          className="text-xs font-bold text-brand active:text-brand-light"
        >
          ← Табло
        </Link>
        <h2 className="mt-1 text-base font-extrabold text-text">Кошче</h2>
        <p className="text-xs text-soft">
          Тук са преместените за изтриване елементи. Натисни{" "}
          <strong>Възстанови</strong>, за да ги върнеш, или{" "}
          <strong>Изтрий окончателно</strong>, за да ги премахнеш завинаги
          заедно с прикачените снимки.
        </p>
      </div>

      {total === 0 ? (
        <div className="card text-center text-sm text-soft">
          Кошчето е празно.
        </div>
      ) : null}

      {machines.length > 0 && (
        <section className="card">
          <h3 className="card-title">Машини ({machines.length})</h3>
          <ul className="space-y-2">
            {machines.map((m) => {
              const restoreBound = restoreMachine.bind(null, m.id);
              const hardDeleteBound = hardDeleteMachine.bind(null, m.id);
              return (
                <li
                  key={m.id}
                  className="rounded-lg border border-bordergray bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-text">
                        {m.name}
                      </div>
                      <div className="meta">
                        {machineTypeLabel(m.machine_type)} ·{" "}
                        {formatReading(
                          Number(m.current_reading),
                          m.reading_unit
                        )}
                      </div>
                      <div className="meta">
                        Преместено: {formatDate(m.deleted_at)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <RestoreButton action={restoreBound} />
                    <DeleteButton
                      action={hardDeleteBound}
                      label="Изтрий окончателно"
                      className="btn-danger btn-sm"
                      confirmMessage={`Окончателно изтриване на "${m.name}" и всички свързани записи и снимки. Това НЕ може да се върне. Сигурен ли си?`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {records.length > 0 && (
        <section className="card">
          <h3 className="card-title">Записи за поддръжка ({records.length})</h3>
          <ul className="space-y-2">
            {records.map((r) => {
              const restoreBound = restoreRecord.bind(null, r.machine_id, r.id);
              const hardDeleteBound = hardDeleteRecord.bind(null, r.id);
              const machineName = machineNames.get(r.machine_id) ?? "—";
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-bordergray bg-white p-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={serviceTypeBadgeClass(r.service_type)}>
                      {serviceTypeLabel(r.service_type)}
                    </span>
                    <span className="font-bold text-text">{r.title}</span>
                  </div>
                  <div className="meta mt-1">
                    {machineName} · {formatDate(r.service_date)}
                  </div>
                  <div className="meta">
                    Преместено: {formatDate(r.deleted_at)}
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <RestoreButton action={restoreBound} />
                    <DeleteButton
                      action={hardDeleteBound}
                      label="Изтрий окончателно"
                      className="btn-danger btn-sm"
                      confirmMessage="Окончателно изтриване на записа и прикачените снимки. Това НЕ може да се върне. Сигурен ли си?"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {schedules.length > 0 && (
        <section className="card">
          <h3 className="card-title">
            Планове за поддръжка ({schedules.length})
          </h3>
          <ul className="space-y-2">
            {schedules.map((s) => {
              const restoreBound = restoreSchedule.bind(
                null,
                s.machine_id,
                s.id
              );
              const hardDeleteBound = hardDeleteSchedule.bind(null, s.id);
              const machineName = machineNames.get(s.machine_id) ?? "—";
              return (
                <li
                  key={s.id}
                  className="rounded-lg border border-bordergray bg-white p-3"
                >
                  <div className="font-bold text-text">{s.name}</div>
                  <div className="meta mt-1">
                    {machineName} · Интервал {s.interval_value}
                  </div>
                  <div className="meta">
                    Преместено: {formatDate(s.deleted_at)}
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <RestoreButton action={restoreBound} />
                    <DeleteButton
                      action={hardDeleteBound}
                      label="Изтрий окончателно"
                      className="btn-danger btn-sm"
                      confirmMessage="Окончателно изтриване. Това НЕ може да се върне. Сигурен ли си?"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
