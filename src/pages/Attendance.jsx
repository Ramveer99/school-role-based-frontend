import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { AvatarImg } from '../components/Avatar';

function parseClass(cls) {
    const idx = cls.lastIndexOf('-');
    if (idx <= 0) return { class_grade: cls, section: '' };
    return { class_grade: cls.slice(0, idx), section: cls.slice(idx + 1) };
}

export default function Attendance() {
    const { toast } = useToast();
    const { profile } = useAuth();
    const [students, setStudents] = useState([]);
    const [status, setStatus] = useState({});
    const [recordIds, setRecordIds] = useState({});
    const [cls, setCls] = useState('10-A');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(true);
    const [savingIds, setSavingIds] = useState({});

    const canMark = profile && ['admin', 'super_admin', 'teacher'].includes(profile.role);

    const loadStudents = useCallback(async () => {
        const s = await api.get('/api/students');
        setStudents(s);
        if (s.length) {
            const classes = Array.from(new Set(s.map((x) => `${x.class_grade}-${x.section}`)));
            setCls((prev) => (classes.includes(prev) ? prev : classes[0]));
        }
    }, []);

    const loadAttendance = useCallback(async () => {
        const { class_grade, section } = parseClass(cls);
        if (!class_grade || !section) return;

        const records = await api.get(
            `/api/attendance?class_grade=${encodeURIComponent(class_grade)}&section=${encodeURIComponent(section)}&date=${encodeURIComponent(date)}`
        );

        const nextStatus = {};
        const nextRecordIds = {};
        records.forEach((r) => {
            const studentId = r.student_id?.id || r.student_id;
            nextStatus[studentId] = r.status || 'present';
            nextRecordIds[studentId] = r.id;
        });

        students
            .filter((s) => `${s.class_grade}-${s.section}` === cls)
            .forEach((s) => {
                if (!nextStatus[s.id]) nextStatus[s.id] = 'present';
            });

        setStatus(nextStatus);
        setRecordIds(nextRecordIds);
    }, [cls, date, students]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            await loadStudents();
        }
        catch (e) {
            toast(e.message, 'error');
        }
        finally {
            setLoading(false);
        }
    }, [loadStudents, toast]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!students.length) return;
        (async () => {
            setLoading(true);
            try {
                await loadAttendance();
            }
            catch (e) {
                toast(e.message, 'error');
            }
            finally {
                setLoading(false);
            }
        })();
    }, [cls, date, students, loadAttendance, toast]);

    const filtered = students.filter((s) => `${s.class_grade}-${s.section}` === cls);
    const present = filtered.filter((s) => status[s.id] === 'present').length;
    const absent = filtered.filter((s) => status[s.id] === 'absent').length;
    const late = filtered.filter((s) => status[s.id] === 'late').length;
    const pct = filtered.length ? Math.round((present / filtered.length) * 100) : 0;

    const setStudentStatus = async (student, value) => {
        if (!canMark) {
            toast('You are not authorized to mark attendance', 'error');
            return;
        }
        if (status[student.id] === value || savingIds[student.id]) return;

        const { class_grade, section } = parseClass(cls);
        const previousStatus = status[student.id] || 'present';
        const recordId = recordIds[student.id];

        setStatus((prev) => ({ ...prev, [student.id]: value }));
        setSavingIds((prev) => ({ ...prev, [student.id]: true }));

        try {
            if (recordId) {
                await api.put(`/api/attendance/${recordId}`, { status: value });
            }
            else {
                const res = await api.post('/api/attendance', {
                    student_id: student.id,
                    class_grade,
                    section,
                    date,
                    status: value,
                });
                if (res?.record?.id) {
                    setRecordIds((prev) => ({ ...prev, [student.id]: res.record.id }));
                }
            }
        }
        catch (e) {
            setStatus((prev) => ({ ...prev, [student.id]: previousStatus }));
            toast(e.message, 'error');
        }
        finally {
            setSavingIds((prev) => {
                const next = { ...prev };
                delete next[student.id];
                return next;
            });
        }
    };

    const classOptions = Array.from(new Set(students.map((s) => `${s.class_grade}-${s.section}`)));

    return (<div className="p-4 lg:p-6">
      <h2 className="font-display font-extrabold text-xl">Attendance Management</h2>
      <p className="text-sm text-slate-500 mb-5">Mark and track daily attendance</p>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 h-fit">
          <label className="text-xs font-bold tracking-widest text-slate-500">SELECT CLASS</label>
          <select value={cls} onChange={(e) => setCls(e.target.value)} className="mt-2 w-full h-11 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-semibold">
            {classOptions.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label className="text-xs font-bold tracking-widest text-slate-500 mt-4 block">DATE</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full h-11 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm"/>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3"><div className="font-extrabold text-emerald-600">{present}</div><div className="text-[11px] font-bold text-emerald-700">Present</div></div>
            <div className="rounded-2xl bg-red-50 border border-red-100 p-3"><div className="font-extrabold text-red-600">{absent}</div><div className="text-[11px] font-bold text-red-700">Absent</div></div>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3"><div className="font-extrabold text-amber-600">{late}</div><div className="text-[11px] font-bold text-amber-700">Late</div></div>
          </div>
          <div className="mt-4"><div className="flex justify-between text-xs font-semibold mb-1.5"><span>Attendance</span><span className="text-[#2563EB]">{pct}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: pct + '%' }}></div></div></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] text-[11px] font-bold tracking-widest text-slate-500"><tr><th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">Roll</th><th className="text-center px-4 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <tr><td colSpan={3} className="py-10 text-center text-slate-400">Loading attendance...</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={3} className="py-10 text-center text-slate-400">No students in this class yet.</td></tr>}
                {!loading && filtered.map((s) => (<tr key={s.id}>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><AvatarImg src={s.avatar_url} name={s.full_name} colors="2563EB,0EA5E9" className="w-9 h-9 rounded-full bg-white object-cover"/><div className="font-semibold">{s.full_name}</div></div></td>
                    <td className="px-4 py-3 text-slate-600">{s.roll_no}</td>
                    <td className="px-4 py-3"><div className="flex justify-center gap-1">
                      {['present', 'absent', 'late'].map((k) => (<button key={k} onClick={() => setStudentStatus(s, k)} disabled={!canMark || savingIds[s.id]} className={`px-3 py-1 rounded-lg text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 ${status[s.id] === k ? (k === 'present' ? 'bg-emerald-500 text-white' : k === 'absent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white') : 'bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:hover:bg-slate-100'}`}>{k[0].toUpperCase() + k.slice(1)}</button>))}
                    </div></td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);
}
