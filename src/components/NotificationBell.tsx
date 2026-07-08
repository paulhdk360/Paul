"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import type { AppNotification } from "@/lib/types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function NotificationBell({ notifications }: { notifications: AppNotification[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.lu).length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function openNotification(n: AppNotification) {
    if (!n.lu) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        router.refresh();
      });
    }
    setOpen(false);
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative mb-3 px-0.5 max-md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex w-full items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-[13px] font-medium text-text-muted hover:bg-bg-sunken"
      >
        🔔 Notifications
        {unreadCount > 0 && (
          <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-[10.5px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-[300px] rounded-lg border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-[12.5px] font-semibold text-navy">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAll} className="text-[11px] font-semibold text-blue hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => openNotification(n)}
                className={`block border-b border-border/60 px-3 py-2.5 text-[12.5px] last:border-b-0 hover:bg-bg-sunken ${!n.lu ? "bg-blue/5" : ""}`}
              >
                <div className={!n.lu ? "font-semibold text-text-dark" : "text-text-dark"}>{n.message}</div>
                <div className="mt-0.5 text-[11px] text-text-muted">{timeAgo(n.created_at)}</div>
              </Link>
            ))}
            {notifications.length === 0 && <div className="p-6 text-center text-[12px] text-text-muted">Aucune notification.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
