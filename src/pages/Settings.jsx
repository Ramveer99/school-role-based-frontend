import { useToast } from '../contexts/ToastContext';
export default function Settings() {
    const { toast } = useToast();
    return (<div className="p-4 lg:p-6 max-w-3xl">
      <h2 className="font-display font-extrabold text-xl">Settings</h2>
      <p className="text-sm text-slate-500 mb-5">Manage your account preferences</p>
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {[
            { i: 'fa-bell', t: 'Email Notifications', d: 'Receive updates via email', v: true },
            { i: 'fa-mobile', t: 'SMS Alerts', d: 'Get critical alerts on phone', v: false },
            { i: 'fa-moon', t: 'Dark Mode', d: 'Coming soon', v: false },
            { i: 'fa-shield-halved', t: 'Two-Factor Authentication', d: 'Add an extra layer of security', v: true },
        ].map((s, i) => (<div key={i} className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center"><i className={`fa-solid ${s.i}`}></i></div>
            <div className="flex-1"><div className="font-semibold">{s.t}</div><div className="text-xs text-slate-500">{s.d}</div></div>
            <button onClick={() => toast(`${s.t} toggled`)} className={`w-11 h-6 rounded-full transition ${s.v ? 'bg-[#2563EB]' : 'bg-slate-200'} relative`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${s.v ? 'left-[22px]' : 'left-0.5'}`}></span></button>
          </div>))}
      </div>
    </div>);
}
