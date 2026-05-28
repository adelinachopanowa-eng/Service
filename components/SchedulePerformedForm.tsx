"use client";

import { useEffect, useRef, useState } from "react";
import type { Machine, MaintenanceSchedule } from "@/lib/types";
import {
  scheduleCategoryIcon,
  scheduleCategoryLabel,
} from "@/lib/utils";

interface Props {
  machine: Machine;
  schedule: MaintenanceSchedule;
  action: (formData: FormData) => void | Promise<void>;
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

export function SchedulePerformedForm({ machine, schedule, action }: Props) {
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
      if (isNextRedirect(err)) throw err;
      const msg =
        err instanceof Error ? err.message : "Възникна неочаквана грешка.";
      setError(msg);
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl">
            {scheduleCategoryIcon(schedule.category)}
          </span>
          <div>
            <div className="text-xs uppercase tracking-wide text-soft">
              {scheduleCategoryLabel(schedule.category)}
            </div>
            <div className="font-extrabold text-text">{schedule.name}</div>
          </div>
        </div>
        <div className="rounded-lg bg-cream p-3 text-xs text-soft">
          Записът се прави с днешна дата и текущ километраж. При нужда промени
          стойностите по-долу.
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Детайли</h3>
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

          <div>
            <label className="label">Извършил</label>
            <input
              name="performed_by"
              placeholder="Сервиз или техник"
              className="input"
            />
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
                className="relative overflow-hidden rounded-lg border border-bordergray bg-cream"
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
        {pending ? "Запис..." : "✓ Запиши, че е извършено"}
      </button>
    </form>
  );
}
