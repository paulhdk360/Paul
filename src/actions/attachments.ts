"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function uploadAttachment(affaireId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Aucun fichier reçu.");
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" dépasse ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} Mo.`);
  }

  const supabase = createClient();
  const storagePath = `${affaireId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("attachments").insert({
    affaire_id: affaireId,
    link_type: "affaires",
    link_id: affaireId,
    nom: file.name,
    type: file.type,
    taille: file.size,
    storage_path: storagePath,
  });
  if (insertError) {
    await supabase.storage.from("attachments").remove([storagePath]);
    throw new Error(insertError.message);
  }
  revalidatePath(`/affaires/${affaireId}/documents`);
}

export async function deleteAttachment(id: string, affaireId: string) {
  const supabase = createClient();
  const { data: file } = await supabase.from("attachments").select("storage_path").eq("id", id).single();
  if (file) {
    await supabase.storage.from("attachments").remove([file.storage_path]);
  }
  const { error } = await supabase.from("attachments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/documents`);
}

export async function getAttachmentUrl(storagePath: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("attachments").createSignedUrl(storagePath, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
