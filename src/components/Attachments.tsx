"use client";

import { useRef, useState, useTransition } from "react";
import { deleteAttachment, getAttachmentUrl, uploadAttachment } from "@/actions/attachments";
import { fmtFileSize } from "@/lib/format";
import { useToast } from "@/components/Toast";
import type { Attachment } from "@/lib/supabase/types";

function fileIcon(type: string | null) {
  if (type?.includes("pdf")) return "📄";
  if (type?.includes("image")) return "🖼️";
  return "📎";
}

export function Attachments({
  linkType,
  linkId,
  initialFiles,
}: {
  linkType: "chantiers" | "devis" | "achats" | "maintenances";
  linkId: string;
  initialFiles: Attachment[];
}) {
  const [files, setFiles] = useState(initialFiles);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    Array.from(fileList).forEach((file) => {
      const formData = new FormData();
      formData.set("linkType", linkType);
      formData.set("linkId", linkId);
      formData.set("file", file);
      startTransition(async () => {
        try {
          await uploadAttachment(formData);
          setFiles((prev) => [
            {
              id: crypto.randomUUID(),
              link_type: linkType,
              link_id: linkId,
              nom: file.name,
              type: file.type,
              taille: file.size,
              storage_path: "",
              date_ajout: new Date().toISOString().slice(0, 10),
              created_by: null,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        } catch (e) {
          showToast(e instanceof Error ? e.message : "Échec de l'envoi du document.");
        }
      });
    });
  }

  async function handleDownload(storagePath: string, nom: string) {
    try {
      const url = await getAttachmentUrl(storagePath);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      a.target = "_blank";
      a.click();
    } catch {
      showToast("Impossible de télécharger ce document.");
    }
  }

  function handleDelete(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
    startTransition(async () => {
      try {
        await deleteAttachment(id, linkType);
      } catch {
        showToast("Échec de la suppression du document.");
      }
    });
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold tracking-wide text-text-muted">
        Documents joints (PDF, photos, plans...)
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`dropzone cursor-pointer rounded-[10px] border-[1.5px] border-dashed border-border p-4.5 text-center text-sm text-text-muted transition-colors ${dragging ? "drag" : ""}`}
      >
        <div className="mb-1 text-xl">📎</div>
        <div>
          Glissez des fichiers ici, ou <span className="text-accent-bright underline">parcourir</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <div className="mt-1.5 text-[11px] text-text-muted">
        15 Mo maximum par fichier — stocké de façon sécurisée sur le serveur.
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {isPending && <div className="text-xs text-text-muted">Traitement en cours…</div>}
        {!files.length && !isPending && <div className="text-xs text-text-muted">Aucun document joint.</div>}
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12.5px]"
          >
            <span>{fileIcon(f.type)}</span>
            <span className="flex-1 truncate">{f.nom}</span>
            <span className="font-mono text-[11px] text-text-muted">{fmtFileSize(f.taille)}</span>
            {f.storage_path && (
              <button
                type="button"
                className="text-xs font-semibold text-accent-bright"
                onClick={() => handleDownload(f.storage_path, f.nom)}
              >
                Télécharger
              </button>
            )}
            <button
              type="button"
              className="text-danger"
              onClick={() => handleDelete(f.id)}
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
