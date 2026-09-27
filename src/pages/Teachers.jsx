import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import RecordModal, { DetailField, FormField } from '../components/RecordModal';
import { AvatarImg } from '../components/Avatar';
import EditPhotoField from '../components/EditPhotoField';
const DEPTS = ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science', 'Commerce', 'Arts', 'Physical Education'];
export default function Teachers() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [dept, setDept] = useState('');
    const [viewRecord, setViewRecord] = useState(null);
    const [editRecord, setEditRecord] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            setRows(await api.get('/api/teachers'));
        }
        catch (e) {
            toast(e.message, 'error');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);
    const filtered = useMemo(() => rows.filter(r => {
        if (q && !r.full_name?.toLowerCase().includes(q.toLowerCase()))
            return false;
        if (dept && r.department !== dept)
            return false;
        return true;
    }), [rows, q, dept]);
    const canAdd = profile && (profile.role === 'admin' || profile.role === 'super_admin');
    const del = async (id) => {
        if (!confirm('Delete this teacher?'))
            return;
        try {
            await api.del(`/api/teachers`, { id });
            toast('Teacher deleted');
            load();
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    const openView = async (id) => {
        try {
            setViewRecord(await api.get(`/api/teachers/${id}`));
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    const openEdit = async (id) => {
        try {
            const record = await api.get(`/api/teachers/${id}`);
            setEditRecord(record);
            setEditForm({
                full_name: record.full_name || '',
                email: record.email || '',
                phone: record.phone || '',
                employee_id: record.employee_id || '',
                department: record.department || 'Mathematics',
                subjects: record.subjects || '',
                classes: record.classes || '',
                status: record.status || 'Active',
                joining_date: record.joining_date ? record.joining_date.slice(0, 10) : '',
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
        if (!editForm.full_name || !editForm.email || !editForm.employee_id) {
            toast('Name, email, and employee ID are required', 'error');
            return;
        }
        setSaving(true);
        try {
            const { profile_id, avatar_url, avatar_image, ...fields } = editForm;
            await api.put(`/api/teachers/${editRecord.id}`, fields);
            if (avatar_image && profile_id) {
                await api.uploadProfileAvatarImage(profile_id, avatar_image);
            }
            toast('Teacher updated');
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
          <h2 className="font-display font-extrabold text-xl">Teachers Management</h2>
          <p className="text-sm text-slate-500">Faculty directory and assignments</p>
        </div>
        {canAdd && <Link to="/teachers/new" className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2"><i className="fa-solid fa-plus"></i> Add Teacher</Link>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100 bg-[#F8FAFC]/60">
          <div className="relative flex-1 min-w-[220px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search teacher..." className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm"/>
          </div>
          <select value={dept} onChange={e => setDept(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm">
            <option value="">All Departments</option>
            {['Science', 'Mathematics', 'English', 'Commerce', 'Social Science', 'Computer Science', 'Arts'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] font-bold tracking-widest text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Teacher</th>
                <th className="text-left px-4 py-3">Employee ID</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Subjects</th>
                <th className="text-left px-4 py-3">Classes</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No teachers yet. Click “Add Teacher” to create one.</td></tr>}
              {filtered.map(t => (<tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><AvatarImg src={t.avatar_url} name={t.full_name} colors="2563EB,0EA5E9,10B981" className="w-9 h-9 rounded-full bg-white object-cover"/><div><div className="font-semibold">{t.full_name}</div><div className="text-xs text-slate-500">{t.phone || '—'}</div></div></div></td>
                  <td className="px-4 py-3 font-mono text-xs">{t.employee_id}</td>
                  <td className="px-4 py-3">{t.department}</td>
                  <td className="px-4 py-3 text-slate-600">{t.subjects || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{t.classes || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{t.email}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{t.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" title="View" onClick={() => openView(t.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-eye text-xs"></i></button>
                      <button type="button" title="Edit" onClick={() => openEdit(t.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-pen-to-square text-xs"></i></button>
                      {canAdd && <button onClick={() => del(t.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500"><i className="fa-regular fa-trash-can text-xs"></i></button>}
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      <RecordModal open={!!viewRecord} onClose={() => setViewRecord(null)} title="Teacher Details">
        {viewRecord && (<div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <AvatarImg src={viewRecord.avatar_url} name={viewRecord.full_name} colors="2563EB,0EA5E9,10B981" className="w-14 h-14 rounded-full bg-white object-cover border border-slate-200"/>
              <div>
                <div className="font-bold">{viewRecord.full_name}</div>
                <div className="text-xs text-slate-500">{viewRecord.employee_id}</div>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${viewRecord.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{viewRecord.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Email" value={viewRecord.email}/>
              <DetailField label="Phone" value={viewRecord.phone}/>
              <DetailField label="Department" value={viewRecord.department}/>
              <DetailField label="Subjects" value={viewRecord.subjects}/>
              <DetailField label="Classes" value={viewRecord.classes}/>
              <DetailField label="Joining Date" value={viewRecord.joining_date ? new Date(viewRecord.joining_date).toLocaleDateString() : null}/>
            </div>
          </div>)}
      </RecordModal>

      <RecordModal
        open={!!editRecord}
        onClose={() => { setEditRecord(null); setEditForm(null); }}
        title="Edit Teacher"
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
            <FormField label="Full Name" required><input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Email" required><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Employee ID" required><input value={editForm.employee_id} onChange={e => setEditForm({ ...editForm, employee_id: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Phone"><input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Department"><select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className={`${inputClass} bg-white`}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></FormField>
            <FormField label="Status"><select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className={`${inputClass} bg-white`}><option>Active</option><option>On Leave</option><option>Inactive</option></select></FormField>
            <FormField label="Subjects"><input value={editForm.subjects} onChange={e => setEditForm({ ...editForm, subjects: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Classes"><input value={editForm.classes} onChange={e => setEditForm({ ...editForm, classes: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Joining Date"><input type="date" value={editForm.joining_date} onChange={e => setEditForm({ ...editForm, joining_date: e.target.value })} className={inputClass}/></FormField>
          </div>)}
      </RecordModal>
    </div>);
}
