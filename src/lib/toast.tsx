import React, { createContext, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; type: ToastType; message: string };

interface ToastContextValue {
  push: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (type: ToastType, message: string, duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
  };

  const value = useMemo(() => ({ push }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toasts={toasts} />
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return {
    success: (m: string, d?: number) => ctx.push('success', m, d),
    error: (m: string, d?: number) => ctx.push('error', m, d),
    info: (m: string, d?: number) => ctx.push('info', m, d),
  };
}

function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed right-4 top-4 z-[9999] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'rounded-xl border px-3 py-2 shadow-sm text-sm',
            t.type === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
            t.type === 'error' && 'border-rose-200 bg-rose-50 text-rose-800',
            t.type === 'info' && 'border-sky-200 bg-sky-50 text-sky-800',
          ].filter(Boolean).join(' ')}
          role="status"
          aria-live="polite"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
