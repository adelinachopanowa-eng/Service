import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { invoicePhotoUrls } from "@/lib/supabase";
import { AddGreasePointForm } from "@/components/AddGreasePointForm";
import { ActionButton } from "@/components/ActionButton";
import { DeleteButton } from "@/components/DeleteButton";
import {
  createGreasePoint,
  deleteGreaseDefect,
  deleteGreaseEvent,
  deleteGreasePoint,
  reopenGreaseDefect,
  resolveGreaseDefect,
} from "@/lib/grease-actions";
import type {
  GreaseDefect,
  GreaseEvent,
  GreasePoint,
  Machine,
} from "@/lib/types";
import {
  defectSeverityBadgeClass,
  defectSeverityLabel,
  formatDate,
  formatReading,
  timeSinceLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MachineGreasingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const [machineRes, pointsRes, eventsRes, defectsRes] = await Promise.all([
    supabase
      .from("tm_machines")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("tm_grease_points")
      .select("*")
      .eq("machine_id", id)
      .is("deleted_at", null)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("tm_grease_events")
      .select("*")
      .eq("machine_id", id)
      .is("deleted_at", null)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("tm_grease_defects")
      .select("*")
      .eq("machine_id", id)
      .is("deleted_at", null)
      .order("status")
      .order("reported_date", { ascending: false }),
  ]);

  if (!machineRes.data) notFound();

  const machine = machineRes.data as Machine;
  const points = (pointsRes.data ?? []) as GreasePoint[];
  const events = (eventsRes.data ?? []) as GreaseEvent[];
  const defects = (defectsRes.data ?? []) as GreaseDefect[];

  const openDefects = defects.filter((d) => d.status === "open");
  const resolvedDefects = defects.filter((d) => d.status === "resolved");
  const createPointBound = createGreasePoint.bind(null, machine.id);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/greasing"
          className="text-xs font-bold text-brand active:text-brand-light"
        >
          ← Гресиране
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="text-lg font-extrabold text-text">{machine.name}</h2>
          <Link
            href={`/greasing/${machine.id}/log`}
            className="btn-yellow btn-sm shrink-0"
          >
            ✓ Гресирах
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/greasing/${machine.id}/log`}
          className="btn-primary"
        >
          + Гресиране
        </Link>
        <Link
          href={`/greasing/${machine.id}/defect`}
          className="btn-outline"
        >
          ⚠️ Дефект
        </Link>
      </div>

      {openDefects.length > 0 && (
        <section className="card">
          <h3 className="card-title">Отворени дефекти ({openDefects.length})</h3>
          <ul className="space-y-2">
            {openDefects.map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-[#f0a0a0] bg-[#fce4e4]/40 p-3"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={defectSeverityBadgeClass(d.severity)}>
                    {defectSeverityLabel(d.severity)}
                  </span>
                  {d.point_name && (
                    <span className="badge-soft">{d.point_name}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-text">{d.description}</p>
                <div className="meta mt-1">
                  Регистриран {formatDate(d.reported_date)}
                  {d.reading != null &&
                    ` · при ${formatReading(Number(d.reading), machine.reading_unit)}`}
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <ActionButton
                    action={resolveGreaseDefect.bind(null, machine.id, d.id)}
                    label="✓ Отстранен"
                    className="btn-yellow btn-sm"
                  />
                  <DeleteButton
                    action={deleteGreaseDefect.bind(null, machine.id, d.id)}
                    label="Изтрий"
                    className="btn-danger btn-sm"
                    confirmMessage="Да изтрия ли този дефект?"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h3 className="card-title">Агрегати за гресиране</h3>
        <p className="mb-3 text-xs text-soft">
          Дефинирай агрегатите (щипка, кофа, кран, шаси...), за да можеш да
          отбелязваш частично гресиране.
        </p>
        {points.length > 0 && (
          <ul className="mb-3 space-y-2">
            {points.map((p) => (
              <li key={p.id} className="entity-row">
                <span className="font-bold text-text">{p.name}</span>
                <DeleteButton
                  action={deleteGreasePoint.bind(null, machine.id, p.id)}
                  label="✕"
                  className="rounded-md px-2 py-1 text-sm text-soft active:bg-[#fce4e4] active:text-[#8b0000]"
                  confirmMessage={`Да премахна ли агрегат "${p.name}"?`}
                />
              </li>
            ))}
          </ul>
        )}
        <AddGreasePointForm action={createPointBound} />
      </section>

      <section className="card">
        <h3 className="card-title">История на гресирането</h3>
        {events.length === 0 ? (
          <p className="text-sm text-soft">Все още няма записи за гресиране.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const photos = invoicePhotoUrls(e.invoice_photo_paths);
              return (
                <li
                  key={e.id}
                  className="rounded-lg border border-bordergray bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={
                            e.scope === "full" ? "badge-green" : "badge-yellow"
                          }
                        >
                          {e.scope === "full" ? "Пълно" : "Частично"}
                        </span>
                        <span className="font-bold text-text">
                          {formatDate(e.event_date)}
                        </span>
                        <span className="text-xs text-soft">
                          ({timeSinceLabel(e.event_date)})
                        </span>
                      </div>
                      <div className="meta mt-1">
                        При{" "}
                        {formatReading(Number(e.reading), machine.reading_unit)}
                        {e.performed_by && ` · ${e.performed_by}`}
                      </div>
                      {e.scope === "partial" && e.point_names.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {e.point_names.map((n, i) => (
                            <span key={i} className="badge-soft">
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                      {e.notes && (
                        <p className="mt-1 text-xs italic text-soft">
                          {e.notes}
                        </p>
                      )}
                      {photos.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
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
                                alt=""
                                className="block aspect-square w-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <DeleteButton
                      action={deleteGreaseEvent.bind(null, machine.id, e.id)}
                      label="Изтрий"
                      className="btn-danger btn-sm"
                      confirmMessage="Да изтрия ли този запис за гресиране?"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {resolvedDefects.length > 0 && (
        <section className="card">
          <h3 className="card-title">
            Отстранени дефекти ({resolvedDefects.length})
          </h3>
          <ul className="space-y-2">
            {resolvedDefects.map((d) => (
              <li key={d.id} className="rounded-lg bg-cream p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="badge-green">Отстранен</span>
                  {d.point_name && (
                    <span className="badge-soft">{d.point_name}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-text">{d.description}</p>
                <div className="meta mt-1">
                  {formatDate(d.reported_date)} → {formatDate(d.resolved_date)}
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <ActionButton
                    action={reopenGreaseDefect.bind(null, machine.id, d.id)}
                    label="Отвори отново"
                    className="btn-outline btn-sm"
                  />
                  <DeleteButton
                    action={deleteGreaseDefect.bind(null, machine.id, d.id)}
                    label="Изтрий"
                    className="btn-danger btn-sm"
                    confirmMessage="Да изтрия ли този дефект?"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
