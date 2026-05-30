"use client";

import { useEffect, useRef, useState } from "react";
import type { GreasePoint, Machine } from "@/lib/types";

interface Props {
  machine: Machine;
  points: GreasePoint[];
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

export function GreasingLogForm({ machine, points, action }: Props) {
  const unitText = machine.reading_unit === "km" ? "км" : "мч";
  const today = new Date().toISOString().slice(0, 10);

  const [scope, setScope] = useState<"full" | "partial">("full");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDefect, setShowDefect] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.preview));
  }, [photos]);

  const togglePoint = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const items = Array.from(list).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...items]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const t = prev.find((p) => p.id === id);
      if (t) URL.revokeObjectURL(t.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    if (scope === "partial" && selected.size === 0) {
      setError("Избери поне един агрегат за частично гресиране.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.delete("point_ids");
    if (scope === "partial") {
      for (const id of selected) formData.append("point_ids", id);
    }
    formData.delete("invoice_photos");
    for (const p of photos) formData.append("invoice_photos", p.file, p.file.name);
    if (!showDefect) {
      formData.delete("defect_description");
      formData.delete("defect_point_id");
      formData.delete("defect_severity");
    }
    setPending(true);
    setError(null);
    try {
      await action(formData);
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      setError(
        err instanceof Error ? err.message : "Възникна неочаквана грешка."
      );
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card">
        <h3 className="card-title">Гресиране</h3>
        <div className="field-grid">
          <div>
            <label className="label">Дата *</label>
            <input
              type="date"
              name="event_date"
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
              name="reading"
              required
              defaultValue={machine.current_reading}
              className="input"
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="mt-3">
          <span className="label">Обхват</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope("full")}
              className={
                "btn " +
                (scope === "full"
                  ? "bg-brand text-white"
                  : "border-[1.5px] border-bordergray bg-white text-soft")
              }
            >
              Пълно гресиране
            </button>
            <button
              type="button"
              onClick={() => setScope("partial")}
              className={
                "btn " +
                (scope === "partial"
                  ? "bg-brand text-white"
                  : "border-[1.5px] border-bordergray bg-white text-soft")
              }
            >
              Частично
            </button>
          </div>
          <input type="hidden" name="scope" value={scope} />
        </div>

        {scope === "partial" && (
          <div className="mt-3">
            <span className="label">Гресирани агрегати *</span>
            {points.length === 0 ? (
              <p className="rounded-lg bg-cream p-3 text-xs text-soft">
                Няма дефинирани агрегати за тази машина. Добави ги от бутона
                &laquo;Агрегати&raquo; на страницата за гресиране, или направи
                пълно гресиране.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {points.map((p) => {
                  const on = selected.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePoint(p.id)}
                      className={
                        "rounded-full px-3 py-1.5 text-[0.82rem] font-bold transition " +
                        (on
                          ? "bg-brand-yellow text-brand"
                          : "border border-bordergray bg-white text-soft")
                      }
                    >
                      {on ? "✓ " : ""}
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="field-grid mt-3">
          <div className="sm:col-span-2">
            <label className="label">Извършил</label>
            <input
              name="performed_by"
              placeholder="Име на техник"
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
        <div className="flex items-center justify-between">
          <h3 className="card-title m-0 border-0 pb-0">Дефект по системата</h3>
          <button
            type="button"
            onClick={() => setShowDefect((v) => !v)}
            className="btn-outline btn-sm"
          >
            {showDefect ? "Премахни" : "+ Добави дефект"}
          </button>
        </div>
        {showDefect && (
          <div className="field-grid mt-3">
            <div className="sm:col-span-2">
              <label className="label">Описание на дефекта *</label>
              <textarea
                name="defect_description"
                rows={2}
                placeholder="напр. Спукан маркуч на централна гресьорка, нипел не поема грес..."
                className="textarea"
              />
            </div>
            <div>
              <label className="label">Агрегат</label>
              <select name="defect_point_id" className="select">
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
              <select
                name="defect_severity"
                defaultValue="medium"
                className="select"
              >
                <option value="low">Ниска</option>
                <option value="medium">Средна</option>
                <option value="high">Висока</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          Снимки {photos.length > 0 && `(${photos.length})`}
        </h3>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
        {photos.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-lg border border-bordergray bg-cream"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.preview}
                  alt=""
                  className="block aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                  aria-label="Премахни"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-outline btn-full"
        >
          📷 Добави снимка
        </button>
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
        {pending ? "Запис..." : "✓ Запиши гресирането"}
      </button>
    </form>
  );
}
