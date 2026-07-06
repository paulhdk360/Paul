import { createClient } from "@/lib/supabase/server";
import { DataMigration } from "@/components/DataMigration";
import { UserManagement } from "@/components/UserManagement";
import type { Profile } from "@/lib/supabase/types";

export default async function ParametresPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();

  let profiles: Profile[] = [];
  if (myProfile?.role === "admin") {
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    profiles = (data ?? []) as Profile[];
  }

  return (
    <div className="flex flex-col gap-5.5">
      <div>
        <div className="font-display text-[30px] font-bold tracking-wide">Paramètres</div>
        <div className="text-[13.5px] text-text-muted">
          Connecté en tant que {user?.email} — {myProfile?.role === "admin" ? "Administrateur" : "Utilisateur"}
        </div>
      </div>
      <DataMigration />
      {myProfile?.role === "admin" && user && <UserManagement profiles={profiles} currentUserId={user.id} />}
    </div>
  );
}
