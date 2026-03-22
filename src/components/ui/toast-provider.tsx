import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

export function useToastStore() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    ({ title, description, type = "info" }: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  return { toasts, toast };
}

const ToastContext = createContext<ReturnType<typeof useToastStore> | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const store = useToastStore();

  return (
    <ToastContext.Provider value={store}>
      {children}
      <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] pointer-events-none gap-2">
        {store.toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

function Toast({ toast }: { toast: ToastMessage }) {
  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all",
        {
          "bg-white border-[hsl(var(--muted))] text-[hsl(var(--text))]": toast.type === "info",
          "bg-[hsl(var(--success))] text-white border-transparent": toast.type === "success",
          "bg-[hsl(var(--danger))] text-white border-transparent": toast.type === "error",
        }
      )}
    >
      <div className="flex w-full flex-col gap-1">
        <h3 className="text-sm font-semibold">{toast.title}</h3>
        {toast.description && (
          <p className="text-sm opacity-90">{toast.description}</p>
        )}
      </div>
    </div>
  );
}
