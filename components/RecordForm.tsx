"use client";

import { useRef, useState } from "react";
import type { Machine } from "@/lib/types";

interface Props {
  machine: Machine;
  action: (formData: FormData) => void | Promise<void>;
}

export function RecordForm({ machine, action }: Props) {
  const unitText = machine.reading_unit === "km" ? "км" : "мч";
  const today = new Date().toISOString().slice(0, 10);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setFileName(null);
  };

  return (
    <form action={action} className="space-y-4">
      <div className="card">
        <h3 className="card-title">Информация за работата</h3>
        <div className="field-grid">
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
            <label className="label">Показание ({unitText}) *</label>
            <input
              type="number"
              step="any"
              min="0"
              name="reading_at_service"
              required
              defaultValue={machine.current_reading}
              className="input"
              inputMode="decimal"
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
              inputMode="decimal"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Извършил</label>
            <input
              name="performed_by"
              placeholder="Сервиз или техник"
              className="input"
            />
          </div>

          <div>
            <label className="label">Следваща при ({unitText})</label>
            <input
              type="number"
              step="any"
              min="0"
              name="next_service_reading"
              className="input"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="label">Следваща на дата</label>
            <input type="date" name="next_service_date" className="input" />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Бележки</label>
            <textarea name="notes" rows={2} className="textarea" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Снимка на фактурата</h3>
        <input
          ref={fileRef}
          type="file"
          name="invoice_photo"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
          id="invoice_photo_input"
        />
        {preview ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-card border border-bordergray bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Преглед на фактурата"
                className="block max-h-72 w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-soft">{fileName}</span>
              <button
                type="button"
                onClick={clearFile}
                className="btn-outline btn-sm"
              >
                Премахни
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="invoice_photo_input"
            className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2
              rounded-card border-2 border-dashed border-bordergray bg-cream
              p-5 text-center text-sm text-soft active:bg-cream/60"
          >
            <span className="text-2xl">📷</span>
            <span className="font-bold text-text">
              Натисни, за да добавиш снимка
            </span>
            <span className="text-xs">
              Снимай или избери от галерията (до 8 MB)
            </span>
          </label>
        )}
      </div>

      <button type="submit" className="btn-primary btn-full">
        Запиши работата
      </button>
    </form>
  );
}
