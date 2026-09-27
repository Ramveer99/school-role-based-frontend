import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Final'];
const CLASSES = ['12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science', 'Commerce', 'Arts', 'Physical Education'];
const DURATIONS = ['1 Hour', '1.5 Hours', '2 Hours', '2.5 Hours', '3 Hours'];
const START_TIMES = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'];

const defaultForm = () => ({
    title: '',
    term: 'Term 1',
    class_grade: '10',
    subject: 'Mathematics',
    date: new Date().toISOString().slice(0, 10),
    start_time: '09:00 AM',
    duration: '2.5 Hours',
    total_marks: 100,
    passing_marks: 35,
});

export default function AddExam() {
    const { toast } = useToast();
    const nav = useNavigate();
    const [f, setF] = useState(defaultForm);
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!f.title || !f.class_grade || !f.subject || !f.date) {
            toast('Please fill required fields', 'error');
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/exams', {
                ...f,
                total_marks: Number(f.total_marks),
                passing_marks: Number(f.passing_marks),
            });
            toast('Exam scheduled successfully');
            nav('/exams');
        } catch (e) {
            toast(e.message || 'Failed to schedule exam', 'error');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = 'mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm';

    return (
        <div className="p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Link to="/exams" className="hover:text-[#2563EB]">Examinations</Link>
                        <span>/</span>
                        <span className="font-semibold text-slate-900">Add Exam</span>
                    </div>
                    <h2 className="font-display font-extrabold text-xl">Schedule New Examination</h2>
                    <p className="text-sm text-slate-500">Create an exam for a class and subject.</p>
                </div>
                <Link to="/exams" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold flex items-center gap-2">
                    <i className="fa-solid fa-arrow-left"></i> Back
                </Link>
            </div>

            <form onSubmit={submit} className="max-w-3xl">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="p-5 border-b border-slate-100 font-bold">Exam Details</div>
                    <div className="p-5 grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-600">Title <span className="text-red-500">*</span></label>
                            <input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="e.g. Mid-Term Mathematics" className={inputClass} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Term</label>
                            <select value={f.term} onChange={e => setF({ ...f, term: e.target.value })} className={`${inputClass} bg-white`}>
                                {TERMS.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Class <span className="text-red-500">*</span></label>
                            <select value={f.class_grade} onChange={e => setF({ ...f, class_grade: e.target.value })} className={`${inputClass} bg-white`}>
                                {CLASSES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Subject <span className="text-red-500">*</span></label>
                            <select value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} className={`${inputClass} bg-white`}>
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Date <span className="text-red-500">*</span></label>
                            <input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Start Time</label>
                            <select value={f.start_time} onChange={e => setF({ ...f, start_time: e.target.value })} className={`${inputClass} bg-white`}>
                                {START_TIMES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Duration</label>
                            <select value={f.duration} onChange={e => setF({ ...f, duration: e.target.value })} className={`${inputClass} bg-white`}>
                                {DURATIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Total Marks</label>
                            <input type="number" min={1} value={f.total_marks} onChange={e => setF({ ...f, total_marks: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Passing Marks</label>
                            <input type="number" min={0} value={f.passing_marks} onChange={e => setF({ ...f, passing_marks: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                    <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
                        <Link to="/exams" className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm flex items-center">Cancel</Link>
                        <button type="submit" disabled={saving} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70">
                            {saving ? 'Saving...' : 'Schedule Exam'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
