import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DeleteButton } from "@/components/DeleteButton";
import {
  deleteMachine,
  deleteRecord,
  deleteSchedule,
} from "@/lib/actions";
import type {
  Machine,
  MaintenanceRecord,
  MaintenanceSchedule,
} from "@/lib/types";
import {
  formatDate,
  formatMoney,
  formatReading,
  machineTypeLabel,
  serviceTypeLabel,
  unitLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [machineRes, recordsRes, schedulesRes] = await Promise.all([
    supabase.from("tm_machines").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("tm_maintenance_records")
      .select("*")
      .eq("machine_id", id)
      .order("service_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("tm_maintenance_schedules")
      .select("*")
      .eq("machine_id", id)
      .order("created_at"),
  ]);

  if (!machineRes.data) notFound();

  const machine = machineRes.data as Machine;
  const records = (recordsRes.data ?? []) as MaintenanceRecord[];
  const schedules = (schedulesRes.data ?? []) as MaintenanceSchedule[];

  const totalCost = records.reduce(
    (sum, r) => sum + (r.cost ? Number(r.cost) : 0),
    0
  );

  const deleteMachineBound = deleteMachine.bind(null, machine.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/machines"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Машини
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{machine.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span
                className={
                  machine.machine_type === "truck"
                    ? "badge-blue"
                    : "badge-amber"
                }
              >
                {machineTypeLabel(machine.machine_type)}
              </span>
              {(machine.brand || machine.model) && (
                <span>
                  {[machine.brand, machine.model].filter(Boolean).join(" ")}
                </span>
              )}
              {machine.year && <span>· {machine.year}</span>}
              {machine.registration_number && (
                <span>· Рег. № {machine.registration_number}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/machines/${machine.id}/edit`}
              className="btn-secondary"
            >
              Редактирай
            </Link>
            <DeleteButton
              action={deleteMachineBound}
              confirmMessage={`Да изтрия ли машината "${machine.name}" и всичките ѝ записи?`}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Текущо показание">
          {formatReading(Number(machine.current_reading), machine.reading_unit)}
        </Stat>
        <Stat label="Мерна единица">{unitLabel(machine.reading_unit)}</Stat>
        <Stat label="Общи разходи">{formatMoney(totalCost)}</Stat>
      </div>

      {machine.notes && (
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Бележки
          </div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
            {machine.notes}
          </div>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Планове за периодична поддръжка
          </h2>
          <Link
            href={`/machines/${machine.id}/schedules/new`}
            className="btn-secondary"
          >
            + Нов план
          </Link>
        </div>
        {schedules.length === 0 ? (
          <div className="card p-5 text-sm text-slate-500">
            Няма добавени планове. Добавете план, за да получавате напомняния
            за следваща поддръжка.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {schedules.map((s) => {
              const lastReading = s.last_done_reading ?? 0;
              const dueAt = lastReading + Number(s.interval_value);
              const remaining = dueAt - Number(machine.current_reading);
              const isOverdue = remaining <= 0;
              const isSoon =
                !isOverdue &&
                remaining < Math.max(Number(s.interval_value) * 0.1, 500);
              const deleteScheduleBound = deleteSchedule.bind(
                null,
                machine.id,
                s.id
              );
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <div className="font-medium text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-500">
                      На всеки{" "}
                      {formatReading(
                        Number(s.interval_value),
                        machine.reading_unit
                      )}
                      {s.last_done_reading != null && (
                        <>
                          {" "}
                          · последно при{" "}
                          {formatReading(lastReading, machine.reading_unit)}
                          {s.last_done_date &&
                            ` (${formatDate(s.last_done_date)})`}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="font-medium text-slate-900">
                        На {formatReading(dueAt, machine.reading_unit)}
                      </div>
                      <div
                        className={
                          isOverdue
                            ? "text-red-600"
                            : isSoon
                              ? "text-amber-600"
                              : "text-slate-500"
                        }
                      >
                        {isOverdue
                          ? `Просрочено с ${formatReading(-remaining, machine.reading_unit)}`
                          : `Остават ${formatReading(remaining, machine.reading_unit)}`}
                      </div>
                    </div>
                    <DeleteButton
                      action={deleteScheduleBound}
                      label="✕"
                      className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                      confirmMessage="Да изтрия ли този план?"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            История на поддръжката
          </h2>
          <Link
            href={`/machines/${machine.id}/records/new`}
            className="btn-primary"
          >
            + Нов запис
          </Link>
        </div>
        {records.length === 0 ? (
          <div className="card p-5 text-sm text-slate-500">
            Все още няма записи за поддръжка.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {records.map((r) => {
              const deleteRecordBound = deleteRecord.bind(
                null,
                machine.id,
                r.id
              );
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            r.service_type === "repair"
                              ? "badge-red"
                              : "badge-green"
                          }
                        >
                          {serviceTypeLabel(r.service_type)}
                        </span>
                        <span className="font-medium text-slate-900">
                          {r.title}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDate(r.service_date)} ·{" "}
                        {formatReading(
                          Number(r.reading_at_service),
                          machine.reading_unit
                        )}
                        {r.performed_by && ` · ${r.performed_by}`}
                      </div>
                      {r.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                          {r.description}
                        </p>
                      )}
                      {(r.next_service_reading != null ||
                        r.next_service_date) && (
                        <div className="mt-2 text-xs text-slate-500">
                          Следваща:{" "}
                          {r.next_service_reading != null &&
                            formatReading(
                              Number(r.next_service_reading),
                              machine.reading_unit
                            )}
                          {r.next_service_date &&
                            ` · ${formatDate(r.next_service_date)}`}
                        </div>
                      )}
                      {r.notes && (
                        <p className="mt-2 text-xs italic text-slate-500">
                          {r.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="text-sm font-semibold text-slate-900">
                        {formatMoney(r.cost == null ? null : Number(r.cost))}
                      </div>
                      <DeleteButton
                        action={deleteRecordBound}
                        label="✕"
                        className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                        confirmMessage="Да изтрия ли този запис?"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{children}</div>
    </div>
  );
}
