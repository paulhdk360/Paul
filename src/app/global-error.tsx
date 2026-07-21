"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            textAlign: "center",
            fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#1a2744" }}>L&apos;application a rencontré un problème</div>
          <p style={{ maxWidth: 420, fontSize: 13.5, color: "#6b7280" }}>
            Rien n&apos;a été perdu côté données — réessayez de charger la page.
          </p>
          <button
            onClick={reset}
            style={{
              borderRadius: 8,
              background: "#1a2744",
              color: "white",
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
