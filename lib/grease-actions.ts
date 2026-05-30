"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "./supabase-server";
import { INVOICE_BUCKET } from "./supabase";

const MAX_INVOICE_SIZE = 8 * 1024 * 1024; // 8 MB per photo

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
  if (Number.isNaN(parsed)) throw new Error(`Невалидно числово поле: ${key}`);
  return parsed;
}

function numOrNull(form: FormData, key: string): number | null {
  const value = str(form, key);
  if (value.length === 0) return null;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

async function uploadPhotos(
  supabase: SupabaseClient,
  machineId: string,
  formData: FormData
): Promise<string[]> {
  const files = formData
    .getAll("invoice_photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return [];

  const uploaded: string[] = [];
  for (const file of files) {
    if (file.size > MAX_INVOICE_SIZE) {
      await removePhotos(supabase, uploaded);
      throw new Error(`Снимката "${file.name}" е твърде голяма (макс. 8 MB)`);
    }
    if (!file.type.startsWith("image/")) {
      await removePhotos(supabase, uploaded);
      throw new Error(`Файлът "${file.name}" не е снимка`);
    }
    const ext = (file.name.split(".").pop() || "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 5);
    const path = `${machineId}/grease/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext || "jpg"}`;
    const { error } = await supabase.storage
      .from(INVOICE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      await removePhotos(supabase, uploaded);
      throw new Error(`Качване на снимка: ${error.message}`);
    }
    uploaded.push(path);
  }
  return uploaded;
}

async function removePhotos(
  supabase: SupabaseClient,
  paths: string[] | null | undefined
) {
  if (!paths || paths.length === 0) return;
  await supabase.storage.from(INVOICE_BUCKET).remove(paths);
}

// ---- Гресиращи точки ----

export async function createGreasePoint(machineId: string, formData: FormData) {
  const supabase = await createSupabaseServer();
  const name = str(formData, "name");
  if (!name) throw new Error("Името е задължително");
  const { error } = await supabase.from("tm_grease_points").insert({
    machine_id: machineId,
    name,
    sort_order: numOrNull(formData, "sort_order") ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/machines/${machineId}/grease-points`);
  revalidatePath(`/greasing/${machineId}`);
}

export async function deleteGreasePoint(machineId: string, pointId: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("tm_grease_points")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", pointId);
  if (error) throw new Error(error.message);
  revalidatePath(`/machines/${machineId}/grease-points`);
  revalidatePath(`/greasing/${machineId}`);
}

// ---- Гресиране (събитие) ----

export async function logGreasing(machineId: string, formData: FormData) {
  const supabase = await createSupabaseServer();

  const eventDate =
    str(formData, "event_date") || new Date().toISOString().slice(0, 10);
  const reading = num(formData, "reading");
  const scope = str(formData, "scope") === "partial" ? "partial" : "full";
  const performedBy = strOrNull(formData, "performed_by");
  const notes = strOrNull(formData, "notes");

  let pointIds: string[] = [];
  let pointNames: string[] = [];

  if (scope === "partial") {
    pointIds = formData
      .getAll("point_ids")
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);
    if (pointIds.length > 0) {
      const { data: pts } = await supabase
        .from("tm_grease_points")
        .select("id, name")
        .in("id", pointIds);
      pointNames = (pts ?? []).map((p) => p.name);
    }
  }

  const photos = await uploadPhotos(supabase, machineId, formData);

  const { error } = await supabase.from("tm_grease_events").insert({
    machine_id: machineId,
    event_date: eventDate,
    reading,
    scope,
    point_ids: pointIds,
    point_names: pointNames,
    performed_by: performedBy,
    notes,
    invoice_photo_paths: photos,
  });
  if (error) {
    await removePhotos(supabase, photos);
    throw new Error(error.message);
  }

  // Update machine reading if greater
  const { data: machine } = await supabase
    .from("tm_machines")
    .select("current_reading")
    .eq("id", machineId)
    .maybeSingle();
  if (machine && reading > Number(machine.current_reading)) {
    await supabase
      .from("tm_machines")
      .update({ current_reading: reading })
      .eq("id", machineId);
  }

  // Optional defect captured in the same form
  const defectDescription = strOrNull(formData, "defect_description");
  if (defectDescription) {
    const defectPointId = strOrNull(formData, "defect_point_id");
    let defectPointName: string | null = null;
    if (defectPointId) {
      const { data: pt } = await supabase
        .from("tm_grease_points")
        .select("name")
        .eq("id", defectPointId)
        .maybeSingle();
      defectPointName = pt?.name ?? null;
    }
    await supabase.from("tm_grease_defects").insert({
      machine_id: machineId,
      point_id: defectPointId,
      point_name: defectPointName,
      description: defectDescription,
      severity: str(formData, "defect_severity") || "medium",
      reported_date: eventDate,
      reading,
    });
  }

  revalidatePath("/greasing");
  revalidatePath(`/greasing/${machineId}`);
  revalidatePath(`/machines/${machineId}`);
  revalidatePath("/");
  redirect("/greasing");
}

export async function deleteGreaseEvent(machineId: string, eventId: string) {
  const supabase = await createSupabaseServer();
  const { data: existing } = await supabase
    .from("tm_grease_events")
    .select("invoice_photo_paths")
    .eq("id", eventId)
    .maybeSingle();

  const { error } = await supabase
    .from("tm_grease_events")
    .delete()
    .eq("id", eventId);
  if (error) throw new Error(error.message);

  await removePhotos(supabase, existing?.invoice_photo_paths);

  revalidatePath("/greasing");
  revalidatePath(`/greasing/${machineId}`);
}

// ---- Дефекти ----

export async function reportGreaseDefect(
  machineId: string,
  formData: FormData
) {
  const supabase = await createSupabaseServer();
  const description = str(formData, "description");
  if (!description) throw new Error("Описанието е задължително");

  const pointId = strOrNull(formData, "point_id");
  let pointName: string | null = null;
  if (pointId) {
    const { data: pt } = await supabase
      .from("tm_grease_points")
      .select("name")
      .eq("id", pointId)
      .maybeSingle();
    pointName = pt?.name ?? null;
  }

  const { error } = await supabase.from("tm_grease_defects").insert({
    machine_id: machineId,
    point_id: pointId,
    point_name: pointName,
    description,
    severity: str(formData, "severity") || "medium",
    reported_date:
      str(formData, "reported_date") || new Date().toISOString().slice(0, 10),
    reading: numOrNull(formData, "reading"),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/greasing");
  revalidatePath(`/greasing/${machineId}`);
  redirect(`/greasing/${machineId}`);
}

export async function resolveGreaseDefect(
  machineId: string,
  defectId: string
) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("tm_grease_defects")
    .update({
      status: "resolved",
      resolved_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", defectId);
  if (error) throw new Error(error.message);
  revalidatePath("/greasing");
  revalidatePath(`/greasing/${machineId}`);
}

export async function reopenGreaseDefect(
  machineId: string,
  defectId: string
) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("tm_grease_defects")
    .update({ status: "open", resolved_date: null })
    .eq("id", defectId);
  if (error) throw new Error(error.message);
  revalidatePath("/greasing");
  revalidatePath(`/greasing/${machineId}`);
}

export async function deleteGreaseDefect(
  machineId: string,
  defectId: string
) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("tm_grease_defects")
    .delete()
    .eq("id", defectId);
  if (error) throw new Error(error.message);
  revalidatePath("/greasing");
  revalidatePath(`/greasing/${machineId}`);
}
