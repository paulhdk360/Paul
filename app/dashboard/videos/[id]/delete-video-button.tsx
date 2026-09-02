"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteVideo } from "@/lib/actions/videos";

export function DeleteVideoButton({ videoId, storagePath }: { videoId: string; storagePath: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className="btn-secondary text-red-600"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Supprimer cette vidéo et tous ses plays tagués ?")) return;
        startTransition(async () => {
          await deleteVideo(videoId, storagePath);
          router.push("/dashboard/videos");
        });
      }}
    >
      {isPending ? "Suppression..." : "Supprimer"}
    </button>
  );
}
