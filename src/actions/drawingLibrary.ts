"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DrawingLibraryEntry } from "@/lib/types";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

// Pasted straight from a screenshot or copied out of Excel — the browser
// clipboard only ever hands over a raster blob (no real filename), so the
// display name comes from what the user typed next to the paste zone.
export async function uploadDrawing(nom: string, formData: FormData): Promise<DrawingLibraryEntry> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Aucune image reçue.");
  if (!nom.trim()) throw new Error("Le nom du dessin est requis.");
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`L'image dépasse ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} Mo.`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ext = file.type === "image/jpeg" ? "jpg" : "png";
  const storagePath = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("drawings")
    .upload(storagePath, file, { contentType: file.type || "image/png" });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = supabase.storage.from("drawings").getPublicUrl(storagePath);

  const { data: row, error: insertError } = await supabase
    .from("drawing_library")
    .insert({ nom: nom.trim(), url: pub.publicUrl, created_by: user?.id ?? null })
    .select()
    .single();
  if (insertError) {
    await supabase.storage.from("drawings").remove([storagePath]);
    throw new Error(insertError.message);
  }
  revalidatePath("/bha");
  return row as DrawingLibraryEntry;
}

export async function deleteDrawing(id: string, url: string) {
  const supabase = createClient();
  // Also clears any famille currently pointing at this drawing so the
  // library never leaves a dangling reference to a deleted image.
  await supabase.from("outil_drawings").delete().eq("fichier", url);
  const { error } = await supabase.from("drawing_library").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bha");
}
