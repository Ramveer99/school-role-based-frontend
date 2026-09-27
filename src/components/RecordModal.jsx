export default function RecordModal({ open, onClose, title, children, footer }) {
    if (!open) return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true"/>
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" role="dialog" aria-modal="true">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="p-5 border-t border-slate-100 shrink-0">{footer}</div>}
      </div>
    </div>);
}

export function DetailField({ label, value }) {
    return (<div>
      <div className="text-[11px] font-bold tracking-widest text-slate-400">{label.toUpperCase()}</div>
      <div className="text-sm font-semibold mt-1">{value || '—'}</div>
    </div>);
}

export function FormField({ label, required, children }) {
    return (<div>
      <label className="text-xs font-bold text-slate-600">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>);
}
