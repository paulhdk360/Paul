"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notifyUser } from "@/actions/notifications";
import { updateWorkorder } from "@/actions/workorders";
import { Badge } from "@/components/Badge";
import { useToast } from "@/components/Toast";
import { RETOUR_DECISIONS, type RetourDecision } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import type { Affaire, CatalogueOutil, Profile, Role, ToolListItem, Workorder } from "@/lib/types";

type FilterKey = "ouverts" | "termines" | "tous";

const EQUIPE_ROLES = ["admin", "commercial", "administratif_logistique"];

export function WorkordersManager({
  workorders,
  affaires,
  outils,
  items,
  profiles,
  currentRole,
}: {
  workorders: Workorder[];
  affaires: Pick<Affaire, "id" | "reference">[];
  outils: Pick<CatalogueOutil, "id" | "designation" | "numero_article">[];
  items: Pick<ToolListItem, "id" | "designation" | "numero_serie">[];
  profiles: Profile[];
  currentRole: Role;
}) {
  const equipeProfiles = profiles.filter((p) => EQUIPE_ROLES.includes(p.role));
  const [filter, setFilter] = useState<FilterKey>("ouverts");
  const canEdit = currentRole === "atelier";

  const affaireById = new Map(affaires.map((a) => [a.id, a]));
  const outilById = new Map(outils.map((o) => [o.id, o]));
  const itemById = new Map(items.map((i) => [i.id, i]));

  const filtered = workorders.filter((w) => {
    if (filter === "ouverts") return w.statut !== "Terminé";
    if (filter === "termines") return w.statut === "Terminé";
    return true;
  });

  const countOuverts = workorders.filter((w) => w.statut !== "Terminé").length;

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Workorders</div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        Créés automatiquement depuis le Pointage retour dès qu&apos;une décision autre que « retour au stock » est
        prise — {canEdit ? "renseignez ici les heures et le matériel utilisés." : "consultation seule (Atelier renseigne le détail)."}
      </div>

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

      <div className="flex flex-col gap-3">
        {filtered.map((w) => (
          <WorkorderRow
            key={w.id}
            workorder={w}
            affaireRef={w.affaire_id ? affaireById.get(w.affaire_id)?.reference ?? "—" : "—"}
            outil={w.outil_id ? outilById.get(w.outil_id) : undefined}
            item={w.tool_list_item_id ? itemById.get(w.tool_list_item_id) : undefined}
            canEdit={canEdit}
            equipeProfiles={equipeProfiles}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">Aucun workorder.</div>
        )}
      </div>
    </div>
  );
}

function WorkorderRow({
  workorder,
  affaireRef,
  outil,
  item,
  canEdit,
  equipeProfiles,
}: {
  workorder: Workorder;
  affaireRef: string;
  outil?: Pick<CatalogueOutil, "id" | "designation" | "numero_article">;
  item?: Pick<ToolListItem, "id" | "designation" | "numero_serie">;
  canEdit: boolean;
  equipeProfiles: Profile[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    heures: workorder.heures?.toString() ?? "",
    carbures: workorder.carbures?.toString() ?? "",
    inserts: workorder.inserts?.toString() ?? "",
    materiel_soudure: workorder.materiel_soudure?.toString() ?? "",
    notes: workorder.notes ?? "",
  });

  const designation = outil?.designation ?? item?.designation.split("\n")[0] ?? "—";
  const decisionLabel = RETOUR_DECISIONS[workorder.decision as RetourDecision] ?? workorder.decision;

  function save() {
    startTransition(async () => {
      try {
        await updateWorkorder(workorder.id, {
          heures: form.heures ? Number(form.heures) : null,
          carbures: form.carbures ? Number(form.carbures) : null,
          inserts: form.inserts ? Number(form.inserts) : null,
          materiel_soudure: form.materiel_soudure ? Number(form.materiel_soudure) : null,
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
            Affaire {affaireRef} {item?.numero_serie ? `· N° série ${item.numero_serie}` : ""} {outil?.numero_article ? `· ${outil.numero_article}` : ""}
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
            <NumField label="Carbures utilisés" value={form.carbures} onChange={(v) => setForm({ ...form, carbures: v })} />
            <NumField label="Inserts utilisés" value={form.inserts} onChange={(v) => setForm({ ...form, inserts: v })} />
            <NumField label="Matériel de soudure" value={form.materiel_soudure} onChange={(v) => setForm({ ...form, materiel_soudure: v })} />
          </div>
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
          <ReadField label="Carbures utilisés" value={workorder.carbures} />
          <ReadField label="Inserts utilisés" value={workorder.inserts} />
          <ReadField label="Matériel de soudure" value={workorder.materiel_soudure} />
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
