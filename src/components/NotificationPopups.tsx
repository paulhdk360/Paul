"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { markNotificationRead } from "@/actions/notifications";
import type { AppNotification } from "@/lib/types";

const STORAGE_KEY = "enedril_popped_notifications";
const AUTO_DISMISS_MS = 8000;

function loadShownIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveShownIds(ids: Set<string>) {
  try {
    // Capped so this never grows unbounded in localStorage over months of use.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-300)));
  } catch {
    // Private browsing / storage disabled — pop-ups just won't dedupe across reloads.
  }
}

// The bell only surfaces new notifications to someone who thinks to open it.
// This surfaces them proactively as a stacked pop-up in the corner the
// moment a page loads with something new — each one is popped at most once
// (tracked in localStorage, independent from the DB's read/unread flag) so
// navigating around the app doesn't re-show the same pop-up every time.
export function NotificationPopups({ notifications }: { notifications: AppNotification[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [visible, setVisible] = useState<AppNotification[]>([]);

  useEffect(() => {
    const shown = loadShownIds();
    const fresh = notifications.filter((n) => !n.lu && !shown.has(n.id));
    if (!fresh.length) return;

    fresh.forEach((n) => shown.add(n.id));
    saveShownIds(shown);
    setVisible((prev) => [...prev, ...fresh]);

    fresh.forEach((n) => {
      setTimeout(() => setVisible((prev) => prev.filter((x) => x.id !== n.id)), AUTO_DISMISS_MS);
    });
    // Only re-run when the actual notification list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  function dismiss(id: string) {
    setVisible((prev) => prev.filter((n) => n.id !== id));
  }

  function open(n: AppNotification) {
    dismiss(n.id);
    startTransition(async () => {
      await markNotificationRead(n.id);
      router.refresh();
    });
  }

  if (!visible.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[200] flex w-[300px] flex-col gap-2">
      {visible.map((n) => (
        <div key={n.id} className="flex items-start gap-2 rounded-lg border border-navy/20 bg-white p-3 shadow-lg">
          <Link href={n.link ?? "#"} onClick={() => open(n)} className="flex-1 text-[13px] font-medium text-text-dark hover:underline">
            {n.message}
          </Link>
          <button onClick={() => dismiss(n.id)} className="shrink-0 text-text-muted hover:text-text-dark">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
