import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type {
  Machine,
  MaintenanceRecord,
  MaintenanceSchedule,
} from "@/lib/types";
import {
  formatDate,
  formatReading,
  machineTypeLabel,
  serviceTypeLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

interface DueItem {
  machine: Machine;
  schedule: MaintenanceSchedule;
  dueAt: number;
  remaining: number;
}

function computeDue(
  machines: Machine[],
  schedules: MaintenanceSchedule[],
  lastRecordByMachine: Map<string, MaintenanceRecord | undefined>
): DueItem[] {
  const items: DueItem[] = [];
  const machineById = new Map(machines.map((m) => [m.id, m]));

  for (const s of schedules) {
    const machine = machineById.get(s.machine_id);
    if (!machine) continue;
    const lastReading = s.last_done_reading ?? 0;
    const dueAt = lastReading + Number(s.interval_value);
    const remaining = dueAt - Number(machine.current_reading);
    items.push({ machine, schedule: s, dueAt, remaining });
  }

  for (const machine of machines) {
    const last = lastRecordByMachine.get(machine.id);
    if (last?.next_service_reading != null) {
      const remaining =
        Number(last.next_service_reading) - Number(machine.current_reading);
      items.push({
        machine,
        schedule: {
          id: `record-${last.id}`,
          machine_id: machine.id,
          name: last.title,
          interval_value: 0,
          last_done_reading: Number(last.reading_at_service),
          last_done_date: last.service_date,
          notes: null,
          created_at: last.created_at,
        },
        dueAt: Number(last.next_service_reading),
        remaining,
      });
    }
  }

  items.sort((a, b) => a.remaining - b.remaining);
  return items;
}

export default async function DashboardPage() {
  const [machinesRes, recordsRes, schedulesRes] = await Promise.all([
    supabase
      .from("tm_machines")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("tm_maintenance_records")
      .select("*")
      .order("service_date", { ascending: false }),
    supabase.from("tm_maintenance_schedules").select("*"),
  ]);

  const machines = (machinesRes.data ?? []) as Machine[];
  const records = (recordsRes.data ?? []) as MaintenanceRecord[];
  const schedules = (schedulesRes.data ?? []) as MaintenanceSchedule[];

  const lastByMachine = new Map<string, MaintenanceRecord | undefined>();
  for (const r of records) {
    if (!lastByMachine.has(r.machine_id)) {
      lastByMachine.set(r.machine_id, r);
    }
  }

  const due = computeDue(machines, schedules, lastByMachine).slice(0, 10);
  const recent = records.slice(0, 8);

  const totalCost = records.reduce(
    (sum, r) => sum + (r.cost ? Number(r.cost) : 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Табло</h1>
        <p className="mt-1 text-sm text-slate-600">
          Преглед на всички машини, поддръжка и предстоящи дейности.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Машини" value={machines.length} />
        <StatCard label="Записи за поддръжка" value={records.length} />
        <StatCard
          label="Общи разходи"
          value={`${totalCost.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} лв.`}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Предстоящи поддръжки
          </h2>
        </div>
        {due.length === 0 ? (
          <div className="card p-6 text-sm text-slate-500">
            Няма предстоящи поддръжки. Добавете план за периодична поддръжка от
            страницата на машината.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {due.map((item, idx) => {
              const isOverdue = item.remaining <= 0;
              const isSoon =
                !isOverdue &&
                item.remaining <
                  Math.max(Number(item.schedule.interval_value) * 0.1, 500);
              return (
                <Link
                  key={`${item.schedule.id}-${idx}`}
                  href={`/machines/${item.machine.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {item.machine.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {machineTypeLabel(item.machine.machine_type)} ·{" "}
                      {item.schedule.name}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-slate-900">
                      На{" "}
                      {formatReading(item.dueAt, item.machine.reading_unit)}
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
                        ? `Просрочено с ${formatReading(-item.remaining, item.machine.reading_unit)}`
                        : `Остават ${formatReading(item.remaining, item.machine.reading_unit)}`}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Последни записи
          </h2>
          <Link href="/machines" className="text-sm text-brand-600 hover:underline">
            Всички машини →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card p-6 text-sm text-slate-500">
            Все още няма записи. Добавете машина и направете първия запис за
            поддръжка.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {recent.map((r) => {
              const m = machines.find((m) => m.id === r.machine_id);
              return (
                <Link
                  key={r.id}
                  href={m ? `/machines/${m.id}` : "#"}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">
                      {r.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {m?.name ?? "—"} · {formatDate(r.service_date)}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <span
                      className={
                        r.service_type === "repair"
                          ? "badge-red"
                          : "badge-green"
                      }
                    >
                      {serviceTypeLabel(r.service_type)}
                    </span>
                    {m && (
                      <div className="mt-1 text-xs text-slate-500">
                        {formatReading(
                          Number(r.reading_at_service),
                          m.reading_unit
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
