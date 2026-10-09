import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import RecordModal, { DetailField } from '../components/RecordModal';
import { AvatarImg } from '../components/Avatar';

const TABS = [
    { id: 'students', label: 'Students', noun: 'students', subtitle: 'Students belonging to this school' },
    { id: 'teachers', label: 'Teachers', noun: 'teachers', subtitle: 'Teachers belonging to this school' },
    { id: 'parents', label: 'Parents', noun: 'parents', subtitle: 'Parents belonging to this school' },
];

function asList(payload, tab) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.[tab])) return payload[tab];
    if (Array.isArray(payload?.members)) return payload.members;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

function asRecord(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
    return payload.student || payload.teacher || payload.parent || payload.member || payload.data || payload;
}

function rowId(row) {
    return row?.id || row?._id;
}

export default function OrganizationStudents() {
    const { organizationId } = useParams();
    const location = useLocation();
    const { profile } = useAuth();
    const { toast } = useToast();
    const [tab, setTab] = useState('students');
    const [orgName, setOrgName] = useState(location.state?.name || '');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [cls, setCls] = useState('');
    const [sec, setSec] = useState('');
    const [status, setStatus] = useState('');
    const [dept, setDept] = useState('');
    const [viewRecord, setViewRecord] = useState(null);

    const active = TABS.find((item) => item.id === tab) || TABS[0];

    const load = async (nextTab = tab) => {
        setLoading(true);
        setRows([]);
        try {
            const payload = await api.get(`/api/organizations/${organizationId}/${nextTab}`);
            setRows(asList(payload, nextTab));
        }
        catch (e) {
            toast(e.message, 'error');
            setRows([]);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.role !== 'super_admin') return;
        load(tab);
        if (location.state?.name) {
            setOrgName(location.state.name);
            return;
        }
        api.get('/api/organizations')
            .then((list) => {
                const orgs = Array.isArray(list) ? list : [];
                const match = orgs.find((o) => (o.id || o._id) === organizationId);
                if (match?.name) setOrgName(match.name);
            })
            .catch(() => {});
    }, [organizationId, profile?.role, tab]);

    const switchTab = (next) => {
        if (next === tab) return;
        setTab(next);
        setQ('');
        setCls('');
        setSec('');
        setStatus('');
        setDept('');
        setViewRecord(null);
    };

    const filtered = useMemo(() => rows.filter((r) => {
        const name = r.full_name?.toLowerCase() || '';
        const query = q.toLowerCase();
        if (tab === 'students') {
            if (q && !name.includes(query) && !r.admission_no?.toLowerCase().includes(query))
                return false;
            if (cls && String(r.class_grade) !== cls)
                return false;
            if (sec && r.section !== sec)
                return false;
            if (status && r.status !== status)
                return false;
            return true;
        }
        if (tab === 'teachers') {
            if (q && !name.includes(query) && !r.employee_id?.toLowerCase().includes(query))
                return false;
            if (dept && r.department !== dept)
                return false;
            return true;
        }
        if (q && !name.includes(query) && !r.email?.toLowerCase().includes(query))
            return false;
        return true;
    }), [rows, q, cls, sec, status, dept, tab]);

    const openView = async (row) => {
        const id = rowId(row);
        if (tab !== 'students' || !id) {
            setViewRecord(row);
            return;
        }
        try {
            const payload = await api.get(`/api/organizations/${organizationId}/students/${id}`);
            setViewRecord(asRecord(payload));
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
          <Link to="/organizations" className="text-xs font-bold text-[#2563EB] hover:underline">Organizations</Link>
          <h2 className="font-display font-extrabold text-xl mt-1">{orgName || 'Organization'} {active.label}</h2>
          <p className="text-sm text-slate-500">{active.subtitle}</p>
        </div>
      </div>

      <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1 mb-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchTab(item.id)}
            className={`h-9 px-4 rounded-lg text-sm font-bold ${tab === item.id ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-wrap gap-3 border-b border-slate-100 bg-[#F8FAFC]/60">
          <div className="relative flex-1 min-w-[220px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={tab === 'students' ? 'Search by name, admission no...' : tab === 'teachers' ? 'Search by name, employee ID...' : 'Search by name or email...'}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm"
            />
          </div>
          {tab === 'students' && (<>
            <select value={cls} onChange={e => setCls(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">All Classes</option>{['10', '9', '8', '7', '6', '5'].map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select value={sec} onChange={e => setSec(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">All Sections</option>{['A', 'B', 'C'].map(s => <option key={s} value={s}>{s}</option>)}</select>
            <select value={status} onChange={e => setStatus(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"><option value="">All Status</option><option>Active</option><option>Inactive</option></select>
          </>)}
          {tab === 'teachers' && (
            <select value={dept} onChange={e => setDept(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm">
              <option value="">All Departments</option>
              {['Science', 'Mathematics', 'English', 'Commerce', 'Social Science', 'Computer Science', 'Arts'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {tab === 'students' && (<>
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
                {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No students in this organization.</td></tr>}
                {!loading && filtered.map(s => (<tr key={rowId(s)} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><AvatarImg src={s.avatar_url} name={s.full_name} colors="2563EB,0EA5E9,10B981" className="w-9 h-9 rounded-full bg-white object-cover"/><div><div className="font-semibold">{s.full_name}</div><div className="text-xs text-slate-500">Roll {s.roll_no || '—'}</div></div></div></td>
                    <td className="px-4 py-3 font-mono text-xs">{s.admission_no}</td>
                    <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">{s.class_grade}-{s.section}</span></td>
                    <td className="px-4 py-3">{s.parent_name || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{s.phone || '—'}</td>
                    <td className="px-4 py-3">{s.teacher_name || <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" title="View" onClick={() => openView(s)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-eye text-xs"></i></button>
                    </td>
                  </tr>))}
              </tbody>
            </>)}
            {tab === 'teachers' && (<>
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
                {!loading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No teachers in this organization.</td></tr>}
                {!loading && filtered.map(t => (<tr key={rowId(t)} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><AvatarImg src={t.avatar_url} name={t.full_name} colors="2563EB,0EA5E9,10B981" className="w-9 h-9 rounded-full bg-white object-cover"/><div><div className="font-semibold">{t.full_name}</div><div className="text-xs text-slate-500">{t.phone || '—'}</div></div></div></td>
                    <td className="px-4 py-3 font-mono text-xs">{t.employee_id || '—'}</td>
                    <td className="px-4 py-3">{t.department || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.subjects || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.classes || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{t.email || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{t.status || '—'}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" title="View" onClick={() => openView(t)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-eye text-xs"></i></button>
                    </td>
                  </tr>))}
              </tbody>
            </>)}
            {tab === 'parents' && (<>
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
                {!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No parents in this organization.</td></tr>}
                {!loading && filtered.map(p => (<tr key={rowId(p)} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><AvatarImg src={p.avatar_url} name={p.full_name} colors="8B5CF6,F59E0B,0EA5E9" className="w-9 h-9 rounded-full bg-white object-cover"/><div className="font-semibold">{p.full_name}</div></div></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.occupation || '—'}</td>
                    <td className="px-4 py-3">
                      {p.children && p.children.length > 0 ? (<div className="flex flex-wrap gap-1">{p.children.map((c) => <span key={c.id || c._id || c.full_name} className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold">{c.full_name}{c.class_grade ? ` (${c.class_grade}-${c.section})` : ''}</span>)}</div>) : <span className="text-slate-400 text-xs">No linked students</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" title="View" onClick={() => openView(p)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"><i className="fa-regular fa-eye text-xs"></i></button>
                    </td>
                  </tr>))}
              </tbody>
            </>)}
          </table>
        </div>
        <div className="p-4 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-500">{loading ? '' : `${filtered.length} of ${rows.length} ${active.noun}`}</span>
        </div>
      </div>

      <RecordModal open={!!viewRecord && tab === 'students'} onClose={() => setViewRecord(null)} title="Student Details">
        {viewRecord && tab === 'students' && (<div className="space-y-4">
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

      <RecordModal open={!!viewRecord && tab === 'teachers'} onClose={() => setViewRecord(null)} title="Teacher Details">
        {viewRecord && tab === 'teachers' && (<div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <AvatarImg src={viewRecord.avatar_url} name={viewRecord.full_name} colors="2563EB,0EA5E9,10B981" className="w-14 h-14 rounded-full bg-white object-cover border border-slate-200"/>
              <div>
                <div className="font-bold">{viewRecord.full_name}</div>
                <div className="text-xs text-slate-500">{viewRecord.employee_id}</div>
                {viewRecord.status && <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${viewRecord.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{viewRecord.status}</span>}
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

      <RecordModal open={!!viewRecord && tab === 'parents'} onClose={() => setViewRecord(null)} title="Parent Details">
        {viewRecord && tab === 'parents' && (<div className="space-y-4">
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
                  {viewRecord.children.map(c => (<span key={c.id || c._id || c.full_name} className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold">{c.full_name}{c.class_grade ? ` (${c.class_grade}-${c.section})` : ''}</span>))}
                </div>) : <div className="text-sm text-slate-400">No linked students</div>}
            </div>
          </div>)}
      </RecordModal>
    </div>);
}
