"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteEmployeAttachment, getAttachmentUrl, uploadEmployeAttachment } from "@/actions/attachments";
import { createFormation, deleteFormation, updateFormation } from "@/actions/formations";
import { updateEmploye } from "@/actions/employes";
import { Badge } from "@/components/Badge";
import { useToast } from "@/components/Toast";
import { CATEGORIE_PERSONNEL_LABELS, SPECIALITES_PAR_CATEGORIE } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import { rappelStatut } from "@/lib/rappels";
import type { Attachment, Employe, Formation } from "@/lib/types";

const CATEGORIE_TONE: Record<string, "blue" | "warning" | "success"> = {
  bureaux: "blue",
  atelier: "warning",
  chantier: "success",
  consultant: "blue",
};

const STATUT_BADGE: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  ok: { label: "À jour", tone: "success" },
  bientot: { label: "Expire bientôt", tone: "warning" },
  expire: { label: "Expirée", tone: "danger" },
};

const EMPTY_FORMATION: Partial<Formation> = { intitule: "", organisme: "", date_obtention: "", date_expiration: "", notes: "" };

export function EmployeFicheManager({
  employe,
  formations,
  attachments,
}: {
  employe: Employe;
  formations: Formation[];
  attachments: Attachment[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [coord, setCoord] = useState({
    prenom: employe.prenom ?? "",
    nom: employe.nom,
    fonction: employe.fonction ?? "",
    email: employe.email ?? "",
    telephone: employe.telephone ?? "",
    adresse: employe.adresse ?? "",
    date_naissance: employe.date_naissance ?? "",
    specialite: employe.specialite ?? "",
  });

  const [formForm, setFormForm] = useState<Partial<Formation>>(EMPTY_FORMATION);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);

  function saveCoord() {
    startTransition(async () => {
      try {
        await updateEmploye(employe.id, {
          prenom: coord.prenom || null,
          nom: coord.nom,
          fonction: coord.fonction || null,
          email: coord.email || null,
          telephone: coord.telephone || null,
          adresse: coord.adresse || null,
          date_naissance: coord.date_naissance || null,
          specialite: coord.specialite || null,
        });
        showToast("Coordonnées enregistrées.");
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function submitFormation() {
    if (!formForm.intitule) {
      showToast("L'intitulé est requis.");
      return;
    }
    startTransition(async () => {
      try {
        if (editingFormation) {
          await updateFormation(editingFormation.id, formForm);
        } else {
          await createFormation({ ...formForm, employe_id: employe.id });
        }
        setFormForm(EMPTY_FORMATION);
        setEditingFormation(null);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function editFormation(f: Formation) {
    setEditingFormation(f);
    setFormForm(f);
  }

  function removeFormation(f: Formation) {
    if (!confirm(`Supprimer la formation « ${f.intitule} » ?`)) return;
    startTransition(async () => {
      try {
        await deleteFormation(f.id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        await uploadEmployeAttachment(employe.id, formData);
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

  function removeAttachment(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    startTransition(async () => {
      try {
        await deleteEmployeAttachment(id, employe.id);
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <Link href="/rh" className="mb-3 inline-block text-[12.5px] text-blue hover:underline">
        ← Ressources humaines
      </Link>
      <div className="mb-1 flex items-center gap-3">
        <div className="font-display text-[28px] font-bold tracking-wide text-navy">
          {employe.prenom ? `${employe.prenom} ` : ""}
          {employe.nom}
        </div>
        <Badge label={CATEGORIE_PERSONNEL_LABELS[employe.categorie]} tone={CATEGORIE_TONE[employe.categorie]} />
        {!employe.actif && <Badge label="Inactif" tone="danger" />}
      </div>
      <div className="mb-6 text-[13.5px] text-text-muted">{employe.fonction || "Fonction non renseignée"}</div>

      <div className="mb-6 rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Coordonnées</div>
        <div className="grid grid-cols-2 gap-3.5 max-[600px]:grid-cols-1">
          <Field label="Prénom" value={coord.prenom} onChange={(v) => setCoord({ ...coord, prenom: v })} />
          <Field label="Nom" value={coord.nom} onChange={(v) => setCoord({ ...coord, nom: v })} />
          <Field label="Fonction" value={coord.fonction} onChange={(v) => setCoord({ ...coord, fonction: v })} />
          {SPECIALITES_PAR_CATEGORIE[employe.categorie] && (
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Spécialité</label>
              <select
                value={coord.specialite}
                onChange={(e) => setCoord({ ...coord, specialite: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">— Non précisée —</option>
                {SPECIALITES_PAR_CATEGORIE[employe.categorie].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Field label="Date de naissance" type="date" value={coord.date_naissance} onChange={(v) => setCoord({ ...coord, date_naissance: v })} />
          <Field label="Email" value={coord.email} onChange={(v) => setCoord({ ...coord, email: v })} />
          <Field label="Téléphone" value={coord.telephone} onChange={(v) => setCoord({ ...coord, telephone: v })} />
          <div className="col-span-2">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Adresse</label>
            <textarea
              value={coord.adresse}
              onChange={(e) => setCoord({ ...coord, adresse: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={saveCoord}
            disabled={isPending}
            className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Formations & habilitations ({formations.length})</div>
        <div className="mb-3 flex flex-col gap-2">
          {formations.map((f) => {
            const statut = rappelStatut(f.date_expiration);
            return (
              <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-[12.5px]">
                <div>
                  <div className="font-semibold text-navy">{f.intitule}</div>
                  <div className="text-text-muted">
                    {f.organisme || "—"} · Obtenue {fmtDate(f.date_obtention)} · Expire {fmtDate(f.date_expiration)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statut && <Badge label={STATUT_BADGE[statut].label} tone={STATUT_BADGE[statut].tone} />}
                  <button onClick={() => editFormation(f)} className="text-blue hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => removeFormation(f)} className="text-danger hover:underline">
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
          {formations.length === 0 && <div className="p-3 text-center text-[12.5px] text-text-muted">Aucune formation enregistrée.</div>}
        </div>

        <div className="rounded-lg border border-border/60 p-3.5">
          <div className="mb-2.5 text-[12.5px] font-semibold text-text-muted">
            {editingFormation ? "Modifier la formation" : "Ajouter une formation"}
          </div>
          <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <Field label="Intitulé" value={formForm.intitule ?? ""} onChange={(v) => setFormForm({ ...formForm, intitule: v })} />
            <Field label="Organisme" value={formForm.organisme ?? ""} onChange={(v) => setFormForm({ ...formForm, organisme: v })} />
            <Field label="Obtenue le" type="date" value={formForm.date_obtention ?? ""} onChange={(v) => setFormForm({ ...formForm, date_obtention: v })} />
            <Field label="Expire le" type="date" value={formForm.date_expiration ?? ""} onChange={(v) => setFormForm({ ...formForm, date_expiration: v })} />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            {editingFormation && (
              <button
                onClick={() => {
                  setEditingFormation(null);
                  setFormForm(EMPTY_FORMATION);
                }}
                className="rounded-lg border border-border px-4 py-2 text-[13px] font-semibold hover:bg-bg-sunken"
              >
                Annuler
              </button>
            )}
            <button
              onClick={submitFormation}
              disabled={isPending}
              className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              {editingFormation ? "Enregistrer" : "+ Ajouter"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-border bg-bg-card p-5">
        <div className="mb-3 font-display text-[17px] font-semibold text-navy">Documents ({attachments.length})</div>
        <p className="mb-3 text-[12px] text-text-muted">CV, certificat médical, habilitations scannées, etc.</p>
        <div className="mb-4">
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark">
            {isPending ? "Envoi…" : "+ Ajouter un document"}
            <input ref={inputRef} type="file" onChange={handleUpload} disabled={isPending} className="hidden" />
          </label>
        </div>
        <div className="flex flex-col gap-2">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-[9px] border border-border bg-white px-4 py-2.5">
              <button onClick={() => openFile(a)} className="text-[13.5px] font-medium text-blue hover:underline">
                📎 {a.nom}
              </button>
              <div className="flex items-center gap-3 text-[12px] text-text-muted">
                <span>{fmtDate(a.created_at)}</span>
                <button onClick={() => removeAttachment(a.id)} className="text-danger hover:underline">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          {attachments.length === 0 && <div className="p-6 text-center text-[12.5px] text-text-muted">Aucun document.</div>}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
      />
    </div>
  );
}
