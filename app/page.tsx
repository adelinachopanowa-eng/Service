import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
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
          category: "other",
          last_done_reading: Number(last.reading_at_service),
          last_done_date: last.service_date,
          notes: null,
          created_at: last.created_at,
          deleted_at: null,
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
  const supabase = await createSupabaseServer();
  const [machinesRes, recordsRes, schedulesRes] = await Promise.all([
    supabase
      .from("tm_machines")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("tm_maintenance_records")
      .select("*")
      .is("deleted_at", null)
      .order("service_date", { ascending: false }),
    supabase
      .from("tm_maintenance_schedules")
      .select("*")
      .is("deleted_at", null),
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
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <a href="/api/export" download className="btn-outline btn-sm">
          ⬇️ Експорт CSV
        </a>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Машини" value={machines.length} />
        <StatCard label="Записи" value={records.length} />
        <StatCard
          label="Разходи (лв.)"
          value={totalCost.toLocaleString("bg-BG", {
            maximumFractionDigits: 0,
          })}
        />
      </div>

      <section className="card">
        <h3 className="card-title">Предстоящи поддръжки</h3>
        {due.length === 0 ? (
          <p className="text-sm text-soft">
            Няма предстоящи поддръжки. Добавете план за периодична поддръжка от
            страницата на машината.
          </p>
        ) : (
          <ul className="space-y-2">
            {due.map((item, idx) => {
              const isOverdue = item.remaining <= 0;
              const isSoon =
                !isOverdue &&
                item.remaining <
                  Math.max(Number(item.schedule.interval_value) * 0.1, 500);
              const statusClass = isOverdue
                ? "text-[#8b0000]"
                : isSoon
                  ? "text-[#cc8a00]"
                  : "text-soft";
              return (
                <li key={`${item.schedule.id}-${idx}`}>
                  <Link
                    href={`/machines/${item.machine.id}`}
                    className="entity-row active:bg-cream"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-text">
                        {item.machine.name}
                      </div>
                      <div className="truncate meta">
                        {machineTypeLabel(item.machine.machine_type)} ·{" "}
                        {item.schedule.name}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <div className="font-bold text-text">
                        {formatReading(item.dueAt, item.machine.reading_unit)}
                      </div>
                      <div className={statusClass}>
                        {isOverdue
                          ? `-${formatReading(-item.remaining, item.machine.reading_unit)}`
                          : `+${formatReading(item.remaining, item.machine.reading_unit)}`}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="card-title m-0 border-0 pb-0">Последни записи</h3>
          <Link
            href="/machines"
            className="text-xs font-bold text-brand active:text-brand-light"
          >
            Машини →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-soft">
            Все още няма записи. Добавете машина и направете първия запис за
            поддръжка.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => {
              const m = machines.find((m) => m.id === r.machine_id);
              return (
                <li key={r.id}>
                  <Link
                    href={m ? `/machines/${m.id}` : "#"}
                    className="entity-row active:bg-cream"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={serviceTypeBadgeClass(r.service_type)}>
                          {serviceTypeLabel(r.service_type)}
                        </span>
                        <span className="truncate font-bold text-text">
                          {r.title}
                        </span>
                      </div>
                      <div className="meta truncate">
                        {m?.name ?? "—"} · {formatDate(r.service_date)}
                      </div>
                    </div>
                    {m && (
                      <div className="shrink-0 text-right text-xs text-soft">
                        {formatReading(
                          Number(r.reading_at_service),
                          m.reading_unit
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
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
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
