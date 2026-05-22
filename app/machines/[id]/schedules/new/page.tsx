import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { ScheduleForm } from "@/components/ScheduleForm";
import { createSchedule } from "@/lib/actions";
import type { Machine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("tm_machines")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const machine = data as Machine;
  const action = createSchedule.bind(null, machine.id);

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
          Нов план за периодична поддръжка
        </h2>
      </div>
      <ScheduleForm machine={machine} action={action} />
    </div>
  );
}
