"use client";

import { useState, useTransition } from "react";
import { setOwnAvailability } from "@/lib/actions/attendance";
import { AVAILABILITY_STATUS_LABELS, type AvailabilityStatus } from "@/lib/types";

export function AvailabilityPicker({
  eventId,
  playerId,
  current,
}: {
  eventId: string;
  playerId: string;
  current?: { status: AvailabilityStatus; comment: string | null };
}) {
  const [status, setStatus] = useState<AvailabilityStatus>(current?.status ?? "present");
  const [comment, setComment] = useState(current?.comment ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.entries(AVAILABILITY_STATUS_LABELS) as [AvailabilityStatus, string][]).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={status === value ? "btn" : "btn-secondary"}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        className="input"
        placeholder="Commentaire (optionnel)"
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        className="btn"
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => setOwnAvailability(eventId, playerId, status, comment))}
      >
        {isPending ? "Envoi..." : "Confirmer ma disponibilité"}
      </button>
    </div>
  );
}
