"use client";

import type { Machine } from "@/lib/types";

interface Props {
  machine: Machine;
  action: (formData: FormData) => void | Promise<void>;
}

export function ScheduleForm({ machine, action }: Props) {
  const unitText = machine.reading_unit === "km" ? "км" : "мч";

  return (
    <form action={action} className="space-y-4">
      <div className="card">
        <h3 className="card-title">Нов план за периодична поддръжка</h3>
        <div className="field-grid">
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
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="label">Последно при ({unitText})</label>
            <input
              type="number"
              step="any"
              min="0"
              name="last_done_reading"
              className="input"
              inputMode="decimal"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Последно на дата</label>
            <input type="date" name="last_done_date" className="input" />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Бележки</label>
            <textarea name="notes" rows={2} className="textarea" />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary btn-full">
        Запиши план
      </button>
    </form>
  );
}
