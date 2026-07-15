"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { markConversationRead, sendMessage } from "@/actions/messages";
import { useToast } from "@/components/Toast";
import { ROLE_LABELS } from "@/lib/company";
import { fmtDate } from "@/lib/format";
import type { Message, Profile } from "@/lib/types";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return isToday ? time : `${fmtDate(iso)} ${time}`;
}

export function MessagesManager({
  colleagues,
  messages,
  currentUserId,
  initialColleagueId,
}: {
  colleagues: Profile[];
  messages: Message[];
  currentUserId: string;
  initialColleagueId?: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(
    initialColleagueId && colleagues.some((c) => c.id === initialColleagueId) ? initialColleagueId : colleagues[0]?.id ?? null,
  );
  const [text, setText] = useState("");

  const byColleague = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const c of colleagues) map.set(c.id, []);
    for (const m of messages) {
      const otherId = m.from_user_id === currentUserId ? m.to_user_id : m.from_user_id;
      const arr = map.get(otherId);
      if (arr) arr.push(m);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return map;
  }, [colleagues, messages, currentUserId]);

  const unreadByColleague = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of colleagues) {
      map.set(c.id, (byColleague.get(c.id) ?? []).filter((m) => m.to_user_id === currentUserId && !m.lu).length);
    }
    return map;
  }, [colleagues, byColleague, currentUserId]);

  function openColleague(id: string) {
    setSelected(id);
    if ((unreadByColleague.get(id) ?? 0) > 0) {
      startTransition(async () => {
        try {
          await markConversationRead(id);
          router.refresh();
        } catch (e) {
          showToast(e instanceof Error ? e.message : "Échec de la mise à jour.");
        }
      });
    }
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed || !selected) return;
    setText("");
    startTransition(async () => {
      try {
        await sendMessage(selected, trimmed);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Échec de l'envoi du message.");
      }
    });
  }

  const thread = selected ? byColleague.get(selected) ?? [] : [];
  const selectedColleague = colleagues.find((c) => c.id === selected) ?? null;

  return (
    <div>
      <div className="mb-1 font-display text-[30px] font-bold tracking-wide text-navy">Messages</div>
      <div className="mb-6 text-[13.5px] text-text-muted">Demander quelque chose à un collègue, sans passer par mail.</div>

      <div className="flex overflow-hidden rounded-[10px] border border-border bg-bg-card" style={{ height: 560 }}>
        <div className="w-[240px] shrink-0 overflow-y-auto border-r border-border">
          {colleagues.map((c) => {
            const unread = unreadByColleague.get(c.id) ?? 0;
            const lastMsg = (byColleague.get(c.id) ?? []).slice(-1)[0];
            return (
              <button
                key={c.id}
                onClick={() => openColleague(c.id)}
                className={`block w-full border-b border-border/60 px-3.5 py-3 text-left transition-colors ${
                  selected === c.id ? "bg-blue/10" : "hover:bg-bg-sunken"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-navy">{c.full_name ?? c.email}</span>
                  {unread > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-[10.5px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-text-muted">{ROLE_LABELS[c.role] ?? c.role}</div>
                {lastMsg && <div className="mt-1 truncate text-[11.5px] text-text-muted">{lastMsg.message}</div>}
              </button>
            );
          })}
          {colleagues.length === 0 && <div className="p-4 text-center text-[12px] text-text-muted">Aucun collègue.</div>}
        </div>

        <div className="flex flex-1 flex-col">
          {selectedColleague ? (
            <>
              <div className="border-b border-border px-4 py-3">
                <div className="text-[13.5px] font-semibold text-navy">{selectedColleague.full_name ?? selectedColleague.email}</div>
                <div className="text-[11px] text-text-muted">{ROLE_LABELS[selectedColleague.role] ?? selectedColleague.role}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-2.5">
                  {thread.map((m) => {
                    const mine = m.from_user_id === currentUserId;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-[12px] px-3 py-2 text-[13px] ${
                            mine ? "bg-navy text-white" : "border border-border bg-bg-sunken text-text-dark"
                          }`}
                        >
                          <div className="whitespace-pre-line">{m.message}</div>
                          <div className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-text-muted"}`}>{timeLabel(m.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                  {thread.length === 0 && <div className="p-6 text-center text-[12.5px] text-text-muted">Aucun message pour l&apos;instant.</div>}
                </div>
              </div>
              <div className="flex items-end gap-2 border-t border-border p-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Écrire un message… (Entrée pour envoyer)"
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-[13px] focus:border-blue focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={isPending || !text.trim()}
                  className="rounded-lg bg-navy px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
                >
                  Envoyer
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[12.5px] text-text-muted">Choisis un collègue à gauche.</div>
          )}
        </div>
      </div>
    </div>
  );
}
