"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, INVOICE_BUCKET } from "./supabase";

const MAX_INVOICE_SIZE = 8 * 1024 * 1024; // 8 MB

async function uploadInvoicePhoto(
  machineId: string,
  formData: FormData
): Promise<string | null> {
  const file = formData.get("invoice_photo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_INVOICE_SIZE) {
    throw new Error("Снимката е твърде голяма (макс. 8 MB)");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Прикаченият файл трябва да е снимка");
  }
  const safeExt = (file.name.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);
  const path = `${machineId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${safeExt || "jpg"}`;
  const { error } = await supabase.storage
    .from(INVOICE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Качване на снимка: ${error.message}`);
  return path;
}

async function removeInvoicePhoto(path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(INVOICE_BUCKET).remove([path]);
}

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function strOrNull(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value.length > 0 ? value : null;
}

function num(form: FormData, key: string): number {
  const value = str(form, key);
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed)) {
    throw new Error(`Невалидно числово поле: ${key}`);
  }
  return parsed;
}

function numOrNull(form: FormData, key: string): number | null {
  const value = str(form, key);
  if (value.length === 0) return null;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export async function createMachine(formData: FormData) {
  const payload = {
    name: str(formData, "name"),
    brand: strOrNull(formData, "brand"),
    model: strOrNull(formData, "model"),
    year: numOrNull(formData, "year"),
    registration_number: strOrNull(formData, "registration_number"),
    inventory_number: strOrNull(formData, "inventory_number"),
    machine_type: str(formData, "machine_type"),
    reading_unit: str(formData, "reading_unit"),
    current_reading: num(formData, "current_reading"),
    notes: strOrNull(formData, "notes"),
  };

  if (!payload.name) throw new Error("Името е задължително");

  const { data, error } = await supabase
    .from("tm_machines")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/machines");
  revalidatePath("/");
  redirect(`/machines/${data.id}`);
}

export async function updateMachine(id: string, formData: FormData) {
  const payload = {
    name: str(formData, "name"),
    brand: strOrNull(formData, "brand"),
    model: strOrNull(formData, "model"),
    year: numOrNull(formData, "year"),
    registration_number: strOrNull(formData, "registration_number"),
    inventory_number: strOrNull(formData, "inventory_number"),
    machine_type: str(formData, "machine_type"),
    reading_unit: str(formData, "reading_unit"),
    current_reading: num(formData, "current_reading"),
    notes: strOrNull(formData, "notes"),
  };

  const { error } = await supabase
    .from("tm_machines")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/machines");
  revalidatePath(`/machines/${id}`);
  revalidatePath("/");
  redirect(`/machines/${id}`);
}

export async function deleteMachine(id: string) {
  const { error } = await supabase.from("tm_machines").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/machines");
  revalidatePath("/");
  redirect("/machines");
}

export async function createRecord(machineId: string, formData: FormData) {
  if (!str(formData, "title")) throw new Error("Заглавието е задължително");
  if (!str(formData, "service_date"))
    throw new Error("Датата е задължителна");

  const invoicePath = await uploadInvoicePhoto(machineId, formData);

  const payload = {
    machine_id: machineId,
    service_date: str(formData, "service_date"),
    service_type: str(formData, "service_type"),
    title: str(formData, "title"),
    description: strOrNull(formData, "description"),
    reading_at_service: num(formData, "reading_at_service"),
    cost: numOrNull(formData, "cost"),
    performed_by: strOrNull(formData, "performed_by"),
    next_service_reading: numOrNull(formData, "next_service_reading"),
    next_service_date: strOrNull(formData, "next_service_date"),
    notes: strOrNull(formData, "notes"),
    invoice_photo_path: invoicePath,
  };

  const { error } = await supabase.from("tm_maintenance_records").insert(payload);
  if (error) {
    await removeInvoicePhoto(invoicePath);
    throw new Error(error.message);
  }

  revalidatePath(`/machines/${machineId}`);
  revalidatePath("/");
  redirect(`/machines/${machineId}`);
}

export async function deleteRecord(machineId: string, recordId: string) {
  const { data: existing } = await supabase
    .from("tm_maintenance_records")
    .select("invoice_photo_path")
    .eq("id", recordId)
    .maybeSingle();

  const { error } = await supabase
    .from("tm_maintenance_records")
    .delete()
    .eq("id", recordId);
  if (error) throw new Error(error.message);

  await removeInvoicePhoto(existing?.invoice_photo_path);

  revalidatePath(`/machines/${machineId}`);
}

export async function createSchedule(machineId: string, formData: FormData) {
  const payload = {
    machine_id: machineId,
    name: str(formData, "name"),
    interval_value: num(formData, "interval_value"),
    last_done_reading: numOrNull(formData, "last_done_reading"),
    last_done_date: strOrNull(formData, "last_done_date"),
    notes: strOrNull(formData, "notes"),
  };

  if (!payload.name) throw new Error("Името е задължително");

  const { error } = await supabase
    .from("tm_maintenance_schedules")
    .insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath(`/machines/${machineId}`);
  revalidatePath("/");
  redirect(`/machines/${machineId}`);
}

export async function deleteSchedule(machineId: string, scheduleId: string) {
  const { error } = await supabase
    .from("tm_maintenance_schedules")
    .delete()
    .eq("id", scheduleId);
  if (error) throw new Error(error.message);
  revalidatePath(`/machines/${machineId}`);
}
