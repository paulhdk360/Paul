"use client";

import { useRef, useState, useTransition } from "react";
import { exportAllData, importLegacyData } from "@/actions/migration";
import { useToast } from "@/components/Toast";

export function DataMigration() {
  const [isPending, startTransition] = useTransition();
  const [log, setLog] = useState<string[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  function handleExport() {
    startTransition(async () => {
      try {
        const data = await exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bfe-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        showToast("Échec de l'export des données.");
      }
    });
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      startTransition(async () => {
        try {
          const result = await importLegacyData(text);
          setLog(result);
        } catch (e) {
          showToast(e instanceof Error ? e.message : "Échec de l'import des données.");
        }
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="rounded-[10px] border border-border bg-bg-card p-5">
      <h3 className="mb-2 font-display text-[19px] font-semibold">Sauvegarde et migration des données</h3>
      <p className="mb-4 text-[13px] text-text-muted">
        Exportez l&apos;ensemble des données de l&apos;application au format JSON (sauvegarde), ou importez les
        données déjà saisies dans l&apos;ancien prototype (fichier exporté depuis le navigateur / localStorage).
      </p>
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={handleExport}
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-[13.5px] font-semibold text-[#06201B] hover:bg-accent-bright disabled:opacity-60"
        >
          Exporter les données (JSON)
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-card-hover disabled:opacity-60"
        >
          Importer un fichier JSON du prototype
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {log && (
        <div className="mt-4 rounded-lg border border-accent-bright/30 bg-accent/[.08] p-3 text-[12.5px]">
          <div className="mb-1 font-semibold text-accent-bright">Import terminé :</div>
          <ul className="list-inside list-disc">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
