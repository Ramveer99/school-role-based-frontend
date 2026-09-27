import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
export default function Organizations() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [f, setF] = useState({ name: '', code: '', address: '', phone: '', email: '', admin_name: '', admin_email: '' });
    const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            setRows(await api.get('/api/organizations'));
        }
        catch (e) {
            toast(e.message, 'error');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const submit = async (e) => {
        e.preventDefault();
        if (!f.name || !f.code) {
            toast('Name and code required', 'error');
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/organizations', f);
            toast('Organization created' + (f.admin_email ? ' with admin login' : ''));
            setShowForm(false);
            setF({ name: '', code: '', address: '', phone: '', email: '', admin_name: '', admin_email: '' });
            load();
        }
        catch (e) {
            toast(e.message || 'Failed', 'error');
        }
        finally {
            setSaving(false);
        }
    };
    const toggle = async (id, active) => {
        try {
            await api.put('/api/organizations', { id, active: !active });
            load();
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    if (profile?.role !== 'super_admin')
        return <div className="p-6 text-slate-500">Only the Super Admin can access this section.</div>;
    return (<div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display font-extrabold text-xl">Organizations</h2>
          <p className="text-sm text-slate-500">Manage every school on the platform. Each organization has isolated data.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2"><i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'}`}></i> {showForm ? 'Close' : 'New Organization'}</button>
      </div>

      {showForm && (<form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="p-5 border-b border-slate-100 font-bold">Create Organization</div>
          <div className="p-5 grid md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-600">Name <span className="text-red-500">*</span></label><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Greenwood Academy" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-bold text-slate-600">Code <span className="text-red-500">*</span></label><input value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="GA" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono"/></div>
            <div><label className="text-xs font-bold text-slate-600">Contact Email</label><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-bold text-slate-600">Phone</label><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
            <div className="md:col-span-2"><label className="text-xs font-bold text-slate-600">Address</label><textarea value={f.address} onChange={e => setF({ ...f, address: e.target.value })} rows={2} className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
            <div className="md:col-span-2 border-t border-slate-100 pt-4 font-bold text-sm text-slate-700">Initial Admin (optional)</div>
            <div><label className="text-xs font-bold text-slate-600">Admin Name</label><input value={f.admin_name} onChange={e => setF({ ...f, admin_name: e.target.value })} placeholder="Michael Chen" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
            <div><label className="text-xs font-bold text-slate-600">Admin Email</label><input type="email" value={f.admin_email} onChange={e => setF({ ...f, admin_email: e.target.value })} placeholder="admin@greenwood.edu" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
            {f.admin_email && <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-[#1D4ED8]"><i className="fa-solid fa-circle-info mr-2"></i>Admin login will be created with password <b>password123</b>.</div>}
          </div>
          <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70">{saving ? 'Saving...' : 'Create Organization'}</button>
          </div>
        </form>)}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <div className="col-span-full text-center text-slate-400 py-8">Loading...</div>}
        {!loading && rows.length === 0 && <div className="col-span-full text-center text-slate-400 py-8 bg-white rounded-2xl border border-slate-200">No organizations yet.</div>}
        {rows.map((o) => (<div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] text-white flex items-center justify-center font-extrabold">{o.code?.slice(0, 2)}</div>
                <div><div className="font-bold">{o.name}</div><div className="text-xs text-slate-500 font-mono">{o.code}</div></div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${o.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{o.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-xl py-2"><div className="text-lg font-extrabold">{o.stats?.students ?? 0}</div><div className="text-[10px] text-slate-500 font-bold tracking-wider">STUDENTS</div></div>
              <div className="bg-slate-50 rounded-xl py-2"><div className="text-lg font-extrabold">{o.stats?.teachers ?? 0}</div><div className="text-[10px] text-slate-500 font-bold tracking-wider">TEACHERS</div></div>
              <div className="bg-slate-50 rounded-xl py-2"><div className="text-lg font-extrabold">{o.stats?.parents ?? 0}</div><div className="text-[10px] text-slate-500 font-bold tracking-wider">PARENTS</div></div>
            </div>
            <div className="mt-4 text-xs text-slate-500 space-y-1">
              {o.email && <div><i className="fa-regular fa-envelope w-4"></i> {o.email}</div>}
              {o.phone && <div><i className="fa-solid fa-phone w-4"></i> {o.phone}</div>}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => toggle(o.id, o.active)} className="text-xs font-bold text-[#2563EB] hover:underline">{o.active ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>))}
      </div>
    </div>);
}
