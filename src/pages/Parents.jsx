import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import RecordModal, { DetailField, FormField } from '../components/RecordModal';
import { AvatarImg } from '../components/Avatar';
import EditPhotoField from '../components/EditPhotoField';
export default function Parents() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [viewRecord, setViewRecord] = useState(null);
    const [editRecord, setEditRecord] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            setRows(await api.get('/api/parents'));
        }
        catch (e) {
            toast(e.message, 'error');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const filtered = useMemo(() => rows.filter(r => !q || r.full_name?.toLowerCase().includes(q.toLowerCase()) || r.email?.toLowerCase().includes(q.toLowerCase())), [rows, q]);
    const canAdd = profile && (profile.role === 'admin' || profile.role === 'super_admin');
    const del = async (id) => {
        if (!confirm('Delete this parent?'))
            return;
        try {
            await api.del(`/api/parents`, { id });
            toast('Parent deleted');
            load();
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    const openView = async (id) => {
        try {
            setViewRecord(await api.get(`/api/parents/${id}`));
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    const openEdit = async (id) => {
        try {
            const record = await api.get(`/api/parents/${id}`);
            setEditRecord(record);
            setEditForm({
                full_name: record.full_name || '',
                email: record.email || '',
                phone: record.phone || '',
                occupation: record.occupation || '',
                address: record.address || '',
                profile_id: record.profile_id || null,
                avatar_url: record.avatar_url || null,
                avatar_image: null,
            });
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    const saveEdit = async (e) => {
        e.preventDefault();
        if (!editForm.full_name || !editForm.email) {
            toast('Name and email are required', 'error');
            return;
        }
        setSaving(true);
        try {
            const { profile_id, avatar_url, avatar_image, ...fields } = editForm;
            await api.put(`/api/parents/${editRecord.id}`, fields);
            if (avatar_image && profile_id) {
                await api.uploadProfileAvatarImage(profile_id, avatar_image);
            }
            toast('Parent updated');
            setEditRecord(null);
            setEditForm(null);
            load();
        }
        catch (e) {
            toast(e.message, 'error');
        }
        finally {
            setSaving(false);
        }
    };
    const inputClass = 'w-full h-11 px-3 rounded-xl border border-slate-200 text-sm';
    return (<div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display font-extrabold text-xl">Parents Directory</h2>
          <p className="text-sm text-slate-500">All parents linked to students in your organization</p>
        </div>
        {canAdd && <Link to="/parents/new" className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2"><i className="fa-solid fa-plus"></i> Add Parent</Link>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-[#F8FAFC]/60">
          <div className="relative flex-1 min-w-[220px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search parents by name or email..." className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm"/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] font-bold tracking-widest text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Parent</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Occupation</th>
                <th className="text-left px-4 py-3">Children</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No parents yet. Parents are auto-created via New Admission.</td></tr>}
              {filtered.map(p => (<tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><AvatarImg src={p.avatar_url} name={p.full_name} colors="8B5CF6,F59E0B,0EA5E9" className="w-9 h-9 rounded-full bg-white object-cover"/><div className="font-semibold">{p.full_name}</div></div></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.email}</td>
                  <td className="px-4 py-3 text-slate-600">{p.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{p.occupation || '—'}</td>
                  <td className="px-4 py-3">
                    {p.children && p.children.length > 0 ? (<div className="flex flex-wrap gap-1">{p.children.map((c) => <span key={c.id} className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold">{c.full_name} ({c.class_grade}-{c.section})</span>)}</div>) : <span className="text-slate-400 text-xs">No linked students</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" title="View" onClick={() => openView(p.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-eye text-xs"></i></button>
                      <button type="button" title="Edit" onClick={() => openEdit(p.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-pen-to-square text-xs"></i></button>
                      {canAdd && <button onClick={() => del(p.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500"><i className="fa-regular fa-trash-can text-xs"></i></button>}
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      <RecordModal open={!!viewRecord} onClose={() => setViewRecord(null)} title="Parent Details">
        {viewRecord && (<div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <AvatarImg src={viewRecord.avatar_url} name={viewRecord.full_name} colors="8B5CF6,F59E0B,0EA5E9" className="w-14 h-14 rounded-full bg-white object-cover border border-slate-200"/>
              <div>
                <div className="font-bold">{viewRecord.full_name}</div>
                <div className="text-xs text-slate-500">{viewRecord.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Phone" value={viewRecord.phone}/>
              <DetailField label="Occupation" value={viewRecord.occupation}/>
            </div>
            {viewRecord.address && <DetailField label="Address" value={viewRecord.address}/>}
            <div>
              <div className="text-[11px] font-bold tracking-widest text-slate-400 mb-2">CHILDREN</div>
              {viewRecord.children?.length > 0 ? (<div className="flex flex-wrap gap-2">
                  {viewRecord.children.map(c => (<span key={c.id} className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold">{c.full_name} ({c.class_grade}-{c.section})</span>))}
                </div>) : <div className="text-sm text-slate-400">No linked students</div>}
            </div>
          </div>)}
      </RecordModal>

      <RecordModal
        open={!!editRecord}
        onClose={() => { setEditRecord(null); setEditForm(null); }}
        title="Edit Parent"
        footer={editForm && (<form onSubmit={saveEdit} className="flex justify-end gap-3">
            <button type="button" onClick={() => { setEditRecord(null); setEditForm(null); }} className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70">{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>)}
      >
        {editForm && (<div className="grid grid-cols-2 gap-4">
            <EditPhotoField
              profileId={editForm.profile_id}
              avatarUrl={editForm.avatar_url}
              avatarImage={editForm.avatar_image}
              name={editForm.full_name}
              onChange={(value) => setEditForm({ ...editForm, avatar_image: value })}
              onError={(msg) => toast(msg, 'error')}
            />
            <div className="col-span-2"><FormField label="Full Name" required><input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className={inputClass}/></FormField></div>
            <FormField label="Email" required><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Phone"><input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Occupation"><input value={editForm.occupation} onChange={e => setEditForm({ ...editForm, occupation: e.target.value })} className={inputClass}/></FormField>
            <div className="col-span-2"><FormField label="Address"><textarea value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></FormField></div>
          </div>)}
      </RecordModal>
    </div>);
}
