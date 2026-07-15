"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notifyUser } from "@/actions/notifications";
import { createWorkorder, updateWorkorder } from "@/actions/workorders";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { RETOUR_DECISIONS, type RetourDecision } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import type { Affaire, BonLivraison, CatalogueOutil, Profile, Role, ToolListItem, Workorder } from "@/lib/types";

type FilterKey = "ouverts" | "termines" | "tous";
type ViewKey = "workorders" | "historique";

// "Avertir tout le monde" once Atelier is done — everyone who has any
// business oversight of the affaire, minus Atelier itself (the one
// clicking) and Opérateur (no notification bell at all).
const EQUIPE_ROLES = ["admin", "commercial", "direction", "administratif_logistique"];

export function WorkordersManager({
  workorders,
  affaires,
  outils,
  items,
  bls,
  historiqueItems,
  profiles,
  currentRole,
}: {
  workorders: Workorder[];
  affaires: Pick<Affaire, "id" | "reference">[];
  outils: Pick<CatalogueOutil, "id" | "designation" | "numero_article">[];
  items: Pick<ToolListItem, "id" | "designation" | "numero_serie" | "bl_id">[];
  bls: Pick<BonLivraison, "id" | "numero_bl">[];
  historiqueItems: Pick<ToolListItem, "id" | "affaire_id" | "designation" | "numero_serie" | "bl_id" | "retour_decision" | "retour_confirme_at">[];
  profiles: Profile[];
  currentRole: Role;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const equipeProfiles = profiles.filter((p) => EQUIPE_ROLES.includes(p.role));
  const [view, setView] = useState<ViewKey>("workorders");
  const [filter, setFilter] = useState<FilterKey>("ouverts");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ decision: "", outil_id: "", affaire_id: "" });
  const canEdit = currentRole === "atelier";

  const affaireById = new Map(affaires.map((a) => [a.id, a]));
  const outilById = new Map(outils.map((o) => [o.id, o]));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const blById = new Map(bls.map((b) => [b.id, b]));

  const filtered = workorders.filter((w) => {
    if (filter === "ouverts") return w.statut !== "Terminé";
    if (filter === "termines") return w.statut === "Terminé";
    return true;
  });

  const countOuverts = workorders.filter((w) => w.statut !== "Terminé").length;

  function submitCreate() {
    if (!form.decision.trim()) {
      showToast("Le motif est requis.");
      return;
    }
    startTransition(async () => {
      try {
        await createWorkorder({
          decision: form.decision.trim(),
          outil_id: form.outil_id || null,
          affaire_id: form.affaire_id || null,
        });
        setForm({ decision: "", outil_id: "", affaire_id: "" });
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la création.");
      }
    });
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-[30px] font-bold tracking-wide text-navy">Workorders</div>
        {canEdit && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
          >
            + Nouveau workorder
          </button>
        )}
      </div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        Générés automatiquement par BL, dès que toutes ses lignes ont été pointées au retour (bien arrivé + décision) —
        et ouvrables à la main à tout moment (entretien préventif, préparation avant affaire…) —{" "}
        {canEdit ? "renseignez ici les heures et le matériel utilisés." : "consultation seule (Atelier renseigne le détail)."}{" "}
        Rien n&apos;est jamais supprimé : un workorder « Terminé » reste consultable dans l&apos;onglet dédié.
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border pb-3">
        {(
          [
            ["workorders", "Workorders"],
            ["historique", `Historique pointage retour (${historiqueItems.length})`],
          ] as [ViewKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
              view === key ? "bg-navy text-white" : "text-text-muted hover:bg-bg-sunken"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "workorders" && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {(
            [
              ["ouverts", `Ouverts (${countOuverts})`],
              ["termines", "Terminés"],
              ["tous", "Tous"],
            ] as [FilterKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                filter === key ? "border-navy bg-navy text-white" : "border-border text-text-muted hover:bg-bg-sunken"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {view === "workorders" && open && (
        <Modal title="Nouveau workorder" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Motif / type de travail</label>
              <input
                value={form.decision}
                onChange={(e) => setForm({ ...form, decision: e.target.value })}
                placeholder="ex. Entretien préventif, préparation avant affaire…"
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Outil catalogue (optionnel)</label>
              <select
                value={form.outil_id}
                onChange={(e) => setForm({ ...form, outil_id: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">—</option>
                {outils.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.designation} {o.numero_article ? `(${o.numero_article})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Affaire (optionnel)</label>
              <select
                value={form.affaire_id}
                onChange={(e) => setForm({ ...form, affaire_id: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                <option value="">—</option>
                {affaires.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.reference}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
                Annuler
              </button>
              <button
                onClick={submitCreate}
                disabled={isPending}
                className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
              >
                Créer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {view === "workorders" && (
        <div className="flex flex-col gap-3">
          {filtered.map((w) => {
            const item = w.tool_list_item_id ? itemById.get(w.tool_list_item_id) : undefined;
            return (
              <WorkorderRow
                key={w.id}
                workorder={w}
                affaireRef={w.affaire_id ? affaireById.get(w.affaire_id)?.reference ?? "—" : "—"}
                outil={w.outil_id ? outilById.get(w.outil_id) : undefined}
                item={item}
                blNumero={item?.bl_id ? blById.get(item.bl_id)?.numero_bl : undefined}
                canEdit={canEdit}
                equipeProfiles={equipeProfiles}
              />
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">Aucun workorder.</div>
          )}
        </div>
      )}

      {view === "historique" && (
        <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
          <table className="w-full min-w-[880px] text-[12.5px]">
            <thead>
              <tr className="bg-bg-sunken">
                {["Date confirmée", "Affaire", "BL", "Désignation", "N° série", "Décision"].map((h) => (
                  <th key={h} className="border-b border-border px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historiqueItems.map((i) => (
                <tr key={i.id} className="hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-3 py-2 text-text-muted">{fmtDate(i.retour_confirme_at)}</td>
                  <td className="border-b border-border/60 px-3 py-2">{i.affaire_id ? affaireById.get(i.affaire_id)?.reference ?? "—" : "—"}</td>
                  <td className="border-b border-border/60 px-3 py-2">{i.bl_id ? blById.get(i.bl_id)?.numero_bl ?? "—" : "—"}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-medium">{i.designation.split("\n")[0]}</td>
                  <td className="border-b border-border/60 px-3 py-2 font-mono text-[11.5px] text-text-muted">{i.numero_serie ?? "—"}</td>
                  <td className="border-b border-border/60 px-3 py-2">
                    <Badge label={RETOUR_DECISIONS[i.retour_decision as RetourDecision] ?? i.retour_decision ?? "—"} />
                  </td>
                </tr>
              ))}
              {historiqueItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted">
                    Aucun pointage retour effectué pour l&apos;instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WorkorderRow({
  workorder,
  affaireRef,
  outil,
  item,
  blNumero,
  canEdit,
  equipeProfiles,
}: {
  workorder: Workorder;
  affaireRef: string;
  outil?: Pick<CatalogueOutil, "id" | "designation" | "numero_article">;
  item?: Pick<ToolListItem, "id" | "designation" | "numero_serie" | "bl_id">;
  blNumero?: string;
  canEdit: boolean;
  equipeProfiles: Profile[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    heures: workorder.heures?.toString() ?? "",
    nombre_personnel: workorder.nombre_personnel?.toString() ?? "",
    carbures: workorder.carbures?.toString() ?? "",
    inserts: workorder.inserts?.toString() ?? "",
    materiel_soudure: workorder.materiel_soudure?.toString() ?? "",
    cout_materiel: workorder.cout_materiel?.toString() ?? "",
    notes: workorder.notes ?? "",
  });

  const designation = outil?.designation ?? item?.designation.split("\n")[0] ?? "—";
  const decisionLabel = RETOUR_DECISIONS[workorder.decision as RetourDecision] ?? workorder.decision;

  function save() {
    startTransition(async () => {
      try {
        await updateWorkorder(workorder.id, {
          heures: form.heures ? Number(form.heures) : null,
          nombre_personnel: form.nombre_personnel ? Number(form.nombre_personnel) : null,
          carbures: form.carbures ? Number(form.carbures) : null,
          inserts: form.inserts ? Number(form.inserts) : null,
          materiel_soudure: form.materiel_soudure ? Number(form.materiel_soudure) : null,
          cout_materiel: form.cout_materiel ? Number(form.cout_materiel) : null,
          notes: form.notes || null,
        });
        showToast("Workorder enregistré.");
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function toggleTermine() {
    const nowTermine = workorder.statut !== "Terminé";
    startTransition(async () => {
      try {
        await updateWorkorder(workorder.id, { statut: nowTermine ? "Terminé" : "Ouvert" });
        if (nowTermine) {
          await Promise.all(
            equipeProfiles.map((p) =>
              notifyUser(p.id, `Workorder terminé — ${designation} (affaire ${affaireRef})`, "/workorders"),
            ),
          );
          showToast("Équipe prévenue.");
        }
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <div className="rounded-[10px] border border-border bg-bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-navy">{designation}</div>
          <div className="text-[12px] text-text-muted">
            Affaire {affaireRef} {blNumero ? `· BL ${blNumero}` : ""} {item?.numero_serie ? `· N° série ${item.numero_serie}` : ""}{" "}
            {outil?.numero_article ? `· ${outil.numero_article}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={decisionLabel} />
          <Badge label={workorder.statut} tone={workorder.statut === "Terminé" ? "success" : "warning"} />
          <span className="text-[11px] text-text-muted">{fmtDate(workorder.created_at)}</span>
        </div>
      </div>

      {canEdit ? (
        <>
          <div className="grid grid-cols-4 gap-3 max-[700px]:grid-cols-2">
            <NumField label="Heures passées" value={form.heures} onChange={(v) => setForm({ ...form, heures: v })} />
            <NumField label="Nombre de personnel" value={form.nombre_personnel} onChange={(v) => setForm({ ...form, nombre_personnel: v })} />
            <NumField label="Carbures utilisés" value={form.carbures} onChange={(v) => setForm({ ...form, carbures: v })} />
            <NumField label="Inserts utilisés" value={form.inserts} onChange={(v) => setForm({ ...form, inserts: v })} />
            <NumField label="Matériel de soudure" value={form.materiel_soudure} onChange={(v) => setForm({ ...form, materiel_soudure: v })} />
            <NumField label="Coût matériel (€)" value={form.cout_materiel} onChange={(v) => setForm({ ...form, cout_materiel: v })} />
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            Heures × personnel × tarif horaire Atelier de l&apos;affaire + coût matériel alimentent automatiquement la
            rentabilité de l&apos;affaire.
          </p>
          <div className="mt-3">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Détails de la réparation, autres consommables…"
              className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={toggleTermine}
              disabled={isPending}
              className="rounded-lg border border-border px-4 py-2 text-[13px] font-semibold hover:bg-bg-sunken disabled:opacity-60"
            >
              {workorder.statut === "Terminé" ? "Rouvrir" : "Marquer terminé"}
            </button>
            <button
              onClick={save}
              disabled={isPending}
              className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-4 gap-3 text-[12.5px] max-[700px]:grid-cols-2">
          <ReadField label="Heures passées" value={workorder.heures} />
          <ReadField label="Nombre de personnel" value={workorder.nombre_personnel} />
          <ReadField label="Carbures utilisés" value={workorder.carbures} />
          <ReadField label="Inserts utilisés" value={workorder.inserts} />
          <ReadField label="Matériel de soudure" value={workorder.materiel_soudure} />
          <ReadField label="Coût matériel (€)" value={workorder.cout_materiel} />
          {workorder.notes && (
            <div className="col-span-4">
              <div className="text-[10.5px] font-semibold uppercase text-text-muted">Notes</div>
              <div className="whitespace-pre-line">{workorder.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">{label}</label>
      <input
        type="number"
        step="0.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
      />
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase text-text-muted">{label}</div>
      <div className="font-medium text-navy">{value ?? "—"}</div>
    </div>
  );
}
