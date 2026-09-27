import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import RecordModal, { DetailField, FormField } from '../components/RecordModal';
import { AvatarImg } from '../components/Avatar';
import EditPhotoField from '../components/EditPhotoField';
export default function Students() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [cls, setCls] = useState('');
    const [sec, setSec] = useState('');
    const [status, setStatus] = useState('');
    const [viewRecord, setViewRecord] = useState(null);
    const [editRecord, setEditRecord] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            setRows(await api.get('/api/students'));
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
        if (q && !r.full_name?.toLowerCase().includes(q.toLowerCase()) && !r.admission_no?.toLowerCase().includes(q.toLowerCase()))
            return false;
        if (cls && String(r.class_grade) !== cls)
            return false;
        if (sec && r.section !== sec)
            return false;
        if (status && r.status !== status)
            return false;
        return true;
    }), [rows, q, cls, sec, status]);
    const canAdd = profile && (profile.role === 'admin' || profile.role === 'super_admin');
    const del = async (id) => {
        if (!confirm('Delete this student?'))
            return;
        try {
            await api.del(`/api/students`, { id });
            toast('Student deleted');
            load();
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    const openView = async (id) => {
        try {
            setViewRecord(await api.get(`/api/students/${id}`));
        }
        catch (e) {
            toast(e.message, 'error');
        }
    };
    const openEdit = async (id) => {
        try {
            const record = await api.get(`/api/students/${id}`);
            setEditRecord(record);
            setEditForm({
                full_name: record.full_name || '',
                admission_no: record.admission_no || '',
                roll_no: record.roll_no || '',
                class_grade: record.class_grade || '',
                section: record.section || '',
                phone: record.phone || '',
                gender: record.gender || '',
                dob: record.dob ? record.dob.slice(0, 10) : '',
                address: record.address || '',
                status: record.status || 'Active',
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
        if (!editForm.full_name || !editForm.admission_no) {
            toast('Name and admission number are required', 'error');
            return;
        }
        setSaving(true);
        try {
            const { profile_id, avatar_url, avatar_image, ...fields } = editForm;
            await api.put(`/api/students/${editRecord.id}`, fields);
            if (avatar_image && profile_id) {
                await api.uploadProfileAvatarImage(profile_id, avatar_image);
            }
            toast('Student updated');
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
          <h2 className="font-display font-extrabold text-xl">Students Management</h2>
          <p className="text-sm text-slate-500">Manage all student records and profiles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast('Exported to CSV')} className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold flex items-center gap-2"><i className="fa-solid fa-download"></i> Export</button>
          {canAdd && <Link to="/students/new" className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2"><i className="fa-solid fa-plus"></i> New Admission</Link>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100 bg-[#F8FAFC]/60">
          <div className="relative flex-1 min-w-[220px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, admission no..." className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm"/>
          </div>
          <select value={cls} onChange={e => setCls(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">All Classes</option>{['10', '9', '8', '7', '6', '5'].map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select value={sec} onChange={e => setSec(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">All Sections</option>{['A', 'B', 'C'].map(s => <option key={s} value={s}>{s}</option>)}</select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">All Status</option><option>Active</option><option>Inactive</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] font-bold tracking-widest text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-4 py-3">Admission No.</th>
                <th className="text-left px-4 py-3">Class</th>
                <th className="text-left px-4 py-3">Parent</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Teacher</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No students found. Create a new admission.</td></tr>}
              {filtered.map(s => (<tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><AvatarImg src={s.avatar_url} name={s.full_name} colors="2563EB,0EA5E9,10B981" className="w-9 h-9 rounded-full bg-white object-cover"/><div><div className="font-semibold">{s.full_name}</div><div className="text-xs text-slate-500">Roll {s.roll_no}</div></div></div></td>
                  
                  {console.log("hhh---->>",s)}
                  <td className="px-4 py-3 font-mono text-xs">{s.admission_no}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">{s.class_grade}-{s.section}</span></td>
                  <td className="px-4 py-3">{s.parent_name || <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-slate-500">{s.phone || '—'}</td>
                  <td className="px-4 py-3">{s.teacher_name || <span className="text-slate-400">Unassigned</span>}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" title="View" onClick={() => openView(s.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-eye text-xs"></i></button>
                      <button type="button" title="Edit" onClick={() => openEdit(s.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-pen-to-square text-xs"></i></button>
                      {canAdd && <button onClick={() => del(s.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500"><i className="fa-regular fa-trash-can text-xs"></i></button>}
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-500">{filtered.length} of {rows.length} students</span>
        </div>
      </div>
      {console.log("hhh",viewRecord)}

      <RecordModal open={!!viewRecord} onClose={() => setViewRecord(null)} title="Student Details">
        {viewRecord && (<div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <AvatarImg src={viewRecord.avatar_url} name={viewRecord.full_name} colors="2563EB,0EA5E9,10B981" className="w-14 h-14 rounded-full bg-white object-cover border border-slate-200"/>
              <div>
                <div className="font-bold">{viewRecord.full_name}</div>
                <div className="text-xs text-slate-500">{viewRecord.admission_no}</div>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${viewRecord.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{viewRecord.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Roll No." value={viewRecord.roll_no}/>
              <DetailField label="Class" value={viewRecord.class_grade && viewRecord.section ? `${viewRecord.class_grade}-${viewRecord.section}` : null}/>
              <DetailField label="Gender" value={viewRecord.gender}/>
              <DetailField label="Date of Birth" value={viewRecord.dob ? new Date(viewRecord.dob).toLocaleDateString() : null}/>
              <DetailField label="Phone" value={viewRecord.phone}/>
              <DetailField label="Teacher" value={viewRecord.teacher_name}/>
              <DetailField label="Parent" value={viewRecord.parent_name || viewRecord.parent?.full_name}/>
              <DetailField label="Parent Email" value={viewRecord.parent?.email}/>
            </div>
            {viewRecord.address && <DetailField label="Address" value={viewRecord.address}/>}
          </div>)}
      </RecordModal>

      <RecordModal
        open={!!editRecord}
        onClose={() => { setEditRecord(null); setEditForm(null); }}
        title="Edit Student"
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
            <FormField label="Admission No." required><input value={editForm.admission_no} onChange={e => setEditForm({ ...editForm, admission_no: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Roll No."><input value={editForm.roll_no} onChange={e => setEditForm({ ...editForm, roll_no: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Class"><input value={editForm.class_grade} onChange={e => setEditForm({ ...editForm, class_grade: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Section"><input value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Phone"><input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Gender"><select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className={`${inputClass} bg-white`}><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select></FormField>
            <FormField label="Date of Birth"><input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} className={inputClass}/></FormField>
            <FormField label="Status"><select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className={`${inputClass} bg-white`}><option>Active</option><option>Inactive</option></select></FormField>
            <div className="col-span-2"><FormField label="Address"><textarea value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></FormField></div>
          </div>)}
      </RecordModal>
    </div>);
}
