import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import ImageUploadField from '../components/ImageUploadField';
export default function AddParent() {
    const { toast } = useToast();
    const nav = useNavigate();
    const [f, setF] = useState({
        full_name: '', email: '', phone: '', occupation: '', address: '',
    });
    const [photo, setPhoto] = useState(null);
    const [saving, setSaving] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        if (!f.full_name || !f.email) {
            toast('Full name and email required', 'error');
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/parents', { ...f, ...(photo ? { avatar_image: photo } : {}) });
            toast('Parent added. Login: ' + f.email + ' / password123');
            nav('/parents');
        }
        catch (e) {
            toast(e.message || 'Failed to add parent', 'error');
        }
        finally {
            setSaving(false);
        }
    };
    return (<div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link to="/parents" className="hover:text-[#2563EB]">Parents</Link>
            <span>/</span><span className="font-semibold text-slate-900">Add Parent</span>
          </div>
          <h2 className="font-display font-extrabold text-xl">Add New Parent</h2>
          <p className="text-sm text-slate-500">Create a parent account with the default password.</p>
        </div>
        <Link to="/parents" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold flex items-center gap-2"><i className="fa-solid fa-arrow-left"></i> Back</Link>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 font-bold">Parent Information</div>
          <div className="p-5 grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Full Name <span className="text-red-500">*</span></label>
              <input value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} placeholder="e.g. Rajesh Kumar" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
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
              <input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="parent@example.com" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Phone</label>
              <input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+91 98765 43210" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Occupation</label>
              <input value={f.occupation} onChange={e => setF({ ...f, occupation: e.target.value })} placeholder="Software Engineer" className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"/>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Address</label>
              <textarea value={f.address} onChange={e => setF({ ...f, address: e.target.value })} rows={3} placeholder="Full address..." className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"/>
            </div>
          </div>
          <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
            <Link to="/parents" className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm flex items-center">Cancel</Link>
            <button type="submit" disabled={saving} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70">{saving ? 'Saving...' : 'Save Parent'}</button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center"><i className="fa-solid fa-key"></i></div>
              <div><div className="font-bold text-sm">Login Credentials</div><div className="text-xs text-slate-500">Auto-generated on save</div></div>
            </div>
            <div className="text-xs text-slate-500 space-y-2">
              <div className="flex justify-between"><span>Email</span><span className="font-mono text-slate-800">{f.email || 'parent@example.com'}</span></div>
              <div className="flex justify-between"><span>Password</span><span className="font-mono text-slate-800">password123</span></div>
            </div>
          </div>
        </aside>
      </form>
    </div>);
}
