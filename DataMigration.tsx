"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; type?: "error" | "info" };
type ToastContextValue = { showToast: (message: string, type?: "error" | "info") => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "error" | "info" = "error") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex max-w-[340px] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-3.5 py-3 text-xs shadow-lg ${
              t.type === "info"
                ? "border-accent-bright bg-[#122E33] text-[#E4FBF4]"
                : "border-danger bg-[#3A1F1A] text-[#FBE9E4]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
