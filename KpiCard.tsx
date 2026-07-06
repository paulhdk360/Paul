"use client";

import { useTransition } from "react";
import { updateProfileRole } from "@/actions/admin";
import { useToast } from "@/components/Toast";
import type { Profile } from "@/lib/supabase/types";

export function UserManagement({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleRoleChange(id: string, role: "admin" | "user") {
    startTransition(async () => {
      try {
        await updateProfileRole(id, role);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la mise à jour du rôle.");
      }
    });
  }

  return (
    <div className="rounded-[10px] border border-border bg-bg-card p-5">
      <h3 className="mb-2 font-display text-[19px] font-semibold">Utilisateurs</h3>
      <p className="mb-4 text-[13px] text-text-muted">
        Créez de nouveaux comptes depuis le tableau de bord Supabase (Authentication → Users → Invite). Gérez ici le
        rôle de chaque utilisateur.
      </p>
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {["Email", "Rôle"].map((h) => (
              <th
                key={h}
                className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td className="border-b border-border/50 px-3 py-2.5">
                {p.email} {p.id === currentUserId && <span className="text-text-muted">(vous)</span>}
              </td>
              <td className="border-b border-border/50 px-3 py-2.5">
                <select
                  value={p.role}
                  disabled={isPending}
                  onChange={(e) => handleRoleChange(p.id, e.target.value as "admin" | "user")}
                  className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[13px] focus:border-accent-bright focus:outline-none"
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
