import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import RecordModal, { FormField } from '../components/RecordModal';

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Final'];
const CLASSES = ['12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science', 'Commerce', 'Arts', 'Physical Education'];
const DURATIONS = ['1 Hour', '1.5 Hours', '2 Hours', '2.5 Hours', '3 Hours'];
const START_TIMES = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'];

function formatShortDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDateRange(exams) {
    if (!exams.length) return '—';
    const dates = exams.map((e) => new Date(e.date).getTime()).sort((a, b) => a - b);
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameMonth) {
        return `${start.getDate()}-${end.getDate()} ${end.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
    }
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

export default function Exams() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [exams, setExams] = useState([]);
    const [roleMeta, setRoleMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [editRecord, setEditRecord] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const canManage = profile && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'teacher');

    const load = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const [examsData, dashboard] = await Promise.all([
                api.get('/api/exams'),
                api.get('/api/dashboard/stats').catch(() => null),
            ]);
            setExams(examsData);
            setRoleMeta(dashboard?.role_specific ?? {});
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile, toast]);

    useEffect(() => { load(); }, [load]);

    const delExam = async (id) => {
        if (!confirm('Delete this examination? Associated results will also be removed.')) return;
        try {
            await api.del('/api/exams', { id });
            toast('Exam deleted');
            load();
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    const openEdit = (exam) => {
        setEditRecord(exam);
        setEditForm({
            title: exam.title || '',
            term: exam.term || 'Term 1',
            class_grade: exam.class_grade || '10',
            subject: exam.subject || 'Mathematics',
            date: exam.date ? exam.date.slice(0, 10) : '',
            start_time: exam.start_time || '09:00 AM',
            duration: exam.duration || '2 Hours',
            total_marks: exam.total_marks ?? 100,
            passing_marks: exam.passing_marks ?? 35,
        });
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!editForm.title || !editForm.class_grade || !editForm.subject || !editForm.date) {
            toast('Please fill required fields', 'error');
            return;
        }
        setSaving(true);
        try {
            await api.put(`/api/exams/${editRecord.id}`, {
                ...editForm,
                total_marks: Number(editForm.total_marks),
                passing_marks: Number(editForm.passing_marks),
            });
            toast('Exam updated');
            setEditRecord(null);
            setEditForm(null);
            load();
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = 'w-full h-11 px-3 rounded-xl border border-slate-200 text-sm';

    const classGrade = useMemo(() => {
        if (profile?.role === 'student') return roleMeta.class_grade ? String(roleMeta.class_grade) : '';
        return '';
    }, [profile, roleMeta]);

    const scopedExams = useMemo(() => {
        if (!classGrade) return exams;
        return exams.filter((e) => String(e.class_grade) === classGrade);
    }, [exams, classGrade]);

    const activeTerm = useMemo(() => {
        if (!scopedExams.length) return null;
        const counts = {};
        for (const exam of scopedExams) {
            counts[exam.term] = (counts[exam.term] || 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }, [scopedExams]);

    const termExams = useMemo(() => {
        if (!activeTerm) return [];
        return scopedExams.filter((e) => e.term === activeTerm);
    }, [scopedExams, activeTerm]);

    const examProgress = useMemo(() => {
        if (!termExams.length) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completed = termExams.filter((e) => new Date(e.date) < today).length;
        return Math.round((completed / termExams.length) * 100);
    }, [termExams]);

    const upcoming = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return scopedExams
            .filter((e) => new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);
    }, [scopedExams]);

    const activeExamTitle = termExams[0]?.title?.replace(/\s+(Exam|examination)$/i, '') || activeTerm || 'No exams scheduled';

    return (
        <div className="p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="font-display font-extrabold text-xl">Examinations</h2>
                    <p className="text-sm text-slate-500">Exam schedule and upcoming tests</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold">
                        {activeTerm || 'No term'}
                    </span>
                    {canManage && (
                        <Link to="/exams/new" className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2">
                            <i className="fa-solid fa-plus"></i> Add Exam
                        </Link>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-16">Loading exams...</div>
            ) : (
                <>
                    <div className="grid lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
                                <i className="fa-solid fa-calendar-days"></i>
                            </div>
                            <div className="font-bold">{activeExamTitle}</div>
                            <div className="text-xs text-slate-500">
                                {termExams.length
                                    ? `${formatDateRange(termExams)} • Class ${termExams[0].class_grade}`
                                    : 'No scheduled exams'}
                            </div>
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full">
                                <div
                                    className="h-full bg-[#2563EB] rounded-full transition-all"
                                    style={{ width: `${examProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <div className="font-bold mb-3">Upcoming</div>
                            <div className="space-y-3 text-sm">
                                {upcoming.length === 0 && (
                                    <div className="text-slate-400">No upcoming exams</div>
                                )}
                                {upcoming.map((e) => (
                                    <div key={e.id} className="flex justify-between">
                                        <span>{e.subject}</span>
                                        <span className="font-semibold">{formatShortDate(e.date)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {canManage ? (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b font-bold">Exam Schedule</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#F8FAFC] text-xs text-slate-500">
                                        <tr>
                                            <th className="text-left px-4 py-3">Title</th>
                                            <th className="text-left px-4 py-3">Term</th>
                                            <th className="text-left px-4 py-3">Class</th>
                                            <th className="text-left px-4 py-3">Subject</th>
                                            <th className="text-left px-4 py-3">Date</th>
                                            <th className="text-left px-4 py-3">Time</th>
                                            <th className="text-center px-4 py-3">Marks</th>
                                            <th className="text-right px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {exams.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="py-10 text-center text-slate-400">
                                                    No exams scheduled yet. Click &ldquo;Add Exam&rdquo; to create one.
                                                </td>
                                            </tr>
                                        )}
                                        {exams.map((e) => (
                                            <tr key={e.id} className="hover:bg-slate-50/60">
                                                <td className="px-4 py-3 font-semibold">{e.title}</td>
                                                <td className="px-4 py-3">{e.term}</td>
                                                <td className="px-4 py-3">{e.class_grade}</td>
                                                <td className="px-4 py-3">{e.subject}</td>
                                                <td className="px-4 py-3">{formatShortDate(e.date)}</td>
                                                <td className="px-4 py-3 text-slate-500">{e.start_time || '—'}</td>
                                                <td className="px-4 py-3 text-center">{e.total_marks}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button type="button" title="Edit" onClick={() => openEdit(e)} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500">
                                                            <i className="fa-regular fa-pen-to-square text-xs"></i>
                                                        </button>
                                                        <button type="button" title="Delete" onClick={() => delExam(e.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500">
                                                            <i className="fa-regular fa-trash-can text-xs"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b font-bold">Exam Schedule</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#F8FAFC] text-xs text-slate-500">
                                        <tr>
                                            <th className="text-left px-4 py-3">Subject</th>
                                            <th className="text-left px-4 py-3">Term</th>
                                            <th className="text-left px-4 py-3">Class</th>
                                            <th className="text-left px-4 py-3">Date</th>
                                            <th className="text-left px-4 py-3">Time</th>
                                            <th className="text-center px-4 py-3">Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {scopedExams.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-10 text-center text-slate-400">
                                                    No exams scheduled yet.
                                                </td>
                                            </tr>
                                        )}
                                        {scopedExams.map((e) => (
                                            <tr key={e.id} className="hover:bg-slate-50/60">
                                                <td className="px-4 py-3 font-semibold">{e.subject}</td>
                                                <td className="px-4 py-3">{e.term}</td>
                                                <td className="px-4 py-3">{e.class_grade}</td>
                                                <td className="px-4 py-3">{formatShortDate(e.date)}</td>
                                                <td className="px-4 py-3 text-slate-500">{e.start_time || '—'}</td>
                                                <td className="px-4 py-3 text-center">{e.total_marks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            <RecordModal
                open={!!editRecord}
                onClose={() => { setEditRecord(null); setEditForm(null); }}
                title="Edit Examination"
                footer={editForm && (
                    <form onSubmit={saveEdit} className="flex justify-end gap-3">
                        <button type="button" onClick={() => { setEditRecord(null); setEditForm(null); }} className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm">Cancel</button>
                        <button type="submit" disabled={saving} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70">{saving ? 'Saving...' : 'Save Changes'}</button>
                    </form>
                )}
            >
                {editForm && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <FormField label="Title" required>
                                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className={inputClass} />
                            </FormField>
                        </div>
                        <FormField label="Term">
                            <select value={editForm.term} onChange={e => setEditForm({ ...editForm, term: e.target.value })} className={`${inputClass} bg-white`}>
                                {TERMS.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Class" required>
                            <select value={editForm.class_grade} onChange={e => setEditForm({ ...editForm, class_grade: e.target.value })} className={`${inputClass} bg-white`}>
                                {CLASSES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Subject" required>
                            <select value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} className={`${inputClass} bg-white`}>
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Date" required>
                            <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className={inputClass} />
                        </FormField>
                        <FormField label="Start Time">
                            <select value={editForm.start_time} onChange={e => setEditForm({ ...editForm, start_time: e.target.value })} className={`${inputClass} bg-white`}>
                                {START_TIMES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Duration">
                            <select value={editForm.duration} onChange={e => setEditForm({ ...editForm, duration: e.target.value })} className={`${inputClass} bg-white`}>
                                {DURATIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Total Marks">
                            <input type="number" min={1} value={editForm.total_marks} onChange={e => setEditForm({ ...editForm, total_marks: e.target.value })} className={inputClass} />
                        </FormField>
                        <FormField label="Passing Marks">
                            <input type="number" min={0} value={editForm.passing_marks} onChange={e => setEditForm({ ...editForm, passing_marks: e.target.value })} className={inputClass} />
                        </FormField>
                    </div>
                )}
            </RecordModal>
        </div>
    );
}
