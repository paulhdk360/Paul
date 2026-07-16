import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationPopups } from "@/components/NotificationPopups";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import type { AppNotification } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser();

  let notifications: AppNotification[] = [];
  let unreadMessages = 0;
  if (profile.role !== "operateur") {
    const supabase = createClient();
    const [{ data }, { count }] = await Promise.all([
      supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("to_user_id", user.id).eq("lu", false),
    ]);
    notifications = (data ?? []) as AppNotification[];
    unreadMessages = count ?? 0;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen max-md:flex-col">
        <Sidebar userEmail={user.email ?? null} role={profile.role} notifications={notifications} unreadMessages={unreadMessages} />
        <main className="flex-1 overflow-x-hidden p-6 max-md:p-4">{children}</main>
      </div>
      <NotificationPopups notifications={notifications} />
    </ToastProvider>
  );
}
