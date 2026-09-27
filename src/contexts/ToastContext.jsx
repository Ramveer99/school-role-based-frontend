import { createContext, useContext, useState, useCallback } from 'react';
const ToastCtx = createContext({ toast: () => { } });
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const toast = useCallback((msg, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    }, []);
    return (<ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[80] space-y-2">
        {toasts.map(t => {
            const color = t.type === 'error' ? 'bg-red-600' : t.type === 'info' ? 'bg-slate-900' : 'bg-emerald-600';
            const icon = t.type === 'error' ? 'fa-circle-exclamation' : t.type === 'info' ? 'fa-circle-info' : 'fa-circle-check';
            return (<div key={t.id} className={`toast-enter ${color} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-semibold min-w-[240px]`}>
              <i className={`fa-solid ${icon}`}></i>
              <span>{t.msg}</span>
            </div>);
        })}
      </div>
    </ToastCtx.Provider>);
}
export const useToast = () => useContext(ToastCtx);
