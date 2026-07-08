import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import type { AppNotification } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser();

  let notifications: AppNotification[] = [];
  if (profile.role !== "operateur") {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    notifications = (data ?? []) as AppNotification[];
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen max-md:flex-col">
        <Sidebar userEmail={user.email ?? null} role={profile.role} notifications={notifications} />
        <main className="flex-1 overflow-x-hidden p-6 max-md:p-4">{children}</main>
      </div>
    </ToastProvider>
  );
}
