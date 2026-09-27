import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ImageUploadField from '../components/ImageUploadField';
export default function NewAdmission() {
    const { toast } = useToast();
    const { profile } = useAuth();
    const nav = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [parents, setParents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [organizationId, setOrganizationId] = useState('');
    const [stu, setStu] = useState({
        full_name: '', email: '', admission_no: '', roll_no: '', class_grade: '10', section: 'A',
        gender: 'Male', dob: '', phone: '', address: '', teacher_id: '',
    });
    const [stuPhoto, setStuPhoto] = useState(null);
    const [parPhoto, setParPhoto] = useState(null);
    const [par, setPar] = useState({
        parent_choice: 'new',
        parent_id: '',
        full_name: '', email: '', phone: '', occupation: '', address: '',
    });
    useEffect(() => {
        (async () => {
            try {
                const requests = [
                    api.get('/api/teachers').catch(() => []),
                    api.get('/api/parents').catch(() => []),
                    api.get('/api/classes').catch(() => []),
                ];
                if (profile?.role === 'super_admin') {
                    requests.push(api.get('/api/organizations').catch(() => []));
                }
                const [t, p, c, orgs] = await Promise.all(requests);
                setTeachers(t);
                setParents(p);
                setClasses(c);
                if (profile?.role === 'super_admin' && Array.isArray(orgs)) {
                    setOrganizations(orgs);
                    if (orgs.length === 1) setOrganizationId(String(orgs[0].id));
                }
            }
            catch { }
        })();
    }, [profile?.role]);
    useEffect(() => {
        if (!stu.admission_no)
            setStu(s => ({ ...s, admission_no: 'STU-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000) }));
    }, []);
    const submit = async (e) => {
        e.preventDefault();
        if (!stu.full_name || !stu.admission_no || !stu.email) {
            toast('Student name, email and admission no. are required', 'error');
            setStep(1);
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stu.email)) {
            toast('Enter a valid student email', 'error');
            setStep(1);
            return;
        }
        if (profile?.role === 'super_admin' && !organizationId) {
            toast('Select an organization', 'error');
            setStep(1);
            return;
        }
        if (par.parent_choice === 'new' && (!par.full_name || !par.email)) {
            toast('Parent name and email required', 'error');
            setStep(2);
            return;
        }
        if (par.parent_choice === 'existing' && !par.parent_id) {
            toast('Select an existing parent', 'error');
            setStep(2);
            return;
        }
        setSaving(true);
        try {
            const body = { student: { ...stu, ...(stuPhoto ? { avatar_image: stuPhoto } : {}) } };
            if (profile?.role === 'super_admin') body.organization_id = organizationId;
            if (par.parent_choice === 'existing')
                body.parent_id = par.parent_id;
            else
                body.parent = {
                    full_name: par.full_name,
                    email: par.email,
                    phone: par.phone,
                    occupation: par.occupation,
                    address: par.address,
                    ...(parPhoto ? { avatar_image: parPhoto } : {}),
                };
            await api.post('/api/admissions', body);
            toast(`Admission complete. Student login: ${stu.email} / password123`);
            nav('/students');
        }
        catch (e) {
            toast(e.message || 'Failed', 'error');
        }
        finally {
            setSaving(false);
        }
    };
    const Step = ({ n, label, icon }) => (<div className="flex items-center gap-3 flex-1">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${step >= n ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'}`}>{step > n ? <i className="fa-solid fa-check text-xs"></i> : <i className={`fa-solid ${icon} text-xs`}></i>}</div>
      <div className="hidden sm:block">
        <div className={`text-[10px] font-bold tracking-widest ${step >= n ? 'text-[#2563EB]' : 'text-slate-400'}`}>STEP {n}</div>
        <div className={`text-sm font-semibold ${step >= n ? 'text-slate-900' : 'text-slate-500'}`}>{label}</div>
      </div>
    </div>);
    return (<div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link to="/students" className="hover:text-[#2563EB]">Students</Link><span>/</span><span className="font-semibold text-slate-900">New Admission</span>
          </div>
          <h2 className="font-display font-extrabold text-xl">New Student Admission</h2>
          <p className="text-sm text-slate-500">Student, parent and teacher/class are linked in one step.</p>
        </div>
        <Link to="/students" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold flex items-center gap-2"><i className="fa-solid fa-arrow-left"></i> Back</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center gap-3">
          <Step n={1} label="Student Info" icon="fa-user-graduate"/>
          <div className={`h-0.5 flex-1 ${step > 1 ? 'bg-[#2563EB]' : 'bg-slate-100'}`}></div>
          <Step n={2} label="Parent Info" icon="fa-people-roof"/>
          <div className={`h-0.5 flex-1 ${step > 2 ? 'bg-[#2563EB]' : 'bg-slate-100'}`}></div>
          <Step n={3} label="Review & Save" icon="fa-check"/>
        </div>
      </div>

      <form onSubmit={submit}>
        {step === 1 && (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 font-bold">Student Details</div>
            <div className="p-5 grid md:grid-cols-2 gap-4">
              {profile?.role === 'super_admin' && (<div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Organization <span className="text-red-500">*</span></label>
                <select value={organizationId} onChange={e => setOrganizationId(e.target.value)} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white">
                  <option value="">— Select school —</option>
                  {organizations.map(o => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
                </select>
              </div>)}
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Full Name <span className="text-red-500">*</span></label>
                <input value={stu.full_name} onChange={e => setStu({ ...stu, full_name: e.target.value })} placeholder="e.g. Rahul Kumar" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
              </div>
              <div className="md:col-span-2">
                <ImageUploadField
                  label="Profile Photo"
                  preview={stuPhoto}
                  onChange={(value, error) => {
                    if (error) return toast(error.message, 'error');
                    setStuPhoto(value);
                  }}
                />
              </div>
              <div><label className="text-xs font-bold text-slate-600">Email (Login ID) <span className="text-red-500">*</span></label><input type="email" value={stu.email} onChange={e => setStu({ ...stu, email: e.target.value })} placeholder="student@school.edu" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
              <div><label className="text-xs font-bold text-slate-600">Admission No. <span className="text-red-500">*</span></label><input value={stu.admission_no} onChange={e => setStu({ ...stu, admission_no: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono"/></div>
              <div><label className="text-xs font-bold text-slate-600">Roll No.</label><input value={stu.roll_no} onChange={e => setStu({ ...stu, roll_no: e.target.value })} placeholder="1024" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
              <div><label className="text-xs font-bold text-slate-600">Class</label><select value={stu.class_grade} onChange={e => setStu({ ...stu, class_grade: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white">{['12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'].map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="text-xs font-bold text-slate-600">Section</label><select value={stu.section} onChange={e => setStu({ ...stu, section: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white">{['A', 'B', 'C', 'D'].map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="text-xs font-bold text-slate-600">Gender</label><select value={stu.gender} onChange={e => setStu({ ...stu, gender: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label className="text-xs font-bold text-slate-600">Date of Birth</label><input type="date" value={stu.dob} onChange={e => setStu({ ...stu, dob: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
              <div><label className="text-xs font-bold text-slate-600">Phone</label><input value={stu.phone} onChange={e => setStu({ ...stu, phone: e.target.value })} placeholder="+91 ..." className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
              <div className="md:col-span-2"><label className="text-xs font-bold text-slate-600">Address</label><textarea value={stu.address} onChange={e => setStu({ ...stu, address: e.target.value })} rows={2} className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Assign Class Teacher</label>
                <select value={String(stu.teacher_id)} onChange={e => setStu({ ...stu, teacher_id: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white">
                  <option value="">— Unassigned —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} — {t.department}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-[#1D4ED8]"><i className="fa-solid fa-circle-info mr-2"></i>A student login will be created with password <b>password123</b> using the email above.</div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <Link to="/students" className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm flex items-center">Cancel</Link>
              <button type="button" onClick={() => setStep(2)} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm">Next: Parent Info <i className="fa-solid fa-arrow-right ml-1 text-xs"></i></button>
            </div>
          </div>)}

        {step === 2 && (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 font-bold">Parent Details</div>
            <div className="p-5">
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <button type="button" onClick={() => setPar({ ...par, parent_choice: 'new' })} className={`text-left p-4 rounded-2xl border transition ${par.parent_choice === 'new' ? 'border-[#2563EB] bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${par.parent_choice === 'new' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'}`}><i className="fa-solid fa-user-plus"></i></div><div><div className="font-bold text-sm">Create New Parent</div><div className="text-xs text-slate-500">Auto-generate login credentials</div></div></div>
                </button>
                <button type="button" onClick={() => setPar({ ...par, parent_choice: 'existing' })} className={`text-left p-4 rounded-2xl border transition ${par.parent_choice === 'existing' ? 'border-[#2563EB] bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${par.parent_choice === 'existing' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'}`}><i className="fa-solid fa-user-check"></i></div><div><div className="font-bold text-sm">Link Existing Parent</div><div className="text-xs text-slate-500">Sibling admission — same parent</div></div></div>
                </button>
              </div>

              {par.parent_choice === 'existing' ? (<div>
                  <label className="text-xs font-bold text-slate-600">Select Existing Parent <span className="text-red-500">*</span></label>
                  <select value={String(par.parent_id)} onChange={e => setPar({ ...par, parent_id: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white">
                    <option value="">— Select —</option>
                    {parents.map(p => <option key={p.id} value={p.id}>{p.full_name} — {p.email} {p.children?.length ? `(${p.children.length} child${p.children.length > 1 ? 'ren' : ''})` : ''}</option>)}
                  </select>
                  <p className="text-xs text-slate-400 mt-2">The new student will be linked to this parent — no duplicate parent record will be created.</p>
                </div>) : (<div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="text-xs font-bold text-slate-600">Full Name <span className="text-red-500">*</span></label><input value={par.full_name} onChange={e => setPar({ ...par, full_name: e.target.value })} placeholder="e.g. Rajesh Kumar" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
                  <div className="md:col-span-2">
                    <ImageUploadField
                      label="Profile Photo"
                      preview={parPhoto}
                      onChange={(value, error) => {
                        if (error) return toast(error.message, 'error');
                        setParPhoto(value);
                      }}
                    />
                  </div>
                  <div><label className="text-xs font-bold text-slate-600">Email <span className="text-red-500">*</span></label><input type="email" value={par.email} onChange={e => setPar({ ...par, email: e.target.value })} placeholder="parent@example.com" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
                  <div><label className="text-xs font-bold text-slate-600">Phone</label><input value={par.phone} onChange={e => setPar({ ...par, phone: e.target.value })} placeholder="+91 ..." className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
                  <div className="md:col-span-2"><label className="text-xs font-bold text-slate-600">Occupation</label><input value={par.occupation} onChange={e => setPar({ ...par, occupation: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/></div>
                  <div className="md:col-span-2"><label className="text-xs font-bold text-slate-600">Address</label><textarea value={par.address} onChange={e => setPar({ ...par, address: e.target.value })} rows={2} className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/></div>
                  <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-[#1D4ED8]"><i className="fa-solid fa-circle-info mr-2"></i>A login account will be created with password <b>password123</b> so the parent can access their dashboard immediately.</div>
                </div>)}
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm"><i className="fa-solid fa-arrow-left mr-1 text-xs"></i> Back</button>
              <button type="button" onClick={() => setStep(3)} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm">Next: Review <i className="fa-solid fa-arrow-right ml-1 text-xs"></i></button>
            </div>
          </div>)}

        {step === 3 && (<div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 font-bold">Review & Save</div>
            <div className="p-5 grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="font-bold mb-3 flex items-center gap-2"><i className="fa-solid fa-user-graduate text-[#2563EB]"></i> Student</div>
                <div className="space-y-2 text-sm">
                  <Row k="Name" v={stu.full_name}/><Row k="Email" v={stu.email}/><Row k="Password" v="password123"/><Row k="Admission No" v={stu.admission_no}/><Row k="Class" v={`${stu.class_grade}-${stu.section}`}/><Row k="Roll" v={stu.roll_no || '—'}/><Row k="Gender" v={stu.gender}/><Row k="DOB" v={stu.dob || '—'}/><Row k="Phone" v={stu.phone || '—'}/><Row k="Teacher" v={teachers.find(t => String(t.id) === String(stu.teacher_id))?.full_name || 'Unassigned'}/>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="font-bold mb-3 flex items-center gap-2"><i className="fa-solid fa-people-roof text-violet-600"></i> Parent</div>
                <div className="space-y-2 text-sm">
                  {par.parent_choice === 'existing' ? (() => {
                const p = parents.find(x => String(x.id) === String(par.parent_id));
                return (<>
                      <Row k="Type" v="Existing (linked)"/><Row k="Name" v={p?.full_name}/><Row k="Email" v={p?.email}/><Row k="Phone" v={p?.phone || '—'}/>
                    </>);
            })() : (<>
                      <Row k="Type" v="New (login created)"/><Row k="Name" v={par.full_name}/><Row k="Email" v={par.email}/><Row k="Phone" v={par.phone || '—'}/><Row k="Password" v="password123"/>
                    </>)}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-between gap-3">
              <button type="button" onClick={() => setStep(2)} className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm"><i className="fa-solid fa-arrow-left mr-1 text-xs"></i> Back</button>
              <button type="submit" disabled={saving} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70">{saving ? 'Saving...' : (<><i className="fa-solid fa-check mr-1 text-xs"></i> Complete Admission</>)}</button>
            </div>
          </div>)}
      </form>
    </div>);
}
function Row({ k, v }) {
    return <div className="flex justify-between gap-3"><span className="text-slate-500">{k}</span><span className="font-semibold text-right">{v || '—'}</span></div>;
}
