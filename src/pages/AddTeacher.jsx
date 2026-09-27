import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import ImageUploadField from '../components/ImageUploadField';
const DEPTS = ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science', 'Commerce', 'Arts', 'Physical Education'];
export default function AddTeacher() {
    const { toast } = useToast();
    const nav = useNavigate();
    const [f, setF] = useState({
        full_name: '', email: '', phone: '', employee_id: '',
        department: 'Mathematics', subjects: '', classes: '', status: 'Active', joining_date: new Date().toISOString().slice(0, 10),
    });
    const [photo, setPhoto] = useState(null);
    const [saving, setSaving] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        if (!f.full_name || !f.email || !f.employee_id) {
            toast('Please fill required fields', 'error');
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/teachers', { ...f, ...(photo ? { avatar_image: photo } : {}) });
            toast('Teacher added successfully. Login: ' + f.email + ' / password123');
            nav('/teachers');
        }
        catch (e) {
            toast(e.message || 'Failed to add teacher', 'error');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link to="/teachers" className="hover:text-[#2563EB]">Teachers</Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">Add Teacher</span>
          </div>
          <h2 className="font-display font-extrabold text-xl">Add New Teacher</h2>
          <p className="text-sm text-slate-500">Create a teacher account. A login will be generated with the default password.</p>
        </div>
        <Link to="/teachers" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold flex items-center gap-2"><i className="fa-solid fa-arrow-left"></i> Back</Link>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 font-bold">Personal & Employment Details</div>
          <div className="p-5 grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Full Name <span className="text-red-500">*</span></label>
              <input value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} placeholder="e.g. Sarah Johnson" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div className="md:col-span-2">
              <ImageUploadField
                label="Profile Photo"
                preview={photo}
                onChange={(value, error) => {
                  if (error) return toast(error.message, 'error');
                  setPhoto(value);
                }}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Email <span className="text-red-500">*</span></label>
              <input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="teacher@school.edu" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Phone</label>
              <input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+91 98765 43210" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Employee ID <span className="text-red-500">*</span></label>
              <input value={f.employee_id} onChange={e => setF({ ...f, employee_id: e.target.value })} placeholder="EMP-1024" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Department</label>
              <select value={f.department} onChange={e => setF({ ...f, department: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white">
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Subjects</label>
              <input value={f.subjects} onChange={e => setF({ ...f, subjects: e.target.value })} placeholder="Math, Statistics" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Assigned Classes</label>
              <input value={f.classes} onChange={e => setF({ ...f, classes: e.target.value })} placeholder="10-A, 10-B" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Joining Date</label>
              <input type="date" value={f.joining_date} onChange={e => setF({ ...f, joining_date: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Status</label>
              <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white">
                <option>Active</option><option>On Leave</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
            <Link to="/teachers" className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm flex items-center">Cancel</Link>
            <button type="submit" disabled={saving} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70">{saving ? 'Saving...' : 'Save Teacher'}</button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center"><i className="fa-solid fa-key"></i></div>
              <div><div className="font-bold text-sm">Login Credentials</div><div className="text-xs text-slate-500">Auto-generated on save</div></div>
            </div>
            <div className="text-xs text-slate-500 space-y-2">
              <div className="flex justify-between"><span>Email</span><span className="font-mono text-slate-800">{f.email || 'teacher@school.edu'}</span></div>
              <div className="flex justify-between"><span>Password</span><span className="font-mono text-slate-800">password123</span></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">The teacher can sign in immediately with these credentials. Ask them to change the password after first login.</p>
          </div>

          <div className="bg-[#0F172A] rounded-2xl p-5 text-white">
            <div className="font-bold text-sm mb-2">Tips</div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex gap-2"><i className="fa-solid fa-check mt-0.5 text-emerald-400"></i>Use school-issued email if possible.</li>
              <li className="flex gap-2"><i className="fa-solid fa-check mt-0.5 text-emerald-400"></i>Assign classes now to speed up attendance.</li>
              <li className="flex gap-2"><i className="fa-solid fa-check mt-0.5 text-emerald-400"></i>Teachers only see their own organization.</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>);
}
