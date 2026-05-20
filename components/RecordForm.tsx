"use client";

import type { Machine } from "@/lib/types";

interface Props {
  machine: Machine;
  action: (formData: FormData) => void | Promise<void>;
}

export function RecordForm({ machine, action }: Props) {
  const unitText = machine.reading_unit === "km" ? "км" : "мч";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Информация за работата
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Дата *</label>
            <input
              type="date"
              name="service_date"
              required
              defaultValue={today}
              className="input"
            />
          </div>

          <div>
            <label className="label">Тип работа *</label>
            <select name="service_type" defaultValue="maintenance" className="select">
              <option value="maintenance">Поддръжка</option>
              <option value="repair">Ремонт</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Заглавие *</label>
            <input
              name="title"
              required
              placeholder="напр. Смяна на масло и филтри"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Описание</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Подробно описание на извършените дейности..."
              className="textarea"
            />
          </div>

          <div>
            <label className="label">
              Показание ({unitText}) в момента на работата *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="reading_at_service"
              required
              defaultValue={machine.current_reading}
              className="input"
            />
          </div>

          <div>
            <label className="label">Цена (лв.)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="cost"
              className="input"
            />
          </div>

          <div>
            <label className="label">Извършил</label>
            <input
              name="performed_by"
              placeholder="Сервиз или техник"
              className="input"
            />
          </div>

          <div />

          <div>
            <label className="label">
              Следваща поддръжка при показание ({unitText})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="next_service_reading"
              className="input"
            />
          </div>

          <div>
            <label className="label">Следваща поддръжка на дата</label>
            <input type="date" name="next_service_date" className="input" />
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
