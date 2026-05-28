"use client";

import { useState } from "react";
import type { Machine, ScheduleCategory } from "@/lib/types";
import { scheduleCategoryIcon, scheduleCategoryLabel } from "@/lib/utils";

interface Props {
  machine: Machine;
  action: (formData: FormData) => void | Promise<void>;
}

interface Preset {
  name: string;
  interval: number;
  category: ScheduleCategory;
  unit: "km" | "hours";
}

const TRUCK_PRESETS: Preset[] = [
  { name: "Гресиране на щипка", interval: 50, category: "greasing", unit: "hours" },
  { name: "Гресиране на кран", interval: 50, category: "greasing", unit: "hours" },
  { name: "Гресиране на шаси", interval: 10000, category: "greasing", unit: "km" },
  { name: "Гресиране на полу-кардан", interval: 20000, category: "greasing", unit: "km" },
  { name: "Смяна на двигателно масло", interval: 30000, category: "engine", unit: "km" },
  { name: "Маслен филтър", interval: 30000, category: "engine", unit: "km" },
  { name: "Въздушен филтър", interval: 60000, category: "engine", unit: "km" },
  { name: "Горивен филтър", interval: 60000, category: "engine", unit: "km" },
  { name: "Хидравлично масло", interval: 100000, category: "hydraulics", unit: "km" },
  { name: "Масло на ДДН (диференциал)", interval: 100000, category: "transmission", unit: "km" },
  { name: "Спирачни накладки", interval: 60000, category: "brakes", unit: "km" },
  { name: "Смяна на гуми", interval: 100000, category: "tires", unit: "km" },
];

const INDUSTRIAL_PRESETS: Preset[] = [
  { name: "Гресиране на щипка", interval: 50, category: "greasing", unit: "hours" },
  { name: "Гресиране на ставите", interval: 100, category: "greasing", unit: "hours" },
  { name: "Гресиране на стрела", interval: 50, category: "greasing", unit: "hours" },
  { name: "Смяна на двигателно масло", interval: 500, category: "engine", unit: "hours" },
  { name: "Маслен филтър", interval: 500, category: "engine", unit: "hours" },
  { name: "Въздушен филтър", interval: 1000, category: "engine", unit: "hours" },
  { name: "Горивен филтър", interval: 500, category: "engine", unit: "hours" },
  { name: "Хидравлично масло", interval: 2000, category: "hydraulics", unit: "hours" },
  { name: "Хидравличен филтър", interval: 1000, category: "hydraulics", unit: "hours" },
  { name: "Масло на трансмисия", interval: 2000, category: "transmission", unit: "hours" },
];

const CATEGORIES: ScheduleCategory[] = [
  "greasing",
  "engine",
  "transmission",
  "hydraulics",
  "chassis",
  "brakes",
  "tires",
  "other",
];

export function ScheduleForm({ machine, action }: Props) {
  const unitText = machine.reading_unit === "km" ? "км" : "мч";

  const [name, setName] = useState("");
  const [interval, setIntervalValue] = useState("");
  const [category, setCategory] = useState<ScheduleCategory>("other");

  const presets = (
    machine.machine_type === "truck" ? TRUCK_PRESETS : INDUSTRIAL_PRESETS
  ).filter((p) => p.unit === machine.reading_unit);

  const applyPreset = (p: Preset) => {
    setName(p.name);
    setIntervalValue(String(p.interval));
    setCategory(p.category);
  };

  return (
    <form action={action} className="space-y-4">
      {presets.length > 0 && (
        <div className="card">
          <h3 className="card-title">Готови шаблони</h3>
          <p className="mb-3 text-xs text-soft">
            Натисни шаблон, за да попълни името, категорията и интервала.
          </p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-full border border-bordergray bg-cream px-3 py-1.5
                  text-[0.78rem] font-bold text-text active:bg-brand-yellow/30"
              >
                <span className="mr-1">{scheduleCategoryIcon(p.category)}</span>
                {p.name}
                <span className="ml-1 text-soft">
                  · {p.interval.toLocaleString("bg-BG")} {unitText}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Детайли</h3>
        <div className="field-grid">
          <div className="sm:col-span-2">
            <label className="label">Име *</label>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Гресиране на щипка"
              className="input"
            />
          </div>

          <div>
            <label className="label">Категория *</label>
            <select
              name="category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ScheduleCategory)
              }
              className="select"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {scheduleCategoryIcon(c)} {scheduleCategoryLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Интервал ({unitText}) *</label>
            <input
              type="number"
              step="any"
              min="1"
              name="interval_value"
              required
              value={interval}
              onChange={(e) => setIntervalValue(e.target.value)}
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

          <div>
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
