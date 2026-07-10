"use client";

import { useTransition } from "react";
import { respondToConvocation } from "@/lib/actions/convocations";
import { CONVOCATION_RESPONSE_LABELS, type ConvocationResponse } from "@/lib/types";

export function RespondButtons({
  convocationPlayerId,
  current,
}: {
  convocationPlayerId: string;
  current: ConvocationResponse;
}) {
  const [isPending, startTransition] = useTransition();

  const options: ConvocationResponse[] = ["accepted", "declined", "uncertain"];

  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={isPending}
          className={current === option ? "btn text-xs" : "btn-secondary text-xs"}
          onClick={() => startTransition(() => respondToConvocation(convocationPlayerId, option, ""))}
        >
          {CONVOCATION_RESPONSE_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
