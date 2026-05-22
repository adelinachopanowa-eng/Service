import { NextResponse } from "next/server";
import { supabase, invoicePhotoUrl } from "@/lib/supabase";
import type { Machine, MaintenanceRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

function serviceTypeLabel(t: string): string {
  if (t === "repair") return "Ремонт";
  if (t === "parts") return "Части";
  return "Поддръжка";
}

function machineTypeLabel(t: string): string {
  return t === "truck" ? "Камион" : "Индустриална техника";
}

function unitLabel(u: string): string {
  return u === "km" ? "км" : "мч";
}

export async function GET() {
  const [machinesRes, recordsRes] = await Promise.all([
    supabase
      .from("tm_machines")
      .select("*")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("tm_maintenance_records")
      .select("*")
      .is("deleted_at", null)
      .order("service_date", { ascending: false }),
  ]);

  const machines = (machinesRes.data ?? []) as Machine[];
  const records = (recordsRes.data ?? []) as MaintenanceRecord[];

  const machineById = new Map(machines.map((m) => [m.id, m]));

  const headers = [
    "Машина",
    "Марка",
    "Модел",
    "Рег. №",
    "Тип машина",
    "Тип работа",
    "Дата",
    "Заглавие",
    "Описание",
    "Показание",
    "Единица",
    "Цена (лв.)",
    "Извършил",
    "Следваща при",
    "Следваща на дата",
    "Бележки",
    "Снимки",
    "Създаден",
  ];

  const lines: string[] = [];
  lines.push(row(headers));

  for (const r of records) {
    const m = machineById.get(r.machine_id);
    const photoUrls = (r.invoice_photo_paths ?? [])
      .map((p) => invoicePhotoUrl(p))
      .filter((u): u is string => !!u)
      .join(" | ");
    lines.push(
      row([
        m?.name ?? "",
        m?.brand ?? "",
        m?.model ?? "",
        m?.registration_number ?? "",
        m ? machineTypeLabel(m.machine_type) : "",
        serviceTypeLabel(r.service_type),
        r.service_date,
        r.title,
        r.description ?? "",
        r.reading_at_service,
        m ? unitLabel(m.reading_unit) : "",
        r.cost ?? "",
        r.performed_by ?? "",
        r.next_service_reading ?? "",
        r.next_service_date ?? "",
        r.notes ?? "",
        photoUrls,
        r.created_at,
      ])
    );
  }

  // UTF-8 BOM so Excel opens cyrillic correctly
  const body = "﻿" + lines.join("\r\n") + "\r\n";
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="service-records-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
