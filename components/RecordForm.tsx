"use client";

import { useEffect, useRef, useState } from "react";
import type { Machine } from "@/lib/types";

interface Props {
  machine: Machine;
  action: (formData: FormData) => void | Promise<void>;
}

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
}

export function RecordForm({ machine, action }: Props) {
  const unitText = machine.reading_unit === "km" ? "км" : "мч";
  const today = new Date().toISOString().slice(0, 10);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [photos]);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems: PhotoItem[] = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newItems]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const formData = new FormData(e.currentTarget);
    formData.delete("invoice_photos");
    for (const p of photos) {
      formData.append("invoice_photos", p.file, p.file.name);
    }
    setPending(true);
    setError(null);
    try {
      await action(formData);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Възникна неочаквана грешка.";
      setError(msg);
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="label">Тип *</label>
            <select
              name="service_type"
              defaultValue="maintenance"
              className="select"
            >
              <option value="maintenance">Поддръжка</option>
              <option value="repair">Ремонт</option>
              <option value="parts">Части</option>
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
              placeholder="Подробно описание на извършените дейности или закупените части..."
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
            <label className="label">Извършил / Доставчик</label>
            <input
              name="performed_by"
              placeholder="Сервиз, техник или магазин"
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
        <h3 className="card-title">
          Снимки на фактурата
          {photos.length > 0 && ` (${photos.length})`}
        </h3>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />

        {photos.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-lg border border-bordergray bg-cream"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.preview}
                  alt={p.file.name}
                  className="block aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full
                    bg-black/60 text-white shadow-md active:bg-black/80"
                  aria-label="Премахни"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="btn-outline"
          >
            📷 Снимай
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="btn-outline"
          >
            🖼️ От галерия
          </button>
        </div>
        {photos.length === 0 && (
          <p className="mt-2 text-center text-xs text-soft">
            Може да добавиш няколко снимки (до 8 MB всяка).
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-[#f0a0a0] bg-[#fce4e4] px-4 py-3 text-sm text-[#8b0000]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary btn-full disabled:opacity-60"
      >
        {pending ? "Запис..." : "Запиши работата"}
      </button>
    </form>
  );
}
