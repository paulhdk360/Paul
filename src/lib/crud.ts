import { createClient } from "@/lib/supabase/server";

const ATTACHMENT_TABLES = ["chantiers", "devis", "achats", "maintenances"] as const;
type AttachmentLinkType = (typeof ATTACHMENT_TABLES)[number];

export async function listRows<T>(table: string): Promise<T[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function insertRow<T>(table: string, values: Record<string, unknown>): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase.from(table).insert(values).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function updateRow<T>(
  table: string,
  id: string,
  values: Record<string, unknown>,
): Promise<T> {
  const supabase = createClient();
  const { data, error } = await supabase.from(table).update(values).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

export async function deleteRow(table: string, id: string): Promise<void> {
  const supabase = createClient();
  if ((ATTACHMENT_TABLES as readonly string[]).includes(table)) {
    await deleteAttachmentsFor(table as AttachmentLinkType, id);
  }
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAttachmentsFor(linkType: AttachmentLinkType, linkId: string) {
  const supabase = createClient();
  const { data: files } = await supabase
    .from("attachments")
    .select("id, storage_path")
    .eq("link_type", linkType)
    .eq("link_id", linkId);

  if (files && files.length) {
    const paths = files.map((f) => f.storage_path);
    await supabase.storage.from("attachments").remove(paths);
    await supabase
      .from("attachments")
      .delete()
      .eq("link_type", linkType)
      .eq("link_id", linkId);
  }
}
