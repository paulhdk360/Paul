"use server";

import { revalidatePath } from "next/cache";
import { deleteRow, insertRow, updateRow } from "@/lib/crud";

const ALLOWED_TABLES = new Set([
  "foreuses",
  "equipes",
  "chantiers",
  "factures",
  "achats",
  "maintenances",
]);

function assertAllowed(table: string) {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Table non autorisée: ${table}`);
  }
}

export async function createEntity(table: string, values: Record<string, unknown>) {
  assertAllowed(table);
  const row = await insertRow(table, values);
  revalidatePath(`/${table}`);
  revalidatePath("/dashboard");
  revalidatePath("/planning");
  revalidatePath("/stats");
  return row;
}

export async function updateEntity(table: string, id: string, values: Record<string, unknown>) {
  assertAllowed(table);
  const row = await updateRow(table, id, values);
  revalidatePath(`/${table}`);
  revalidatePath("/dashboard");
  revalidatePath("/planning");
  revalidatePath("/stats");
  return row;
}

export async function deleteEntity(table: string, id: string) {
  assertAllowed(table);
  await deleteRow(table, id);
  revalidatePath(`/${table}`);
  revalidatePath("/dashboard");
  revalidatePath("/planning");
  revalidatePath("/stats");
}
