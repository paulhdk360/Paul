"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateProfileRole } from "@/actions/admin";
import { useToast } from "@/components/Toast";
import { ROLE_LABELS, ROLES } from "@/lib/company";
import type { Profile, Role } from "@/lib/types";

export function UserManagement({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(id: string, role: Role) {
    startTransition(async () => {
      try {
        await updateProfileRole(id, role);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de la mise à jour du rôle.");
      }
    });
  }

  return (
    <div className="rounded-[10px] border border-border bg-bg-card p-5">
      <h3 className="mb-2 font-display text-[18px] font-semibold text-navy">Utilisateurs</h3>
      <p className="mb-4 text-[13px] text-text-muted">
        Créez de nouveaux comptes depuis le tableau de bord Supabase (Authentication → Users → Invite). Gérez ici le
        rôle de chaque utilisateur.
      </p>
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {["Email", "Rôle"].map((h) => (
              <th key={h} className="border-b border-border px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">
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
                  onChange={(e) => handleRoleChange(p.id, e.target.value as Role)}
                  className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[13px] focus:border-blue focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
