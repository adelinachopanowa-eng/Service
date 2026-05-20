"use client";

import type { Machine } from "@/lib/types";

interface Props {
  machine: Machine;
  action: (formData: FormData) => void | Promise<void>;
}

export function ScheduleForm({ machine, action }: Props) {
  const unitText = machine.reading_unit === "km" ? "км" : "мч";

  return (
    <form action={action} className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Нов план за периодична поддръжка
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Име *</label>
            <input
              name="name"
              required
              placeholder="напр. Смяна на масло"
              className="input"
            />
          </div>

          <div>
            <label className="label">Интервал ({unitText}) *</label>
            <input
              type="number"
              step="any"
              min="1"
              name="interval_value"
              required
              placeholder={machine.reading_unit === "km" ? "10000" : "500"}
              className="input"
            />
          </div>

          <div>
            <label className="label">Последно извършено при ({unitText})</label>
            <input
              type="number"
              step="any"
              min="0"
              name="last_done_reading"
              className="input"
            />
          </div>

          <div>
            <label className="label">Последно извършено на дата</label>
            <input type="date" name="last_done_date" className="input" />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Бележки</label>
            <textarea name="notes" rows={2} className="textarea" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn-primary">
          Запиши
        </button>
      </div>
    </form>
  );
}
