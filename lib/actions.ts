"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, INVOICE_BUCKET } from "./supabase";

const MAX_INVOICE_SIZE = 8 * 1024 * 1024; // 8 MB per photo

async function uploadInvoicePhotos(
  machineId: string,
  formData: FormData
): Promise<string[]> {
  const files = formData
    .getAll("invoice_photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return [];

  const uploadedPaths: string[] = [];
  for (const file of files) {
    if (file.size > MAX_INVOICE_SIZE) {
      await removeInvoicePhotos(uploadedPaths);
      throw new Error(`Снимката "${file.name}" е твърде голяма (макс. 8 MB)`);
    }
    if (!file.type.startsWith("image/")) {
      await removeInvoicePhotos(uploadedPaths);
      throw new Error(`Файлът "${file.name}" не е снимка`);
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
    if (error) {
      await removeInvoicePhotos(uploadedPaths);
      throw new Error(`Качване на снимка: ${error.message}`);
    }
    uploadedPaths.push(path);
  }
  return uploadedPaths;
}

async function removeInvoicePhotos(paths: string[] | null | undefined) {
  if (!paths || paths.length === 0) return;
  await supabase.storage.from(INVOICE_BUCKET).remove(paths);
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

  const invoicePaths = await uploadInvoicePhotos(machineId, formData);

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
    invoice_photo_paths: invoicePaths,
  };

  const { error } = await supabase.from("tm_maintenance_records").insert(payload);
  if (error) {
    await removeInvoicePhotos(invoicePaths);
    throw new Error(error.message);
  }

  revalidatePath(`/machines/${machineId}`);
  revalidatePath("/");
  redirect(`/machines/${machineId}`);
}

export async function updateRecord(
  machineId: string,
  recordId: string,
  formData: FormData
) {
  if (!str(formData, "title")) throw new Error("Заглавието е задължително");
  if (!str(formData, "service_date"))
    throw new Error("Датата е задължителна");

  const { data: original, error: fetchError } = await supabase
    .from("tm_maintenance_records")
    .select("invoice_photo_paths")
    .eq("id", recordId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);

  const originalPaths: string[] = original?.invoice_photo_paths ?? [];
  const keptPaths = formData
    .getAll("kept_photos")
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
  const removedPaths = originalPaths.filter((p) => !keptPaths.includes(p));

  const newPaths = await uploadInvoicePhotos(machineId, formData);
  const finalPaths = [...keptPaths, ...newPaths];

  const payload = {
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
    invoice_photo_paths: finalPaths,
  };

  const { error } = await supabase
    .from("tm_maintenance_records")
    .update(payload)
    .eq("id", recordId);
  if (error) {
    await removeInvoicePhotos(newPaths);
    throw new Error(error.message);
  }

  if (removedPaths.length > 0) await removeInvoicePhotos(removedPaths);

  revalidatePath(`/machines/${machineId}`);
  revalidatePath("/");
  redirect(`/machines/${machineId}`);
}

export async function deleteRecord(machineId: string, recordId: string) {
  const { data: existing } = await supabase
    .from("tm_maintenance_records")
    .select("invoice_photo_paths")
    .eq("id", recordId)
    .maybeSingle();

  const { error } = await supabase
    .from("tm_maintenance_records")
    .delete()
    .eq("id", recordId);
  if (error) throw new Error(error.message);

  await removeInvoicePhotos(existing?.invoice_photo_paths);

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
