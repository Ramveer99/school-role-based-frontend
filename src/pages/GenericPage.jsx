import { Link, useLocation } from 'react-router-dom';
export default function GenericPage() {
    const loc = useLocation();
    const title = loc.pathname.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (<div className="p-4 lg:p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-4"><i className="fa-solid fa-shield-halved"></i></div>
        <h3 className="font-bold text-lg">{title || 'Module'}</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">This section is available based on your role permissions. Full implementation coming soon.</p>
        <Link to="/dashboard" className="inline-block mt-6 h-10 px-6 rounded-xl bg-[#2563EB] text-white text-sm font-bold leading-10">Back to Dashboard</Link>
      </div>
    </div>);
}
