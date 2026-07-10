"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDevisLigne, deleteDevisLigne, insertForfaitTemplate, updateDevis, updateDevisLigne } from "@/actions/devis";
import { addDevisComment } from "@/actions/devisComments";
import { notifyUser } from "@/actions/notifications";
import { generateToolListFromDevis } from "@/actions/toolList";
import { DiametreWarning } from "@/components/DiametreWarning";
import { OutilPicker } from "@/components/OutilPicker";
import { useToast } from "@/components/Toast";
import { CONDITIONS_GENERALES, DEVIS_STATUTS, TYPES_ACTIVITE } from "@/lib/company";
import { fmtDate, fmtEUR } from "@/lib/format";
import { computeDevisTotals } from "@/lib/devis";
import { FORFAIT_TEMPLATES } from "@/lib/forfaitTemplates";
import { generateDevisPdf } from "@/lib/pdf/devisPdf";
import type { Affaire, CatalogueOutil, Client, Contact, Devis, DevisCommentaire, DevisLigne, LigneType, Profile } from "@/lib/types";

const PHYSICAL_TYPES: LigneType[] = ["Operation", "Stand By", "Maintenance", "Inspection", "Restocking", "Lost In Hole"];
const AUTRES_TYPES: LigneType[] = ["Serrage", "Personnel"];

type Tab = "equipement" | "transport" | "autres" | "vente" | "packaging" | "forfait";

