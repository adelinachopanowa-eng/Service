import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { GreasingLogForm } from "@/components/GreasingLogForm";
import { logGreasing } from "@/lib/grease-actions";
import type { GreasePoint, Machine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GreasingLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const [machineRes, pointsRes] = await Promise.all([
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
  ]);

  if (!machineRes.data) notFound();

  const machine = machineRes.data as Machine;
  const points = (pointsRes.data ?? []) as GreasePoint[];
  const action = logGreasing.bind(null, machine.id);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/greasing"
          className="text-xs font-bold text-brand active:text-brand-light"
        >
          ← Гресиране
        </Link>
        <h2 className="mt-1 text-base font-extrabold text-text">
          {machine.name}
        </h2>
      </div>
      <GreasingLogForm machine={machine} points={points} action={action} />
    </div>
  );
}
