"use client";

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10">
      <div className={`w-full ${wide ? "max-w-[860px]" : "max-w-[520px]"} rounded-[10px] border border-border bg-white p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-[20px] font-semibold text-navy">{title}</div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-text-muted hover:bg-bg-sunken" aria-label="Fermer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
