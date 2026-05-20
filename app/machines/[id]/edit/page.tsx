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
    .maybeSingle();

  if (!data) notFound();
  const machine = data as Machine;
  const action = updateMachine.bind(null, machine.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/machines/${machine.id}`}
          className="text-sm text-brand-600 hover:underline"
        >
          ← Назад към машината
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Редактиране на машина
        </h1>
      </div>
      <MachineForm
        initial={machine}
        action={action}
        submitLabel="Запиши промените"
      />
    </div>
  );
}
