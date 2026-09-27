import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const SUBTITLE = {
  super_admin: 'All classes across your organization',
  admin: 'All classes across your organization',
  teacher: 'Classes assigned to you',
  student: 'Your class',
  parent: "Your child's class",
};

export default function Classes() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const subtitle = useMemo(() => SUBTITLE[profile?.role] || 'Classes', [profile?.role]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setRows(await api.get('/api/classes'));
      }
      catch (e) {
        toast(e.message, 'error');
      }
      finally {
        setLoading(false);
      }
    })();
  }, []);
  return (<div className="p-4 lg:p-6">
    <div className="mb-5"><h2 className="font-display font-extrabold text-xl">Classes</h2><p className="text-sm text-slate-500">{subtitle}</p></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading && <div className="col-span-full text-center text-slate-400 py-8">Loading...</div>}
      {!loading && rows.length === 0 && <div className="col-span-full text-center text-slate-400 py-8 bg-white rounded-2xl border border-slate-200">No classes yet.</div>}
      {rows.map((c) => (<div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white font-extrabold flex items-center justify-center">{c.grade}{c.section}</div>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">{c.student_count} students</span>
        </div>
        <div className="font-bold">Class {c.grade}-{c.section}</div>
        <div className="text-xs text-slate-500 mt-1">Teacher: {c.teacher_name || <span className="text-slate-400">Unassigned</span>}</div>
        <div className="mt-4 flex gap-3 text-xs text-slate-500"><span><i className="fa-solid fa-book mr-1"></i>{c.subjects || 'All subjects'}</span></div>
      </div>))}
    </div>
  </div>);
}
