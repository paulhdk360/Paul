"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClientRecord, deleteClientRecord, updateClientRecord } from "@/actions/clients";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import type { Client } from "@/lib/types";

const EMPTY: Partial<Client> = { nom: "", adresse_facturation: "", contact_nom: "", contact_email: "", contact_tel: "" };

export function ClientsManager({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<Client>>(EMPTY);
  const [open, setOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(c: Client) {
    setEditing(c);
    setForm(c);
    setOpen(true);
  }

  function submit() {
    if (!form.nom) {
      showToast("Le nom du client est requis.");
      return;
    }
    startTransition(async () => {
      try {
        if (editing) {
          await updateClientRecord(editing.id, form);
        } else {
          await createClientRecord(form);
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'enregistrement.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Supprimer ce client ?")) return;
    startTransition(async () => {
      try {
        await deleteClientRecord(id);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Clients</div>
      <div className="mb-6 text-[13.5px] text-text-muted">{clients.length} client(s) enregistré(s)</div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreate}
          className="rounded-lg bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-dark"
        >
          + Nouveau client
        </button>
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-border bg-bg-card">
        <table className="w-full min-w-[720px] text-[13.5px]">
          <thead>
            <tr className="bg-bg-sunken">
              {["Nom", "Contact", "Email", "Téléphone", ""].map((h) => (
                <th key={h} className="border-b border-border px-3.5 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-bg-sunken/50">
                <td className="border-b border-border/60 px-3.5 py-2.5 font-medium">{c.nom}</td>
                <td className="border-b border-border/60 px-3.5 py-2.5">{c.contact_nom || "—"}</td>
                <td className="border-b border-border/60 px-3.5 py-2.5">{c.contact_email || "—"}</td>
                <td className="border-b border-border/60 px-3.5 py-2.5">{c.contact_tel || "—"}</td>
                <td className="border-b border-border/60 px-3.5 py-2.5 text-right">
                  <button onClick={() => openEdit(c)} className="mr-2 text-blue hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => remove(c.id)} className="text-danger hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-muted">
                  Aucun client. Cliquez sur « Nouveau client » pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Modifier le client" : "Nouveau client"} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3.5">
            <Field label="Nom" value={form.nom ?? ""} onChange={(v) => setForm({ ...form, nom: v })} />
            <Field
              label="Adresse de facturation"
              value={form.adresse_facturation ?? ""}
              onChange={(v) => setForm({ ...form, adresse_facturation: v })}
              textarea
            />
            <Field label="Contact" value={form.contact_nom ?? ""} onChange={(v) => setForm({ ...form, contact_nom: v })} />
            <Field label="Email" value={form.contact_email ?? ""} onChange={(v) => setForm({ ...form, contact_email: v })} />
            <Field label="Téléphone" value={form.contact_tel ?? ""} onChange={(v) => setForm({ ...form, contact_tel: v })} />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-bg-sunken">
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={isPending}
                className="rounded-lg bg-navy px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
              >
                Enregistrer
              </button>
            </div>
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
