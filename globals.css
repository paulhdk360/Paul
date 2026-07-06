"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteAttachmentsFor } from "@/lib/crud";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 Mo par fichier

export async function listAttachments(linkType: string, linkId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("link_type", linkType)
    .eq("link_id", linkId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function uploadAttachment(formData: FormData) {
  const linkType = String(formData.get("linkType"));
  const linkId = String(formData.get("linkId"));
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Aucun fichier reçu.");
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" dépasse ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} Mo.`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const storagePath = `${linkType}/${linkId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("attachments").insert({
    link_type: linkType,
    link_id: linkId,
    nom: file.name,
    type: file.type,
    taille: file.size,
    storage_path: storagePath,
    created_by: user?.id ?? null,
  });
  if (insertError) {
    await supabase.storage.from("attachments").remove([storagePath]);
    throw new Error(insertError.message);
  }

  revalidatePath(`/${linkType}`);
  revalidatePath("/devis");
}

export async function deleteAttachment(id: string, linkType: string) {
  const supabase = createClient();
  const { data: file } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (file) {
    await supabase.storage.from("attachments").remove([file.storage_path]);
  }
  const { error } = await supabase.from("attachments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/${linkType}`);
  revalidatePath("/devis");
}

export async function cleanupOrphanAttachments(
  linkType: "chantiers" | "devis" | "achats" | "maintenances",
  linkId: string,
) {
  await deleteAttachmentsFor(linkType, linkId);
}

export async function getAttachmentUrl(storagePath: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
