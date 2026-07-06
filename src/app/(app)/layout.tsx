import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ToastProvider>
      <div className="flex min-h-screen max-md:flex-col">
        <Sidebar userEmail={user?.email ?? null} />
        <main className="flex-1 overflow-x-auto p-7 max-md:p-4">{children}</main>
      </div>
    </ToastProvider>
  );
}
