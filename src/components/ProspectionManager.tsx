"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProspectAttachment, getAttachmentUrl, uploadProspectAttachment } from "@/actions/attachments";
import { addInteraction, createProspect, deleteInteraction, deleteProspect, updateProspect } from "@/actions/prospects";
import { Badge } from "@/components/Badge";
import { KpiCard } from "@/components/KpiCard";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { CANAUX_PROSPECTION, PROSPECT_STATUTS } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import type { Attachment, CanalProspection, Prospect, ProspectInteraction, ProspectStatut } from "@/lib/types";

const EMPTY_PROSPECT: Partial<Prospect> = {
  entreprise: "",
  contact_nom: "",
  contact_fonction: "",
  telephone: "",
  email: "",
  secteur: "",
  statut: "À contacter",
  prochaine_action: "",
  date_relance: "",
  notes: "",
};

const CLOSED: ProspectStatut[] = ["Gagné", "Perdu"];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Condensed scaffold from la checklist d'appel client (forage/workover/
// fishing) — section headers only, pas les ~60 sous-champs, pour garder la
// saisie rapide pendant l'appel plutôt que remplir un formulaire complet.
const CALL_TEMPLATE = `Contexte (client, type d'opération, urgence) :
Plateforme / appareil / levage :
Puits (profondeur, profil, état) :
Tubulaires en place (casing/liner/tubing) :
Colonne de forage / BHA :
Fluide de forage :
Paramètres opérationnels visés :
Spécifique fishing (nature du fish, profondeur, déjà tenté) :
Commercial (démarrage souhaité, facturation, devis attendu) :`;

const FANATICAL_TIPS = [
  {
    titre: "Règle des 30 jours",
    texte: "L'activité de prospection d'aujourd'hui remplit ton pipeline dans 90 jours. Un creux de prospection cette semaine = un creux de CA dans 3 mois.",
  },
  {
    titre: "Pas de canal unique",
    texte: "Le « syndrome du canal unique » tue le pipeline — alterne téléphone, email, réseau, visite, salon plutôt que de tout miser sur un seul.",
  },
  {
    titre: "Power Hour",
    texte: "Bloque une plage horaire fixe et protégée pour prospecter, sans email ni notifications — la régularité compte plus que l'intensité ponctuelle.",
  },
  {
    titre: "Mesure l'activité, pas juste le résultat",
    texte: "Nombre d'appels, d'emails, de contacts pris — c'est le seul indicateur que tu contrôles vraiment, les résultats suivent avec un décalage.",
  },
  {
    titre: "Loi universelle du besoin",
    texte: "On achète avec ses émotions puis on justifie avec la logique — concentre-toi sur le problème réel du client, pas la liste de fonctionnalités.",
  },
  {
    titre: "Toujours une prochaine étape",
    texte: "Ne termine jamais un échange sans une prochaine action claire et datée — c'est ce que le champ « Prochaine action » du pipeline sert à forcer.",
  },
  {
    titre: "Meilleurs créneaux",
    texte: "Tôt le matin et fin de journée : les décideurs répondent souvent eux-mêmes au téléphone à ces heures-là.",
  },
];

