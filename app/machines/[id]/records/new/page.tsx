import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { RecordForm } from "@/components/RecordForm";
import { createRecord } from "@/lib/actions";
import type { Machine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewRecordPage({
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
  const action = createRecord.bind(null, machine.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/machines/${machine.id}`}
          className="text-sm text-brand-600 hover:underline"
        >
          ← Назад към {machine.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Нов запис за поддръжка / ремонт
        </h1>
      </div>
      <RecordForm machine={machine} action={action} />
    </div>
  );
}
