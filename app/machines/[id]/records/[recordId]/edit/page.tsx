import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, invoicePhotoUrls } from "@/lib/supabase";
import { RecordForm } from "@/components/RecordForm";
import { updateRecord } from "@/lib/actions";
import type { Machine, MaintenanceRecord } from "@/lib/types";
import { serviceTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId } = await params;

  const [machineRes, recordRes] = await Promise.all([
    supabase.from("tm_machines").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("tm_maintenance_records")
      .select("*")
      .eq("id", recordId)
      .eq("machine_id", id)
      .maybeSingle(),
  ]);

  if (!machineRes.data || !recordRes.data) notFound();

  const machine = machineRes.data as Machine;
  const record = recordRes.data as MaintenanceRecord;
  const photos = invoicePhotoUrls(record.invoice_photo_paths);
  const action = updateRecord.bind(null, machine.id, record.id);

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
          Редактиране на запис
        </h2>
        <p className="text-xs text-soft">
          {serviceTypeLabel(record.service_type)} · {record.title}
        </p>
      </div>
      <RecordForm
        machine={machine}
        action={action}
        initial={record}
        existingPhotos={photos}
        submitLabel="Запиши промените"
      />
    </div>
  );
}
