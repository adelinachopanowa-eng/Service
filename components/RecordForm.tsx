"use client";

import { useEffect, useRef, useState } from "react";
import type { Machine, MaintenanceRecord } from "@/lib/types";

interface ExistingPhoto {
  path: string;
  url: string;
}

interface Props {
  machine: Machine;
  action: (formData: FormData) => void | Promise<void>;
  initial?: MaintenanceRecord;
  existingPhotos?: ExistingPhoto[];
  submitLabel?: string;
}

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
}

function isNextRedirect(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const digest = (err as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function RecordForm({
  machine,
  action,
  initial,
  existingPhotos = [],
  submitLabel = "Запиши работата",
}: Props) {
  const unitText = machine.reading_unit === "km" ? "км" : "мч";
  const today = new Date().toISOString().slice(0, 10);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [kept, setKept] = useState<ExistingPhoto[]>(existingPhotos);
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

  const removeNewPhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const removeKeptPhoto = (path: string) => {
    setKept((prev) => prev.filter((p) => p.path !== path));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const formData = new FormData(e.currentTarget);
    formData.delete("invoice_photos");
    formData.delete("kept_photos");
    for (const p of kept) {
      formData.append("kept_photos", p.path);
    }
    for (const p of photos) {
      formData.append("invoice_photos", p.file, p.file.name);
    }
    setPending(true);
    setError(null);
    try {
      await action(formData);
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      const msg =
        err instanceof Error ? err.message : "Възникна неочаквана грешка.";
      setError(msg);
      setPending(false);
    }
  };

  const totalPhotos = kept.length + photos.length;

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
              defaultValue={initial?.service_date ?? today}
              className="input"
            />
          </div>

          <div>
            <label className="label">Тип *</label>
            <select
              name="service_type"
              defaultValue={initial?.service_type ?? "maintenance"}
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
              defaultValue={initial?.title ?? ""}
              placeholder="напр. Смяна на масло и филтри"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Описание</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={initial?.description ?? ""}
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
              defaultValue={
                initial?.reading_at_service ?? machine.current_reading
              }
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
              defaultValue={initial?.cost ?? ""}
              className="input"
              inputMode="decimal"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Извършил / Доставчик</label>
            <input
              name="performed_by"
              defaultValue={initial?.performed_by ?? ""}
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
              defaultValue={initial?.next_service_reading ?? ""}
              className="input"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="label">Следваща на дата</label>
            <input
              type="date"
              name="next_service_date"
              defaultValue={initial?.next_service_date ?? ""}
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Бележки</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={initial?.notes ?? ""}
              className="textarea"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          Снимки на фактурата
          {totalPhotos > 0 && ` (${totalPhotos})`}
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

        {totalPhotos > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {kept.map((p) => (
              <div
                key={`kept-${p.path}`}
                className="relative overflow-hidden rounded-lg border border-bordergray bg-cream"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="block aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeKeptPhoto(p.path)}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full
                    bg-black/60 text-white shadow-md active:bg-black/80"
                  aria-label="Премахни"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-lg border-2 border-brand-yellow bg-cream"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.preview}
                  alt={p.file.name}
                  className="block aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewPhoto(p.id)}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full
                    bg-black/60 text-white shadow-md active:bg-black/80"
                  aria-label="Премахни"
                >
                  ✕
                </button>
                <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-yellow px-1.5 py-0.5 text-[0.65rem] font-bold text-brand">
                  Нова
                </span>
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
        {totalPhotos === 0 && (
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
        {pending ? "Записване..." : submitLabel}
      </button>
    </form>
  );
}