const VOSS_TIPS = [
  {
    titre: "Empathie tactique",
    texte: "Comprends vraiment le point de vue de l'autre avant de vouloir le convaincre — ce n'est pas de la gentillesse, c'est une technique.",
  },
  {
    titre: "Mirroring",
    texte: "Répète les 3 derniers mots de l'interlocuteur pour le faire développer, sans qu'il ait l'impression d'être interrogé.",
  },
  {
    titre: "Labeling",
    texte: "Nomme ce que ressent l'autre : « On dirait que... », « Il semble que... » — ça désamorce la tension sans juger.",
  },
  {
    titre: "Questions calibrées",
    texte: "« Comment suis-je censé faire ça ? » plutôt qu'un refus frontal — ça pousse l'autre à résoudre ton problème lui-même.",
  },
  {
    titre: "Viser le « C'est exact »",
    texte: "Un « vous avez raison » poli ne veut rien dire. Le « c'est exact » signale que l'autre se sent vraiment compris.",
  },
  {
    titre: "Le « non » n'est pas la fin",
    texte: "Souvent, un « non » est le vrai début de la négociation, pas un refus définitif — ne raccroche pas dessus.",
  },
  {
    titre: "Audit d'accusation",
    texte: "Énumère toi-même les objections que l'autre pourrait avoir avant qu'il les formule — ça les désamorce à l'avance.",
  },
  {
    titre: "Modèle Ackerman (prix)",
    texte: "Pour négocier un prix : ancre haut puis concède par paliers décroissants (65 % / 85 % / 95 % / 100 %), jamais de façon linéaire.",
  },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ProspectionManager({
  prospects,
  interactions,
  attachments,
}: {
  prospects: Prospect[];
  interactions: ProspectInteraction[];
  attachments: Attachment[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [statutFilter, setStatutFilter] = useState<ProspectStatut | "Tous">("Tous");

  const [editing, setEditing] = useState<Prospect | null>(null);
  const [form, setForm] = useState<Partial<Prospect>>(EMPTY_PROSPECT);
  const [modalOpen, setModalOpen] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [techniquesOpen, setTechniquesOpen] = useState(false);

  const interactionsByProspect = new Map<string, ProspectInteraction[]>();
  for (const i of interactions) {
    const arr = interactionsByProspect.get(i.prospect_id) ?? [];
    arr.push(i);
    interactionsByProspect.set(i.prospect_id, arr);
  }
  for (const arr of interactionsByProspect.values()) arr.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const dernierContact = new Map<string, string>();
  for (const p of prospects) {
    const last = interactionsByProspect.get(p.id)?.[0]?.created_at ?? p.created_at;
    dernierContact.set(p.id, last);
  }

  const now = Date.now();
  const prospectsActifs = prospects.filter((p) => !CLOSED.includes(p.statut));
  const relancesEnRetard = prospectsActifs.filter((p) => p.date_relance && p.date_relance < todayISO());
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const interactionsCetteSemaine = interactions.filter((i) => new Date(i.created_at) >= startOfWeek);
  const sansContact30j = prospectsActifs.filter((p) => now - new Date(dernierContact.get(p.id)!).getTime() > THIRTY_DAYS_MS);

  const filtered = statutFilter === "Tous" ? prospects : prospects.filter((p) => p.statut === statutFilter);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_PROSPECT);
    setModalOpen(true);
  }

  function openEdit(p: Prospect) {
    setEditing(p);
    setForm(p);
    setModalOpen(true);
  }

  function submit() {
    if (!form.entreprise) {
      showToast("Le nom de l'entreprise est requis.");
      return;
    }
    startTransition(async () => {
      try {
        if (editing) {
          await updateProspect(editing.id, form);
        } else {
          await createProspect(form);
        }
        setModalOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Supprimer ce prospect et tout son historique ?")) return;
    startTransition(async () => {
      try {
        await deleteProspect(id);
        if (detailId === id) setDetailId(null);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  const detailProspect = prospects.find((p) => p.id === detailId) ?? null;

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Prospection</div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        Suivi des prospects, des échanges et des documents envoyés — l&apos;activité aujourd&apos;hui fait le pipeline de demain.
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
        <KpiCard label="Prospects actifs" value={prospectsActifs.length} />
        <KpiCard label="Relances en retard" value={relancesEnRetard.length} sub={relancesEnRetard.length > 0 ? "à traiter" : undefined} />
        <KpiCard label="Interactions cette semaine" value={interactionsCetteSemaine.length} sub="appels, mails, visites…" />
        <KpiCard label="Sans contact depuis 30j+" value={sansContact30j.length} sub="règle des 30 jours" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {(["Tous", ...PROSPECT_STATUTS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                statutFilter === s ? "border-blue/30 bg-blue/10 text-blue" : "border-border text-text-muted hover:bg-bg-sunken"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTechniquesOpen(true)}
            className="rounded-lg border border-border px-4 py-2.5 text-[13.5px] font-semibold text-text-dark hover:bg-bg-sunken"
          >
            📘 Techniques
          </button>
          <button onClick={openCreate} className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark">
            + Nouveau prospect
          </button>
        </div>
      </div>

      {techniquesOpen && (
        <Modal title="Aide-mémoire — techniques de prospection et négociation" onClose={() => setTechniquesOpen(false)} wide>
          <div className="grid grid-cols-2 gap-6 max-[700px]:grid-cols-1">
            <div>
              <div className="mb-3 text-[12.5px] font-semibold uppercase tracking-wide text-blue">Fanatical Prospecting — Jeb Blount</div>
              <div className="flex flex-col gap-3">
                {FANATICAL_TIPS.map((t) => (
                  <div key={t.titre}>
                    <div className="text-[13px] font-semibold text-navy">{t.titre}</div>
                    <div className="text-[12.5px] text-text-muted">{t.texte}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 text-[12.5px] font-semibold uppercase tracking-wide text-warning">Never Split the Difference — Chris Voss</div>
              <div className="flex flex-col gap-3">
                {VOSS_TIPS.map((t) => (
                  <div key={t.titre}>
                    <div className="text-[13px] font-semibold text-navy">{t.titre}</div>
                    <div className="text-[12.5px] text-text-muted">{t.texte}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[880px] text-[13px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Entreprise", "Contact", "Statut", "Dernier contact", "Prochaine relance", ""].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const last = dernierContact.get(p.id)!;
              const staleContact = !CLOSED.includes(p.statut) && now - new Date(last).getTime() > THIRTY_DAYS_MS;
              const overdueRelance = p.date_relance && p.date_relance < todayISO() && !CLOSED.includes(p.statut);
              return (
                <tr key={p.id} className="hover:bg-bg-sunken/50">
                  <td className="border-b border-border/60 px-3 py-2">
                    <button onClick={() => setDetailId(p.id)} className="font-semibold text-navy hover:underline">
                      {p.entreprise}
                    </button>
                    {p.secteur && <div className="text-[11.5px] text-text-muted">{p.secteur}</div>}
                  </td>
                  <td className="border-b border-border/60 px-3 py-2">
                    {p.contact_nom || "—"}
                    {p.contact_fonction ? <div className="text-[11.5px] text-text-muted">{p.contact_fonction}</div> : null}
                  </td>
                  <td className="border-b border-border/60 px-3 py-2">
                    <Badge label={p.statut} />
                  </td>
                  <td className={`border-b border-border/60 px-3 py-2 ${staleContact ? "font-semibold text-warning" : ""}`}>{fmtDate(last)}</td>
                  <td className={`border-b border-border/60 px-3 py-2 ${overdueRelance ? "font-semibold text-danger" : ""}`}>
                    {p.date_relance ? fmtDate(p.date_relance) : "—"}
                  </td>
                  <td className="border-b border-border/60 px-3 py-2 text-right">
                    <button onClick={() => setDetailId(p.id)} className="mr-2 text-blue hover:underline">
                      Suivi
                    </button>
                    <button onClick={() => openEdit(p)} className="mr-2 text-blue hover:underline">
                      Modifier
                    </button>
                    <button onClick={() => remove(p.id)} className="text-danger hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">
                  Aucun prospect{statutFilter !== "Tous" ? ` au statut « ${statutFilter} »` : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? "Modifier le prospect" : "Nouveau prospect"} onClose={() => setModalOpen(false)}>
          <div className="grid grid-cols-2 gap-3.5 max-[500px]:grid-cols-1">
            <div className="col-span-2 max-[500px]:col-span-1">
              <Field label="Entreprise *" value={form.entreprise ?? ""} onChange={(v) => setForm({ ...form, entreprise: v })} />
            </div>
            <Field label="Contact" value={form.contact_nom ?? ""} onChange={(v) => setForm({ ...form, contact_nom: v })} />
            <Field label="Fonction" value={form.contact_fonction ?? ""} onChange={(v) => setForm({ ...form, contact_fonction: v })} />
            <Field label="Téléphone" value={form.telephone ?? ""} onChange={(v) => setForm({ ...form, telephone: v })} />
            <Field label="Email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Secteur" value={form.secteur ?? ""} onChange={(v) => setForm({ ...form, secteur: v })} />
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Statut</label>
              <select
                value={form.statut ?? "À contacter"}
                onChange={(e) => setForm({ ...form, statut: e.target.value as ProspectStatut })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              >
                {PROSPECT_STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">Date de relance</label>
              <input
                type="date"
                value={form.date_relance ?? ""}
                onChange={(e) => setForm({ ...form, date_relance: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
              />
            </div>
            <div className="col-span-2 max-[500px]:col-span-1">
              <Field label="Prochaine action" value={form.prochaine_action ?? ""} onChange={(v) => setForm({ ...form, prochaine_action: v })} />
            </div>
            <div className="col-span-2 max-[500px]:col-span-1">
              <Field label="Notes" value={form.notes ?? ""} onChange={(v) => setForm({ ...form, notes: v })} textarea />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2.5">
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-border px-4 py-2.5 text-[13.5px] font-semibold hover:bg-bg-sunken">
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={isPending}
              className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      )}

      {detailProspect && (
        <ProspectDetail
          prospect={detailProspect}
          interactions={interactionsByProspect.get(detailProspect.id) ?? []}
          attachments={attachments.filter((a) => a.link_id === detailProspect.id)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

function ProspectDetail({
  prospect,
  interactions,
  attachments,
  onClose,
}: {
  prospect: Prospect;
  interactions: ProspectInteraction[];
  attachments: Attachment[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [canal, setCanal] = useState<CanalProspection>("Téléphone");
  const [resume, setResume] = useState("");

  function submitInteraction() {
    if (!resume.trim()) {
      showToast("Décris brièvement l'échange.");
      return;
    }
    startTransition(async () => {
      try {
        await addInteraction({ prospect_id: prospect.id, canal, resume: resume.trim() });
        setResume("");
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'ajout.");
      }
    });
  }

  function removeInteraction(id: string) {
    if (!confirm("Supprimer cette entrée de l'historique ?")) return;
    startTransition(async () => {
      try {
        await deleteInteraction(id);
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
        await uploadProspectAttachment(prospect.id, formData);
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

  function removeFile(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    startTransition(async () => {
      try {
        await deleteProspectAttachment(id);
        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <Modal title={`Suivi — ${prospect.entreprise}`} onClose={onClose} wide>
      <div className="mb-5 grid grid-cols-3 gap-3 rounded-lg border border-border bg-bg-sunken p-3.5 text-[12.5px] max-[600px]:grid-cols-1">
        <div>
          <div className="text-text-muted">Contact</div>
          <div className="font-medium text-navy">{prospect.contact_nom || "—"}</div>
        </div>
        <div>
          <div className="text-text-muted">Statut</div>
          <Badge label={prospect.statut} />
        </div>
        <div>
          <div className="text-text-muted">Prochaine action</div>
          <div className="font-medium text-navy">{prospect.prochaine_action || "—"}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 text-[12.5px] font-semibold text-text-muted">Historique des échanges</div>
        <div className="mb-3 rounded-lg border border-border bg-bg-card p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-text-muted">Canal</label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value as CanalProspection)}
                className="rounded-lg border border-border px-2.5 py-1.5 text-[13px] focus:border-blue focus:outline-none"
              >
                {CANAUX_PROSPECTION.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {canal === "Téléphone" && (
              <button
                type="button"
                onClick={() => setResume((r) => (r ? r : CALL_TEMPLATE))}
                className="mt-4 text-[11.5px] font-semibold text-blue hover:underline"
              >
                + Insérer trame d&apos;appel
              </button>
            )}
          </div>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Ce qui s'est dit, prochaine étape…"
            rows={resume.includes("\n") ? 9 : 2}
            className="mb-2 w-full rounded-lg border border-border px-3 py-1.5 text-[13px] focus:border-blue focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              onClick={submitInteraction}
              disabled={isPending}
              className="rounded-lg bg-navy px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {interactions.map((i) => (
            <div key={i.id} className="rounded-[9px] border border-border bg-bg-card px-3.5 py-2 text-[13px]">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-navy">{i.canal}</span>
                <div className="flex items-center gap-3 text-[11.5px] text-text-muted">
                  <span>{fmtDate(i.created_at)}</span>
                  <button onClick={() => removeInteraction(i.id)} className="text-danger hover:underline">
                    Supprimer
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-line text-text-dark">{i.resume}</div>
            </div>
          ))}
          {interactions.length === 0 && <div className="rounded-[9px] border border-border bg-bg-card p-5 text-center text-text-muted">Aucun échange enregistré.</div>}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12.5px] font-semibold text-text-muted">Documents envoyés</div>
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold hover:bg-bg-sunken">
            {isPending ? "Envoi…" : "+ Ajouter"}
            <input ref={inputRef} type="file" onChange={handleUpload} disabled={isPending} className="hidden" />
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-[9px] border border-border bg-bg-card px-3.5 py-2">
              <button onClick={() => openFile(a)} className="text-[13px] font-medium text-blue hover:underline">
                📎 {a.nom}
              </button>
              <div className="flex items-center gap-3 text-[11.5px] text-text-muted">
                <span>{fmtDate(a.created_at)}</span>
                <button onClick={() => removeFile(a.id)} className="text-danger hover:underline">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          {attachments.length === 0 && <div className="rounded-[9px] border border-border bg-bg-card p-5 text-center text-text-muted">Aucun document envoyé.</div>}
        </div>
      </div>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-text-muted">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-[14px] focus:border-blue focus:outline-none"
        />
      )}
    </div>
  );
}
