import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { SchedulePerformedForm } from "@/components/SchedulePerformedForm";
import { logSchedulePerformed } from "@/lib/actions";
import type { Machine, MaintenanceSchedule } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LogSchedulePage({
  params,
}: {
  params: Promise<{ id: string; scheduleId: string }>;
}) {
  const { id, scheduleId } = await params;
  const supabase = await createSupabaseServer();

  const [machineRes, scheduleRes] = await Promise.all([
    supabase
      .from("tm_machines")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("tm_maintenance_schedules")
      .select("*")
      .eq("id", scheduleId)
      .eq("machine_id", id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  if (!machineRes.data || !scheduleRes.data) notFound();

  const machine = machineRes.data as Machine;
  const schedule = scheduleRes.data as MaintenanceSchedule;
  const action = logSchedulePerformed.bind(null, machine.id, schedule.id);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/machines/${machine.id}`}
          className="text-xs font-bold text-brand active:text-brand-light"
        >
          ← {machine.name}
        </Link>
        <h2 className="mt-1 text-base font-extrabold text-text">
          Регистриране на извършена поддръжка
        </h2>
      </div>
      <SchedulePerformedForm
        machine={machine}
        schedule={schedule}
        action={action}
      />
    </div>
  );
}
