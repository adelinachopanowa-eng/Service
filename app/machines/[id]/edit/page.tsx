import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MachineForm } from "@/components/MachineForm";
import { updateMachine } from "@/lib/actions";
import type { Machine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditMachinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await supabase
    .from("tm_machines")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();
  const machine = data as Machine;
  const action = updateMachine.bind(null, machine.id);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/machines/${machine.id}`}
          className="text-xs font-bold text-brand active:text-brand-light"
        >
          ← Назад
        </Link>
        <h2 className="mt-1 text-base font-extrabold text-text">
          Редактиране на машина
        </h2>
      </div>
      <MachineForm
        initial={machine}
        action={action}
        submitLabel="Запиши промените"
      />
    </div>
  );
}
