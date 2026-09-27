import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { FormField } from '../components/RecordModal';

const CLASSES = ['12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' };

const EMPTY_ROW = { time: '', mon: '', tue: '', wed: '', thu: '', fri: '' };

const DEFAULT_SCHEDULE = [
    { time: '09:00 - 09:45', mon: 'Math', tue: 'Science', wed: 'English', thu: 'Social', fri: 'Math' },
    { time: '09:45 - 10:30', mon: 'Science', tue: 'Math', wed: 'Social', thu: 'English', fri: 'Math' },
    { time: '10:30 - 11:00', mon: 'BREAK', tue: 'BREAK', wed: 'BREAK', thu: 'BREAK', fri: 'BREAK' },
    { time: '11:00 - 11:45', mon: 'English', tue: 'Social', wed: 'Math', thu: 'Science', fri: 'English' },
    { time: '11:45 - 12:30', mon: 'Social', tue: 'English', wed: 'Science', thu: 'Math', fri: 'PE' },
    { time: '12:30 - 01:15', mon: 'PE', tue: 'CS', wed: 'Art', thu: 'CS', fri: 'Library' },
];

function cloneSchedule(schedule) {
    return (schedule || []).map((row) => ({ ...row }));
}

export default function Timetable() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [timetables, setTimetables] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(null);

    const canManage = profile && ['admin', 'super_admin', 'teacher'].includes(profile.role);
    const canDelete = profile && ['admin', 'super_admin'].includes(profile.role);

    const load = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const data = await api.get('/api/timetable');
            setTimetables(data);
            setSelectedId((prev) => {
                if (prev && data.some((t) => t.id === prev)) return prev;
                return data[0]?.id || '';
            });
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile, toast]);

    useEffect(() => { load(); }, [load]);

    const selected = useMemo(
        () => timetables.find((t) => t.id === selectedId) || timetables[0] || null,
        [timetables, selectedId]
    );

    const schedule = selected?.schedule || [];

    const openCreate = () => {
        setForm({
            class_grade: '10',
            section: 'A',
            schedule: cloneSchedule(DEFAULT_SCHEDULE),
        });
        setModal('create');
    };

    const openEdit = () => {
        if (!selected) return;
        setForm({
            class_grade: selected.class_grade,
            section: selected.section,
            schedule: cloneSchedule(selected.schedule),
        });
        setModal('edit');
    };

    const closeModal = () => {
        setModal(null);
        setForm(null);
    };

    const updateRow = (index, field, value) => {
        setForm((prev) => {
            const schedule = [...prev.schedule];
            schedule[index] = { ...schedule[index], [field]: value };
            return { ...prev, schedule };
        });
    };

    const addRow = () => {
        setForm((prev) => ({ ...prev, schedule: [...prev.schedule, { ...EMPTY_ROW }] }));
    };

    const removeRow = (index) => {
        setForm((prev) => ({
            ...prev,
            schedule: prev.schedule.filter((_, i) => i !== index),
        }));
    };

    const saveTimetable = async (e) => {
        e.preventDefault();
        if (!form?.class_grade || !form?.section) {
            toast('Class and section are required', 'error');
            return;
        }
        if (!form.schedule.length) {
            toast('Add at least one time slot', 'error');
            return;
        }
        if (form.schedule.some((row) => !row.time?.trim())) {
            toast('Each row needs a time slot', 'error');
            return;
        }

        const payload = {
            class_grade: form.class_grade,
            section: form.section,
            schedule: form.schedule.map((row) => ({
                time: row.time.trim(),
                mon: row.mon?.trim() || '',
                tue: row.tue?.trim() || '',
                wed: row.wed?.trim() || '',
                thu: row.thu?.trim() || '',
                fri: row.fri?.trim() || '',
            })),
        };

        setSaving(true);
        try {
            if (modal === 'create') {
                await api.post('/api/timetable', payload);
                toast('Timetable created');
            } else {
                await api.put(`/api/timetable/${selected.id}`, payload);
                toast('Timetable updated');
            }
            closeModal();
            load();
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteTimetable = async () => {
        if (!selected) return;
        if (!confirm(`Delete timetable for Class ${selected.class_grade}-${selected.section}?`)) return;
        try {
            await api.del(`/api/timetable/${selected.id}`);
            toast('Timetable deleted');
            setSelectedId('');
            load();
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    const inputClass = 'w-full h-9 px-2 rounded-lg border border-slate-200 text-sm';
    const title = selected
        ? `Class Timetable — ${selected.class_grade}-${selected.section}`
        : 'Class Timetable';

    return (
        <div className="p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="font-display font-extrabold text-xl">{title}</h2>
                    <p className="text-sm text-slate-500">Weekly schedule</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {timetables.length > 1 && (
                        <select
                            value={selected?.id || ''}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                        >
                            {timetables.map((t) => (
                                <option key={t.id} value={t.id}>
                                    Class {t.class_grade}-{t.section}
                                </option>
                            ))}
                        </select>
                    )}
                    {canManage && selected && (
                        <button
                            type="button"
                            onClick={openEdit}
                            className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50"
                        >
                            <i className="fa-regular fa-pen-to-square mr-2"></i>
                            Edit Schedule
                        </button>
                    )}
                    {canDelete && selected && (
                        <button
                            type="button"
                            onClick={deleteTimetable}
                            className="h-10 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
                        >
                            <i className="fa-regular fa-trash-can mr-2"></i>
                            Delete
                        </button>
                    )}
                    {canManage && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2"
                        >
                            <i className="fa-solid fa-plus"></i>
                            Add Timetable
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-16">Loading timetable...</div>
            ) : !selected ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
                    No timetable found.
                    {canManage && ' Click "Add Timetable" to create one.'}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                        <thead>
                            <tr className="bg-[#0F172A] text-white text-xs">
                                <th className="px-4 py-3 text-left">Time</th>
                                {DAYS.map((d) => (
                                    <th key={d} className="px-4 py-3 text-center">{DAY_LABELS[d]}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {schedule.map((r, i) => (
                                <tr key={i} className={r.mon === 'BREAK' ? 'bg-amber-50/50' : ''}>
                                    <td className="px-4 py-3 font-semibold text-slate-600">{r.time}</td>
                                    {DAYS.map((d) => (
                                        <td key={d} className="px-4 py-3 text-center">
                                            {r[d] === 'BREAK' ? (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                                                    BREAK
                                                </span>
                                            ) : (
                                                r[d] || '—'
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {form && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={closeModal} aria-hidden="true" />
                    <div
                        className="relative bg-white rounded-2xl border border-slate-200 shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold">
                                {modal === 'create' ? 'Add Timetable' : 'Edit Timetable'}
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"
                                aria-label="Close"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form onSubmit={saveTimetable} className="flex flex-col flex-1 min-h-0">
                            <div className="p-5 overflow-y-auto flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4 max-w-md">
                                    <FormField label="Class" required>
                                        <select
                                            value={form.class_grade}
                                            onChange={(e) => setForm({ ...form, class_grade: e.target.value })}
                                            disabled={modal === 'edit'}
                                            className={`${inputClass} bg-white disabled:bg-slate-50 disabled:text-slate-500`}
                                        >
                                            {CLASSES.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    <FormField label="Section" required>
                                        <select
                                            value={form.section}
                                            onChange={(e) => setForm({ ...form, section: e.target.value })}
                                            disabled={modal === 'edit'}
                                            className={`${inputClass} bg-white disabled:bg-slate-50 disabled:text-slate-500`}
                                        >
                                            {SECTIONS.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </FormField>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-600">Weekly Schedule</span>
                                        <button
                                            type="button"
                                            onClick={addRow}
                                            className="text-xs font-bold text-[#2563EB] hover:underline"
                                        >
                                            + Add Row
                                        </button>
                                    </div>
                                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                                        <table className="w-full text-sm min-w-[640px]">
                                            <thead className="bg-slate-50 text-xs text-slate-500">
                                                <tr>
                                                    <th className="px-2 py-2 text-left w-36">Time</th>
                                                    {DAYS.map((d) => (
                                                        <th key={d} className="px-2 py-2 text-left">{DAY_LABELS[d]}</th>
                                                    ))}
                                                    <th className="px-2 py-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {form.schedule.map((row, i) => (
                                                    <tr key={i}>
                                                        <td className="p-2">
                                                            <input
                                                                value={row.time}
                                                                onChange={(e) => updateRow(i, 'time', e.target.value)}
                                                                placeholder="09:00 - 09:45"
                                                                className={inputClass}
                                                            />
                                                        </td>
                                                        {DAYS.map((d) => (
                                                            <td key={d} className="p-2">
                                                                <input
                                                                    value={row[d]}
                                                                    onChange={(e) => updateRow(i, d, e.target.value)}
                                                                    placeholder="Subject"
                                                                    className={inputClass}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="p-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRow(i)}
                                                                className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500"
                                                                title="Remove row"
                                                            >
                                                                <i className="fa-regular fa-trash-can text-xs"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 border-t border-slate-100 shrink-0 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70"
                                >
                                    {saving ? 'Saving...' : modal === 'create' ? 'Create Timetable' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