export function DevisEditor({
  affaire,
  client,
  contacts,
  devis,
  initialLignes,
  outils,
  profiles,
  currentUserId,
  initialCommentaires,
}: {
  affaire: Affaire;
  client: Client | null;
  contacts: Contact[];
  devis: Devis;
  initialLignes: DevisLigne[];
  outils: CatalogueOutil[];
  profiles: Profile[];
  currentUserId: string;
  initialCommentaires: DevisCommentaire[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isVente = affaire.type_transaction === "Vente";
  const isForfait = !isVente && affaire.type_devis === "Forfait";
  const [header, setHeader] = useState(devis);
  const [lignes, setLignes] = useState(initialLignes);
  const [genLog, setGenLog] = useState<string[] | null>(null);
  const [tab, setTab] = useState<Tab>(isVente ? "vente" : "equipement");
  const [showTemplates, setShowTemplates] = useState(false);
  const [notifyTo, setNotifyTo] = useState("");
  const [commentaires, setCommentaires] = useState(initialCommentaires);
  const [commentText, setCommentText] = useState("");
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const otherProfiles = profiles.filter((p) => p.id !== currentUserId && p.role !== "operateur");

  function saveHeader(patch: Partial<Devis>) {
    const next = { ...header, ...patch };
    setHeader(next);
    startTransition(async () => {
      try {
        await updateDevis(devis.id, affaire.id, patch);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function notify() {
    if (!notifyTo) {
      showToast("Choisissez un destinataire.");
      return;
    }
    startTransition(async () => {
      try {
        await notifyUser(
          notifyTo,
          `Devis ${header.reference} (${header.version}) prêt à vérifier — affaire ${affaire.reference}`,
          `/affaires/${affaire.id}/devis/${devis.id}`,
        );
        showToast("Notification envoyée.");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'envoi de la notification.");
      }
    });
  }

  function sendComment() {
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    startTransition(async () => {
      try {
        const row = await addDevisComment(devis.id, affaire.id, text);
        if (row) setCommentaires((prev) => [...prev, row as DevisCommentaire]);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'envoi du commentaire.");
      }
    });
  }

  function patchLigne(id: string, patch: Partial<DevisLigne>) {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    startTransition(async () => {
      try {
        await updateDevisLigne(id, patch);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement de la ligne.");
      }
    });
  }

  function addLigne(defaultType: LigneType) {
    startTransition(async () => {
      try {
        const row = await createDevisLigne(devis.id, lignes.length, defaultType);
        setLignes((prev) => [...prev, row]);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'ajout de la ligne.");
      }
    });
  }

  function removeLigne(id: string) {
    setLignes((prev) => prev.filter((l) => l.id !== id));
    startTransition(async () => {
      try {
        await deleteDevisLigne(id, affaire.id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  function generateToolList() {
    startTransition(async () => {
      try {
        const log = await generateToolListFromDevis(devis.id, affaire.id);
        setGenLog(log.length ? log : ["Tool List déjà à jour."]);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la génération de la Tool List.");
      }
    });
  }

  function insertTemplate(key: string) {
    setShowTemplates(false);
    startTransition(async () => {
      try {
        const rows = await insertForfaitTemplate(devis.id, affaire.id, key);
        setLignes((prev) => [...prev, ...rows]);
        showToast(`${rows.length} ligne(s) insérée(s) depuis la trame.`);
        setTab("equipement");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'insertion de la trame.");
      }
    });
  }

  const equipementLignes = lignes.filter((l) => PHYSICAL_TYPES.includes(l.type));
  const transportLignes = lignes.filter((l) => l.type === "Transport");
  const autresLignes = lignes.filter((l) => AUTRES_TYPES.includes(l.type));
  const venteLignes = lignes.filter((l) => l.type === "Vente");
  const packagingLignes = lignes.filter((l) => l.type === "Packaging");
  const forfaitLignes = lignes.filter((l) => l.type === "Forfait");
  const totals = computeDevisTotals(lignes, header.tva);

  return (
    <div>
      <div className="mb-5 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1">
        <TextField label="Référence" value={header.reference} onBlurSave={(v) => saveHeader({ reference: v })} />
        <TextField label="Version" value={header.version} onBlurSave={(v) => saveHeader({ version: v })} />
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Statut</label>
          <select
            value={header.statut}
            onChange={(e) => saveHeader({ statut: e.target.value as Devis["statut"] })}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
          >
            {DEVIS_STATUTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {header.statut === "À confirmer" && (
          <div className="col-span-4 flex flex-wrap items-end gap-2 rounded-lg border border-blue/30 bg-blue/5 p-3 max-[900px]:col-span-2 max-[500px]:col-span-1">
            <div className="flex-1">
              <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Notifier un collègue</label>
              <select
                value={notifyTo}
                onChange={(e) => setNotifyTo(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
              >
                <option value="">— Choisir —</option>
                {otherProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.email}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={notify}
              disabled={isPending}
              className="rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              Notifier — devis à vérifier
            </button>
          </div>
        )}
        <TextField
          label="Validité (jours)"
          value={String(header.validite_jours)}
          type="number"
          onBlurSave={(v) => saveHeader({ validite_jours: Number(v) || 0 })}
        />
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Contact</label>
          {contacts.length > 0 ? (
            <select
              value={header.contact_id ?? ""}
              onChange={(e) => saveHeader({ contact_id: e.target.value || null })}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
            >
              <option value="">—</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom ? `${c.prenom} ` : ""}
                  {c.nom}
                  {c.fonction ? ` (${c.fonction})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <TextField label="" value={header.contact ?? ""} onBlurSave={(v) => saveHeader({ contact: v })} />
          )}
        </div>
        <TextField label="Établi par" value={header.established_by ?? ""} onBlurSave={(v) => saveHeader({ established_by: v })} />
        <TextField label="Incoterm" value={header.incoterm ?? ""} onBlurSave={(v) => saveHeader({ incoterm: v })} />
        <TextField
          label="Conditions de paiement"
          value={header.payment_terms ?? ""}
          onBlurSave={(v) => saveHeader({ payment_terms: v })}
        />
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Type d&apos;activité</label>
          <select
            value={header.type_activite ?? ""}
            onChange={(e) => saveHeader({ type_activite: (e.target.value || null) as Devis["type_activite"] })}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
          >
            <option value="">—</option>
            {TYPES_ACTIVITE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Type d&apos;affaire</label>
          <div className="flex h-[38px] items-center gap-1.5">
            <span className="rounded-full border border-navy/30 bg-navy/5 px-3 py-1 text-[12.5px] font-semibold text-navy">
              {affaire.type_transaction ?? "Location"}
            </span>
            {isForfait && (
              <span className="rounded-full border border-blue/30 bg-blue/5 px-3 py-1 text-[12.5px] font-semibold text-blue">Forfait</span>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Suivi interne</label>
          <label className="flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-[13px] font-medium">
            <input
              type="checkbox"
              checked={header.bon_commande_recu}
              onChange={(e) => saveHeader({ bon_commande_recu: e.target.checked })}
            />
            Bon de commande reçu
          </label>
        </div>
        <TextField
          label="Période prévisionnelle — début"
          type="date"
          value={header.periode_prevue_debut ?? ""}
          onBlurSave={(v) => saveHeader({ periode_prevue_debut: v || null })}
        />
        <TextField
          label="Période prévisionnelle — fin"
          type="date"
          value={header.periode_prevue_fin ?? ""}
          onBlurSave={(v) => saveHeader({ periode_prevue_fin: v || null })}
        />
        <div className="col-span-2 flex items-end max-[500px]:col-span-1">
          <p className="text-[11px] text-text-muted">
            Estimation approximative de la période de mobilisation du matériel, même si l&apos;affaire n&apos;est pas
            encore confirmée — alimente le Planning matériel pour visualiser le stock engagé sur l&apos;année.
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {!isVente && (
            <>
              <TabButton label={`Équipement (${equipementLignes.length})`} active={tab === "equipement"} onClick={() => setTab("equipement")} />
              {isForfait && (
                <TabButton label={`Forfait (${forfaitLignes.length})`} active={tab === "forfait"} onClick={() => setTab("forfait")} />
              )}
              <TabButton label={`Transport (${transportLignes.length})`} active={tab === "transport"} onClick={() => setTab("transport")} />
              <TabButton label={`Autres prestations (${autresLignes.length})`} active={tab === "autres"} onClick={() => setTab("autres")} />
            </>
          )}
          {isVente && (
            <>
              <TabButton label={`Vente (${venteLignes.length})`} active={tab === "vente"} onClick={() => setTab("vente")} />
              <TabButton label={`Transport (${transportLignes.length})`} active={tab === "transport"} onClick={() => setTab("transport")} />
              <TabButton label={`Packaging (${packagingLignes.length})`} active={tab === "packaging"} onClick={() => setTab("packaging")} />
            </>
          )}
        </div>
        <div className="flex gap-2">
          {isForfait && (
            <div className="relative">
              <button
                onClick={() => setShowTemplates((v) => !v)}
                disabled={isPending}
                className="rounded-lg border border-blue/40 bg-blue/5 px-3 py-2 text-[12.5px] font-semibold text-navy hover:bg-blue/10 disabled:opacity-60"
              >
                📋 Insérer une trame
              </button>
              {showTemplates && (
                <div className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-border bg-white p-1.5 shadow-lg">
                  {FORFAIT_TEMPLATES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => insertTemplate(t.key)}
                      className="block w-full rounded-md px-3 py-2 text-left text-[12.5px] font-medium text-text-dark hover:bg-bg-sunken"
                    >
                      {t.label}
                      <span className="ml-1 text-[11px] text-text-muted">({t.lignes.length} lignes)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={async () => {
              try {
                const contact = contacts.find((c) => c.id === header.contact_id);
                const contactName = contact ? `${contact.prenom ? `${contact.prenom} ` : ""}${contact.nom}` : null;
                await generateDevisPdf(header, lignes, affaire, client, contactName);
              } catch (e) {
                showToast(e instanceof Error ? e.message : "Échec de la génération du PDF.");
              }
            }}
            className="rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold hover:bg-bg-sunken"
          >
            Télécharger le PDF
          </button>
          <button
            onClick={generateToolList}
            disabled={isPending}
            className="rounded-lg bg-blue px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-navy disabled:opacity-60"
          >
            Générer / mettre à jour la Tool List
          </button>
        </div>
      </div>

      {genLog && (
        <div className="mb-3 rounded-lg border border-blue/30 bg-blue/5 p-3 text-[12.5px] text-navy">
          {genLog.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}

      {!isVente && tab === "equipement" && (
        <>
          <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
            <table className="w-full min-w-[1590px] text-[12.5px]">
              <thead>
                <tr className="bg-bg-sunken">
                  {[
                    "N°",
                    "Désignation",
                    "Outil catalogue",
                    "Qté",
                    "Stand-By €/j",
                    "Operation €/j",
                    "UC €/item",
                    "LIH €/item",
                    "Inspection €",
                    "Restocking €",
                    "Serrage €",
                    "Forfait €",
                    "Tool List",
                    "",
                  ].map((h) => (
                    <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipementLignes.map((l, i) => (
                  <tr key={l.id} className="align-top hover:bg-bg-sunken/50">
                    <td className="border-b border-border/60 px-2.5 py-2 text-center text-text-muted">{i + 1}</td>
                    <td className="border-b border-border/60 px-2.5 py-2">
                      <textarea
                        defaultValue={l.designation}
                        onBlur={(e) => patchLigne(l.id, { designation: e.target.value })}
                        rows={2}
                        className="w-[220px] rounded border border-border px-1.5 py-1 text-[12px]"
                      />
                    </td>
                    <td className="border-b border-border/60 px-2.5 py-2">
                      <OutilPicker outils={outils} value={l.outil_id} onSelect={(id) => patchLigne(l.id, { outil_id: id })} />
                      {l.outil_id && (
                        <input
                          defaultValue={l.diametre_souhaite ?? ""}
                          onBlur={(e) => patchLigne(l.id, { diametre_souhaite: e.target.value })}
                          placeholder="Diamètre souhaité"
                          className="mt-1 w-[130px] rounded border border-border px-1.5 py-1 text-[11px]"
                        />
                      )}
                      <DiametreWarning outilId={l.outil_id} diametreSouhaite={l.diametre_souhaite} outils={outils} />
                    </td>
                    <NumCell value={l.quantite} onSave={(v) => patchLigne(l.id, { quantite: v })} />
                    <NumCell value={l.prix_stand_by} onSave={(v) => patchLigne(l.id, { prix_stand_by: v })} />
                    <NumCell value={l.prix_operation} onSave={(v) => patchLigne(l.id, { prix_operation: v })} />
                    <NumCell value={l.prix_uc} onSave={(v) => patchLigne(l.id, { prix_uc: v })} />
                    <NumCell value={l.prix_lih} onSave={(v) => patchLigne(l.id, { prix_lih: v })} />
                    <NumCell value={l.prix_inspection} onSave={(v) => patchLigne(l.id, { prix_inspection: v })} />
                    <NumCell value={l.prix_restocking} onSave={(v) => patchLigne(l.id, { prix_restocking: v })} />
                    <NumCell value={l.prix_serrage} onSave={(v) => patchLigne(l.id, { prix_serrage: v })} />
                    <NumCell value={l.prix_forfait} onSave={(v) => patchLigne(l.id, { prix_forfait: v })} />
                    <td className="border-b border-border/60 px-2.5 py-2 text-center">
                      <input
                        type="checkbox"
                        defaultChecked={l.inclure_tool_list}
                        onChange={(e) => patchLigne(l.id, { inclure_tool_list: e.target.checked })}
                      />
                    </td>
                    <td className="border-b border-border/60 px-2.5 py-2">
                      <button onClick={() => removeLigne(l.id)} className="text-danger hover:underline">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {equipementLignes.length === 0 && (
                  <tr>
                    <td colSpan={14} className="p-8 text-center text-text-muted">
                      Aucune ligne équipement. Cliquez sur « + Ligne » pour commencer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11.5px] text-text-muted">
            La case « Tool List » contrôle si la ligne est reprise lors de la génération de la Tool List — elle
            n&apos;apparaît jamais sur le PDF envoyé au client. « Outil catalogue » lie la ligne à sa vraie référence
            catalogue, indépendamment du texte de la désignation (utile si le client demande une désignation
            différente de celle enregistrée, ex. « 17&quot; OD » sur le devis pour un outil catalogué en 17-1/2&quot;) —
            ce lien réserve automatiquement la référence pour cette affaire.
          </p>
          <button
            onClick={() => addLigne("Operation")}
            disabled={isPending}
            className="mt-2.5 rounded-lg bg-navy px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            + Ligne équipement
          </button>
        </>
      )}

      {!isVente && tab === "transport" && (
        <SimpleLignesTable
          lignes={transportLignes}
          typeOptions={null}
          onAdd={() => addLigne("Transport")}
          onPatch={patchLigne}
          onRemove={removeLigne}
          addLabel="+ Ligne de transport"
          emptyLabel="Aucune ligne de transport."
        />
      )}

      {!isVente && tab === "autres" && (
        <SimpleLignesTable
          lignes={autresLignes}
          typeOptions={AUTRES_TYPES}
          onAdd={() => addLigne("Serrage")}
          onPatch={patchLigne}
          onRemove={removeLigne}
          addLabel="+ Autre prestation"
          emptyLabel="Aucune autre prestation (serrage / desserrage, personnel...)."
          showToolListToggle
        />
      )}

      {!isVente && isForfait && tab === "forfait" && (
        <SimpleLignesTable
          lignes={forfaitLignes}
          typeOptions={null}
          onAdd={() => addLigne("Forfait")}
          onPatch={patchLigne}
          onRemove={removeLigne}
          addLabel="+ Ligne forfait"
          emptyLabel="Aucune ligne forfait. Utilisez « Insérer une trame » ou ajoutez une ligne manuellement."
        />
      )}

      {isVente && tab === "vente" && (
        <SimpleLignesTable
          lignes={venteLignes}
          typeOptions={null}
          onAdd={() => addLigne("Vente")}
          onPatch={patchLigne}
          onRemove={removeLigne}
          addLabel="+ Ligne de vente"
          emptyLabel="Aucune ligne de vente."
        />
      )}

      {isVente && tab === "transport" && (
        <SimpleLignesTable
          lignes={transportLignes}
          typeOptions={null}
          onAdd={() => addLigne("Transport")}
          onPatch={patchLigne}
          onRemove={removeLigne}
          addLabel="+ Ligne de transport"
          emptyLabel="Aucune ligne de transport."
        />
      )}

      {isVente && tab === "packaging" && (
        <SimpleLignesTable
          lignes={packagingLignes}
          typeOptions={null}
          onAdd={() => addLigne("Packaging")}
          onPatch={patchLigne}
          onRemove={removeLigne}
          addLabel="+ Ligne de packaging"
          emptyLabel="Aucune ligne de packaging."
        />
      )}

      {(isVente || isForfait) && (
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-[10px] border border-border bg-bg-card p-4">
          <div className="w-[160px]">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">TVA (%)</label>
            <input
              type="number"
              step="0.01"
              defaultValue={header.tva}
              onBlur={(e) => saveHeader({ tva: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
            />
          </div>
          <div className="flex gap-6 text-[13.5px]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Total HT</div>
              <div className="font-mono text-[17px] font-semibold text-text-dark">{fmtEUR(totals.ht)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">TVA</div>
              <div className="font-mono text-[17px] font-semibold text-text-dark">{fmtEUR(totals.tva)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Total TTC</div>
              <div className="font-mono text-[19px] font-bold text-navy">{fmtEUR(totals.ttc)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Remarques commerciales</label>
          <textarea
            defaultValue={header.remarques_commerciales ?? ""}
            onBlur={(e) => saveHeader({ remarques_commerciales: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">Conditions particulières</label>
          <textarea
            defaultValue={header.conditions_particulieres ?? ""}
            onBlur={(e) => saveHeader({ conditions_particulieres: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">
          Conditions générales <span className="font-normal normal-case text-text-muted/70">(fixes, incluses automatiquement sur le PDF)</span>
        </label>
        <div className="whitespace-pre-line rounded-lg border border-border bg-bg-sunken px-3 py-2.5 text-[12px] text-text-muted">
          {CONDITIONS_GENERALES}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2.5 font-display text-[17px] font-semibold text-navy">Commentaires</div>
        <div className="mb-3 flex flex-col gap-2.5 rounded-[10px] border border-border bg-bg-card p-3.5">
          {commentaires.map((c) => {
            const auteur = c.auteur_id ? profileById.get(c.auteur_id) : undefined;
            return (
              <div key={c.id} className="rounded-lg bg-bg-sunken px-3 py-2 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy">{auteur?.full_name ?? auteur?.email ?? "—"}</span>
                  <span className="text-[11px] text-text-muted">{fmtDate(c.created_at)}</span>
                </div>
                <div className="mt-0.5 whitespace-pre-line text-text-dark">{c.message}</div>
              </div>
            );
          })}
          {commentaires.length === 0 && <div className="p-3 text-center text-[12.5px] text-text-muted">Aucun commentaire.</div>}
        </div>
        <div className="flex gap-2">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Écrire un commentaire…"
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
          />
          <button
            onClick={sendComment}
            disabled={isPending || !commentText.trim()}
            className="self-end rounded-lg bg-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        active ? "bg-navy text-white" : "border border-border text-text-muted hover:bg-bg-sunken hover:text-text-dark"
      }`}
    >
      {label}
    </button>
  );
}

function SimpleLignesTable({
  lignes,
  typeOptions,
  onAdd,
  onPatch,
  onRemove,
  addLabel,
  emptyLabel,
  showToolListToggle,
}: {
  lignes: DevisLigne[];
  typeOptions: LigneType[] | null;
  onAdd: () => void;
  onPatch: (id: string, patch: Partial<DevisLigne>) => void;
  onRemove: (id: string) => void;
  addLabel: string;
  emptyLabel: string;
  showToolListToggle?: boolean;
}) {
  const columnCount = (typeOptions ? 1 : 0) + (showToolListToggle ? 1 : 0) + 5;
  return (
    <>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[640px] text-[12.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {[...(typeOptions ? ["Type"] : []), "Désignation", "Qté", "Prix unitaire €", "Total", ...(showToolListToggle ? ["Tool List"] : []), ""].map(
                (h) => (
                  <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-text-muted">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.id} className="align-top hover:bg-bg-sunken/50">
                {typeOptions && (
                  <td className="border-b border-border/60 px-2.5 py-2">
                    <select
                      value={l.type}
                      onChange={(e) => onPatch(l.id, { type: e.target.value as LigneType })}
                      className="w-[110px] rounded border border-border px-1.5 py-1 text-[12px]"
                    >
                      {typeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="border-b border-border/60 px-2.5 py-2">
                  <textarea
                    defaultValue={l.designation}
                    onBlur={(e) => onPatch(l.id, { designation: e.target.value })}
                    rows={2}
                    className="w-[260px] rounded border border-border px-1.5 py-1 text-[12px]"
                  />
                </td>
                <NumCell value={l.quantite} onSave={(v) => onPatch(l.id, { quantite: v })} />
                <NumCell value={l.prix_forfait} onSave={(v) => onPatch(l.id, { prix_forfait: v })} />
                <td className="border-b border-border/60 px-2.5 py-2 font-mono font-semibold text-navy">
                  {fmtEUR((l.prix_forfait || 0) * (l.quantite || 0))}
                </td>
                {showToolListToggle && (
                  <td className="border-b border-border/60 px-2.5 py-2 text-center">
                    <input
                      type="checkbox"
                      defaultChecked={l.inclure_tool_list}
                      onChange={(e) => onPatch(l.id, { inclure_tool_list: e.target.checked })}
                    />
                  </td>
                )}
                <td className="border-b border-border/60 px-2.5 py-2">
                  <button onClick={() => onRemove(l.id)} className="text-danger hover:underline">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="p-8 text-center text-text-muted">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button onClick={onAdd} className="mt-2.5 rounded-lg bg-navy px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-dark">
        {addLabel}
      </button>
    </>
  );
}

function TextField({
  label,
  value,
  onBlurSave,
  type = "text",
}: {
  label: string;
  value: string;
  onBlurSave: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-text-muted">{label}</label>
      <input
        type={type}
        defaultValue={value}
        onBlur={(e) => onBlurSave(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-[13.5px] focus:border-blue focus:outline-none"
      />
    </div>
  );
}

function NumCell({
  value,
  onSave,
  disabled,
}: {
  value: number | null;
  onSave: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <td className="border-b border-border/60 px-2.5 py-2">
      <input
        type="number"
        step="0.01"
        defaultValue={value ?? ""}
        disabled={disabled}
        onBlur={(e) => onSave(e.target.value ? Number(e.target.value) : 0)}
        className="w-[74px] rounded border border-border px-1.5 py-1 text-[12px] disabled:bg-bg-sunken disabled:text-text-muted"
      />
    </td>
  );
}
