import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, invoicePhotoUrls } from "@/lib/supabase";
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
  serviceTypeBadgeClass,
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
    supabase
      .from("tm_machines")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("tm_maintenance_records")
      .select("*")
      .eq("machine_id", id)
      .is("deleted_at", null)
      .order("service_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("tm_maintenance_schedules")
      .select("*")
      .eq("machine_id", id)
      .is("deleted_at", null)
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
    <div className="space-y-4">
      <div>
        <Link
          href="/machines"
          className="text-xs font-bold text-brand active:text-brand-light"
        >
          ← Машини
        </Link>
      </div>

      <div className="card">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold leading-tight text-text">
              {machine.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-soft">
              <span
                className={
                  machine.machine_type === "truck"
                    ? "badge-green"
                    : "badge-yellow"
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
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Показание">
            {formatReading(
              Number(machine.current_reading),
              machine.reading_unit
            )}
          </Stat>
          <Stat label="Единица">{unitLabel(machine.reading_unit)}</Stat>
          <Stat label="Разходи">{formatMoney(totalCost)}</Stat>
        </div>
        {machine.notes && (
          <div className="mt-4 rounded-lg bg-cream p-3 text-sm text-text">
            <div className="mb-1 stat-label">Бележки</div>
            <div className="whitespace-pre-wrap">{machine.notes}</div>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/machines/${machine.id}/edit`}
            className="btn-outline btn-sm"
          >
            Редактирай
          </Link>
          <DeleteButton
            action={deleteMachineBound}
            confirmMessage={`Да преместя ли "${machine.name}" в кошчето? Може да я възстановиш от страница "Кошче".`}
            label="В кошчето"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/machines/${machine.id}/records/new`}
          className="btn-primary"
        >
          + Нов запис
        </Link>
        <Link
          href={`/machines/${machine.id}/schedules/new`}
          className="btn-yellow"
        >
          + Нов план
        </Link>
      </div>

      <section className="card">
        <h3 className="card-title">Планове за периодична поддръжка</h3>
        {schedules.length === 0 ? (
          <p className="text-sm text-soft">
            Няма добавени планове. Добавете план, за да получавате напомняния
            за следваща поддръжка.
          </p>
        ) : (
          <ul className="space-y-2">
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
              const statusClass = isOverdue
                ? "text-[#8b0000]"
                : isSoon
                  ? "text-[#cc8a00]"
                  : "text-soft";
              return (
                <li
                  key={s.id}
                  className="rounded-lg bg-cream p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-text">
                        {s.name}
                      </div>
                      <div className="meta">
                        Всеки{" "}
                        {formatReading(
                          Number(s.interval_value),
                          machine.reading_unit
                        )}
                      </div>
                      {s.last_done_reading != null && (
                        <div className="meta">
                          Последно при{" "}
                          {formatReading(lastReading, machine.reading_unit)}
                          {s.last_done_date &&
                            ` (${formatDate(s.last_done_date)})`}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <div className="font-bold text-text">
                        {formatReading(dueAt, machine.reading_unit)}
                      </div>
                      <div className={statusClass}>
                        {isOverdue
                          ? `-${formatReading(-remaining, machine.reading_unit)}`
                          : `+${formatReading(remaining, machine.reading_unit)}`}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <DeleteButton
                      action={deleteScheduleBound}
                      label="Изтрий"
                      className="btn-danger btn-sm"
                      confirmMessage="Да преместя ли този план в кошчето?"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">История на поддръжката</h3>
        {records.length === 0 ? (
          <p className="text-sm text-soft">
            Все още няма записи за поддръжка.
          </p>
        ) : (
          <ul className="space-y-3">
            {records.map((r) => {
              const deleteRecordBound = deleteRecord.bind(
                null,
                machine.id,
                r.id
              );
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-bordergray bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={serviceTypeBadgeClass(r.service_type)}>
                          {serviceTypeLabel(r.service_type)}
                        </span>
                        <span className="font-bold text-text">{r.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-soft">
                        {formatDate(r.service_date)} ·{" "}
                        {formatReading(
                          Number(r.reading_at_service),
                          machine.reading_unit
                        )}
                        {r.performed_by && ` · ${r.performed_by}`}
                      </div>
                      {r.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-text">
                          {r.description}
                        </p>
                      )}
                      {(() => {
                        const photos = invoicePhotoUrls(r.invoice_photo_paths);
                        if (photos.length === 0) return null;
                        return (
                          <div
                            className={
                              "mt-2 grid gap-2 " +
                              (photos.length === 1
                                ? "grid-cols-1"
                                : "grid-cols-2 sm:grid-cols-3")
                            }
                          >
                            {photos.map((photo) => (
                              <a
                                key={photo.path}
                                href={photo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-lg border border-bordergray bg-cream"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photo.url}
                                  alt="Снимка на фактурата"
                                  className={
                                    "block w-full object-cover " +
                                    (photos.length === 1
                                      ? "max-h-72 object-contain"
                                      : "aspect-square")
                                  }
                                  loading="lazy"
                                />
                              </a>
                            ))}
                          </div>
                        );
                      })()}
                      {(r.next_service_reading != null ||
                        r.next_service_date) && (
                        <div className="mt-2 rounded bg-cream px-2 py-1 text-xs text-soft">
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
                        <p className="mt-2 text-xs italic text-soft">
                          {r.notes}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-extrabold text-brand">
                        {formatMoney(
                          r.cost == null ? null : Number(r.cost)
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <Link
                      href={`/machines/${machine.id}/records/${r.id}/edit`}
                      className="btn-outline btn-sm"
                    >
                      Редактирай
                    </Link>
                    <DeleteButton
                      action={deleteRecordBound}
                      label="Изтрий"
                      className="btn-danger btn-sm"
                      confirmMessage="Да преместя ли този запис в кошчето?"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
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
    <div className="rounded-lg bg-cream p-3">
      <div className="stat-label">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-text sm:text-base">
        {children}
      </div>
    </div>
  );
}
