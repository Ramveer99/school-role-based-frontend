import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
export default function Notices() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [f, setF] = useState({ title: '', description: '', audience: 'Everyone', color: 'blue' });
    const load = async () => { setLoading(true); try {
        setRows(await api.get('/api/notices'));
    }
    catch (e) {
        toast(e.message, 'error');
    }
    finally {
        setLoading(false);
    } };
    useEffect(() => { load(); }, []);
    const submit = async (e) => {
        e.preventDefault();
        if (!f.title || !f.description) {
            toast('Fill all fields', 'error');
            return;
        }
        try {
            await api.post('/api/notices', f);
            toast('Notice published');
            setShowForm(false);
            setF({ title: '', description: '', audience: 'Everyone', color: 'blue' });
            load();
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    const canPost = profile && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'teacher');
    return (<div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div><h2 className="font-display font-extrabold text-xl">Notices & Announcements</h2><p className="text-sm text-slate-500">School-wide communications</p></div>
        {canPost && <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold">+ New Notice</button>}
      </div>
      {showForm && (<form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 p-5 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="text-xs font-bold">Title</label><input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
          <div className="md:col-span-2"><label className="text-xs font-bold">Description</label><textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} rows={3} className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
          <div><label className="text-xs font-bold">Audience</label><select value={f.audience} onChange={e => setF({ ...f, audience: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"><option>Everyone</option><option>Students</option><option>Parents</option><option>Teachers</option></select></div>
          <div><label className="text-xs font-bold">Color</label><select value={f.color} onChange={e => setF({ ...f, color: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"><option value="blue">Blue</option><option value="emerald">Green</option><option value="amber">Amber</option><option value="violet">Violet</option></select></div>
          <div className="md:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm">Cancel</button><button type="submit" className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm">Publish</button></div>
        </form>)}
      <div className="grid md:grid-cols-2 gap-4">
        {loading && <div className="col-span-full text-center text-slate-400 py-8">Loading...</div>}
        {!loading && rows.length === 0 && <div className="col-span-full text-center text-slate-400 py-8 bg-white rounded-2xl border border-slate-200">No notices yet.</div>}
        {rows.map((n) => {
            const map = { blue: 'bg-blue-50 border-blue-200 text-[#2563EB]', emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700', amber: 'bg-amber-50 border-amber-200 text-amber-700', violet: 'bg-violet-50 border-violet-200 text-violet-700' };
            const cc = map[n.color] || map.blue;
            return (<div key={n.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-2"><div className="font-bold">{n.title}</div><span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cc}`}>{n.audience}</span></div>
              <p className="text-sm text-slate-600 mt-2">{n.description}</p>
              <div className="text-xs text-slate-400 mt-3 font-bold tracking-wider">{new Date(n.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>);
        })}
      </div>
    </div>);
}
