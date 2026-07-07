import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser();

  return (
    <ToastProvider>
      <div className="flex min-h-screen max-md:flex-col">
        <Sidebar userEmail={user.email ?? null} role={profile.role} />
        <main className="flex-1 overflow-x-hidden p-6 max-md:p-4">{children}</main>
      </div>
    </ToastProvider>
  );
}
