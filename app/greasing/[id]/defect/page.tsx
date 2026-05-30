import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { reportGreaseDefect } from "@/lib/grease-actions";
import type { GreasePoint, Machine } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportDefectPage({
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
  const unitText = machine.reading_unit === "km" ? "км" : "мч";
  const today = new Date().toISOString().slice(0, 10);
  const action = reportGreaseDefect.bind(null, machine.id);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/greasing/${machine.id}`}
          className="text-xs font-bold text-brand active:text-brand-light"
        >
          ← {machine.name}
        </Link>
        <h2 className="mt-1 text-base font-extrabold text-text">
          Дефект по системата за гресиране
        </h2>
      </div>

      <form action={action} className="space-y-4">
        <div className="card">
          <h3 className="card-title">Детайли за дефекта</h3>
          <div className="field-grid">
            <div className="sm:col-span-2">
              <label className="label">Описание *</label>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="напр. Спукан маркуч на централна гресьорка; нипел на щипката не поема грес..."
                className="textarea"
              />
            </div>
            <div>
              <label className="label">Агрегат</label>
              <select name="point_id" className="select">
                <option value="">Цялата система / друго</option>
                {points.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Сериозност</label>
              <select name="severity" defaultValue="medium" className="select">
                <option value="low">Ниска</option>
                <option value="medium">Средна</option>
                <option value="high">Висока</option>
              </select>
            </div>
            <div>
              <label className="label">Дата</label>
              <input
                type="date"
                name="reported_date"
                defaultValue={today}
                className="input"
              />
            </div>
            <div>
              <label className="label">Показание ({unitText})</label>
              <input
                type="number"
                step="any"
                min="0"
                name="reading"
                defaultValue={machine.current_reading}
                className="input"
                inputMode="decimal"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary btn-full">
          Запиши дефекта
        </button>
      </form>
    </div>
  );
}
