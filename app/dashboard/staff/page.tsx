import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { resolveActiveClub } from "@/lib/current-club";
import { STAFF_ROLES } from "@/lib/types";
import { NewStaffForm } from "./new-staff-form";

export default async function StaffPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  const activeClub = resolveActiveClub(current.clubs);
  if (!activeClub) redirect("/onboarding");

  const supabase = createClient();
  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, first_name, last_name, role_title, email, phone")
    .eq("club_id", activeClub.club_id)
    .order("last_name");

  const canManage = STAFF_ROLES.includes(activeClub.role);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Staff</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-4">Nom</th>
              <th className="py-2 pr-4">Fonction</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {staff?.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4 font-medium">
                  {s.first_name} {s.last_name}
                </td>
                <td className="py-2 pr-4">{s.role_title ?? "—"}</td>
                <td className="py-2 pr-4">{s.email ?? "—"}</td>
                <td className="py-2 pr-4">{s.phone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {staff?.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">Aucun membre du staff pour le moment.</p>
        )}
      </div>

      {canManage && (
        <div className="card">
          <h2 className="mb-4 text-lg font-medium">Ajouter un membre du staff</h2>
          <NewStaffForm clubId={activeClub.club_id} />
        </div>
      )}
    </div>
  );
}
