"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClientRecord, deleteClientRecord, updateClientRecord } from "@/actions/clients";
import { createContact, deleteContact, updateContact } from "@/actions/contacts";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import type { Client, Contact } from "@/lib/types";

const EMPTY_CLIENT: Partial<Client> = {
  raison_sociale: "",
  adresse: "",
  pays: "",
  numero_tva: "",
  telephone_general: "",
  email_general: "",
};

const EMPTY_CONTACT: Partial<Contact> = {
  nom: "",
  prenom: "",
  fonction: "",
  telephone_fixe: "",
  telephone_mobile: "",
  email: "",
  site_chantier: "",
  observations: "",
};

export function ClientsManager({ clients, contacts }: { clients: Client[]; contacts: Contact[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState<Partial<Client>>(EMPTY_CLIENT);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState<Partial<Contact>>(EMPTY_CONTACT);
  const [contactModalClientId, setContactModalClientId] = useState<string | null>(null);

  function openCreateClient() {
    setEditingClient(null);
    setClientForm(EMPTY_CLIENT);
    setClientModalOpen(true);
  }

  function openEditClient(c: Client) {
    setEditingClient(c);
    setClientForm(c);
    setClientModalOpen(true);
  }

  function submitClient() {
    if (!clientForm.raison_sociale) {
      showToast("La raison sociale est requise.");
      return;
    }
    startTransition(async () => {
      try {
        if (editingClient) {
          await updateClientRecord(editingClient.id, clientForm);
        } else {
          await createClientRecord(clientForm);
        }
        setClientModalOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function removeClient(id: string) {
    if (!confirm("Supprimer ce client et tous ses contacts ?")) return;
    startTransition(async () => {
      try {
        await deleteClientRecord(id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  function openCreateContact(clientId: string) {
    setEditingContact(null);
    setContactForm(EMPTY_CONTACT);
    setContactModalClientId(clientId);
  }

  function openEditContact(c: Contact) {
    setEditingContact(c);
    setContactForm(c);
    setContactModalClientId(c.client_id);
  }

  function submitContact() {
    if (!contactForm.nom || !contactModalClientId) {
      showToast("Le nom du contact est requis.");
      return;
    }
    startTransition(async () => {
      try {
        if (editingContact) {
          await updateContact(editingContact.id, contactForm);
        } else {
          await createContact(contactModalClientId, contactForm);
        }
        setContactModalClientId(null);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement du contact.");
      }
    });
  }

  function removeContact(id: string) {
    if (!confirm("Supprimer ce contact ?")) return;
    startTransition(async () => {
      try {
        await deleteContact(id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Clients</div>
      <div className="mb-6 text-[13.5px] text-text-muted">{clients.length} société(s) enregistrée(s)</div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreateClient}
          className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouveau client
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {clients.map((c) => {
          const clientContacts = contacts.filter((ct) => ct.client_id === c.id);
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="rounded-[9px] border border-border bg-bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <div className="text-[14.5px] font-semibold text-navy">{c.raison_sociale}</div>
                  <div className="mt-0.5 text-[12.5px] text-text-muted">
                    {c.pays || "Pays non renseigné"}
                    {c.telephone_general ? ` · ${c.telephone_general}` : ""}
                    {c.email_general ? ` · ${c.email_general}` : ""}
                    {` · ${clientContacts.length} contact(s)`}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setExpanded(isOpen ? null : c.id)}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-sunken"
                  >
                    {isOpen ? "Fermer" : "Contacts"}
                  </button>
                  <button onClick={() => openEditClient(c)} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-sunken">
                    Modifier
                  </button>
                  <button
                    onClick={() => removeClient(c.id)}
                    className="rounded-lg border border-danger/40 px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3.5 border-t border-border pt-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[12.5px] font-semibold text-text-muted">Interlocuteurs</div>
                    <button
                      onClick={() => openCreateContact(c.id)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-bg-sunken"
                    >
                      + Contact
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-[12.5px]">
                      <thead>
                        <tr className="bg-bg-sunken">
                          {["Nom", "Fonction", "Téléphone", "Email", "Site / Chantier", ""].map((h) => (
                            <th key={h} className="border-b border-border px-2.5 py-2 text-left text-[10.5px] font-semibold uppercase text-text-muted">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clientContacts.map((ct) => (
                          <tr key={ct.id}>
                            <td className="border-b border-border/60 px-2.5 py-1.5">
                              {ct.prenom ? `${ct.prenom} ` : ""}
                              {ct.nom}
                            </td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">{ct.fonction || "—"}</td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">
                              {ct.telephone_mobile || ct.telephone_fixe || "—"}
                            </td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">{ct.email || "—"}</td>
                            <td className="border-b border-border/60 px-2.5 py-1.5">{ct.site_chantier || "—"}</td>
                            <td className="border-b border-border/60 px-2.5 py-1.5 text-right">
                              <button onClick={() => openEditContact(ct)} className="mr-2 text-blue hover:underline">
                                Modifier
                              </button>
                              <button onClick={() => removeContact(ct.id)} className="text-danger hover:underline">
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                        {clientContacts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-text-muted">
                              Aucun contact. Cliquez sur « + Contact » pour en ajouter un.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {clients.length === 0 && (
          <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">
            Aucun client. Cliquez sur « Nouveau client » pour commencer.
          </div>
        )}
      </div>

      {clientModalOpen && (
        <Modal title={editingClient ? "Modifier le client" : "Nouveau client"} onClose={() => setClientModalOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <Field label="Raison sociale" value={clientForm.raison_sociale ?? ""} onChange={(v) => setClientForm({ ...clientForm, raison_sociale: v })} />
            <Field label="Adresse" value={clientForm.adresse ?? ""} onChange={(v) => setClientForm({ ...clientForm, adresse: v })} textarea />
            <Field label="Pays" value={clientForm.pays ?? ""} onChange={(v) => setClientForm({ ...clientForm, pays: v })} />
            <Field label="Numéro de TVA" value={clientForm.numero_tva ?? ""} onChange={(v) => setClientForm({ ...clientForm, numero_tva: v })} />
            <Field
              label="Téléphone général"
              value={clientForm.telephone_general ?? ""}
              onChange={(v) => setClientForm({ ...clientForm, telephone_general: v })}
            />
            <Field label="Email général" value={clientForm.email_general ?? ""} onChange={(v) => setClientForm({ ...clientForm, email_general: v })} />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setClientModalOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
                Annuler
              </button>
              <button
                onClick={submitClient}
                disabled={isPending}
                className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {contactModalClientId && (
        <Modal title={editingContact ? "Modifier le contact" : "Nouveau contact"} onClose={() => setContactModalClientId(null)}>
          <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
            <Field label="Nom" value={contactForm.nom ?? ""} onChange={(v) => setContactForm({ ...contactForm, nom: v })} />
            <Field label="Prénom" value={contactForm.prenom ?? ""} onChange={(v) => setContactForm({ ...contactForm, prenom: v })} />
            <Field label="Fonction" value={contactForm.fonction ?? ""} onChange={(v) => setContactForm({ ...contactForm, fonction: v })} />
            <Field label="Site / Chantier de rattachement" value={contactForm.site_chantier ?? ""} onChange={(v) => setContactForm({ ...contactForm, site_chantier: v })} />
            <Field label="Téléphone fixe" value={contactForm.telephone_fixe ?? ""} onChange={(v) => setContactForm({ ...contactForm, telephone_fixe: v })} />
            <Field label="Téléphone mobile" value={contactForm.telephone_mobile ?? ""} onChange={(v) => setContactForm({ ...contactForm, telephone_mobile: v })} />
            <Field label="Email" value={contactForm.email ?? ""} onChange={(v) => setContactForm({ ...contactForm, email: v })} />
          </div>
          <div className="mt-3.5">
            <Field label="Observations" value={contactForm.observations ?? ""} onChange={(v) => setContactForm({ ...contactForm, observations: v })} textarea />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setContactModalClientId(null)} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
              Annuler
            </button>
            <button
              onClick={submitContact}
              disabled={isPending}
              className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        </Modal>
      )}
    </div>
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
