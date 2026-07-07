"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext<{ showToast: (msg: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-lg border border-danger/30 bg-white px-4 py-3 text-[13.5px] font-medium text-danger shadow-lg">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
