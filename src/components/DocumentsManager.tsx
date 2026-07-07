"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAttachment, getAttachmentUrl, uploadAttachment } from "@/actions/attachments";
import { useToast } from "@/components/Toast";
import { fmtDate } from "@/lib/format";
import type { Attachment } from "@/lib/types";

export function DocumentsManager({ affaireId, attachments }: { affaireId: string; attachments: Attachment[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        await uploadAttachment(affaireId, formData);
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Échec de l'envoi du fichier.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  async function openFile(a: Attachment) {
    try {
      const url = await getAttachmentUrl(a.storage_path);
      window.open(url, "_blank");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'ouverture du fichier.");
    }
  }

  function remove(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    startTransition(async () => {
      try {
        await deleteAttachment(id, affaireId);
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="mb-4">
        <label className="inline-flex cursor-pointer items-center rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark">
          {isPending ? "Envoi…" : "+ Ajouter un document"}
          <input ref={inputRef} type="file" onChange={handleUpload} disabled={isPending} className="hidden" />
        </label>
      </div>
      <div className="flex flex-col gap-2">
        {attachments.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-[9px] border border-border bg-bg-card px-4 py-2.5">
            <button onClick={() => openFile(a)} className="text-[13.5px] font-medium text-blue hover:underline">
              📎 {a.nom}
            </button>
            <div className="flex items-center gap-3 text-[12px] text-text-muted">
              <span>{fmtDate(a.created_at)}</span>
              <button onClick={() => remove(a.id)} className="text-danger hover:underline">
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {attachments.length === 0 && (
          <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
            Aucun document. Fiches techniques, photos, certificats…
          </div>
        )}
      </div>
    </div>
  );
}
