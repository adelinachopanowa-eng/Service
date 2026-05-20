"use client";

import { useState } from "react";
import type { Machine } from "@/lib/types";

interface Props {
  initial?: Partial<Machine>;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}

export function MachineForm({ initial, action, submitLabel }: Props) {
  const [machineType, setMachineType] = useState<"truck" | "industrial">(
    initial?.machine_type ?? "truck"
  );
  const [readingUnit, setReadingUnit] = useState<"km" | "hours">(
    initial?.reading_unit ?? (initial?.machine_type === "industrial" ? "hours" : "km")
  );

  return (
    <form action={action} className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Основна информация
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Име / Прякор *</label>
            <input
              name="name"
              required
              defaultValue={initial?.name ?? ""}
              placeholder="напр. Volvo FH16 - камион 1"
              className="input"
            />
          </div>

          <div>
            <label className="label">Тип машина *</label>
            <select
              name="machine_type"
              value={machineType}
              onChange={(e) => {
                const v = e.target.value as "truck" | "industrial";
                setMachineType(v);
                setReadingUnit(v === "truck" ? "km" : "hours");
              }}
              className="select"
            >
              <option value="truck">Камион</option>
              <option value="industrial">Индустриална техника</option>
            </select>
          </div>

          <div>
            <label className="label">Мерна единица *</label>
            <select
              name="reading_unit"
              value={readingUnit}
              onChange={(e) =>
                setReadingUnit(e.target.value as "km" | "hours")
              }
              className="select"
            >
              <option value="km">Километри (км)</option>
              <option value="hours">Моточасове (мч)</option>
            </select>
          </div>

          <div>
            <label className="label">Марка</label>
            <input
              name="brand"
              defaultValue={initial?.brand ?? ""}
              placeholder="напр. Volvo"
              className="input"
            />
          </div>

          <div>
            <label className="label">Модел</label>
            <input
              name="model"
              defaultValue={initial?.model ?? ""}
              placeholder="напр. FH16"
              className="input"
            />
          </div>

          <div>
            <label className="label">Година на производство</label>
            <input
              type="number"
              name="year"
              defaultValue={initial?.year ?? ""}
              min="1950"
              max="2100"
              className="input"
            />
          </div>

          <div>
            <label className="label">Регистрационен номер</label>
            <input
              name="registration_number"
              defaultValue={initial?.registration_number ?? ""}
              placeholder="напр. CA1234AB"
              className="input"
            />
          </div>

          <div>
            <label className="label">Инвентарен номер</label>
            <input
              name="inventory_number"
              defaultValue={initial?.inventory_number ?? ""}
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Текущи {readingUnit === "km" ? "километри" : "моточасове"} *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              name="current_reading"
              required
              defaultValue={initial?.current_reading ?? 0}
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Бележки</label>
            <textarea
              name="notes"
              defaultValue={initial?.notes ?? ""}
              rows={3}
              className="textarea"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
