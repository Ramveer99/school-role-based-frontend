import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { resultStudentId, gradeColor, pctToGrade, studentScore, buildRankMap } from '../lib/resultUtils';
import RecordModal, { FormField } from '../components/RecordModal';

const emptyResultForm = {
    student_id: '',
    exam_id: '',
    marks_obtained: '',
};

export default function Results() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [exams, setExams] = useState([]);
    const [roleMeta, setRoleMeta] = useState({});
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [showPostResult, setShowPostResult] = useState(false);
    const [resultForm, setResultForm] = useState(emptyResultForm);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const canManage = profile && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'teacher');
    const canPostResults = profile && (profile.role === 'admin' || profile.role === 'super_admin');

    const load = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const requests = [
                api.get('/api/exams/results'),
                api.get('/api/dashboard/stats').catch(() => null),
            ];
            if (canManage) {
                requests.push(api.get('/api/students').catch(() => []));
            }
            if (canPostResults) {
                requests.push(api.get('/api/exams').catch(() => []));
            }
            const [resultsData, dashboard, studentRows = [], examRows = []] = await Promise.all(requests);
            setResults(resultsData);
            setStudents(studentRows);
            setExams(examRows);
            setRoleMeta(dashboard?.role_specific ?? {});

            if (profile.role === 'parent') {
                const childId = dashboard?.role_specific?.children?.[0]?.id;
                if (childId) setSelectedStudentId(childId);
            } else if (profile.role !== 'student') {
                const firstWithResults = resultsData.map(resultStudentId).find(Boolean);
                setSelectedStudentId(firstWithResults || studentRows[0]?.id || '');
            }
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile, canManage, canPostResults, toast]);

    useEffect(() => { load(); }, [load]);

    const averagePerformance = useMemo(() => {
        const pool = profile?.role === 'student' || profile?.role === 'parent'
            ? results.filter((r) => !selectedStudentId || resultStudentId(r) === selectedStudentId)
            : results;
        if (!pool.length) return null;
        const { pct } = studentScore(pool);
        return pct;
    }, [results, profile, selectedStudentId]);

    const studentResults = useMemo(() => {
        if (profile?.role === 'student') return results;
        if (!selectedStudentId) return [];
        return results.filter((r) => resultStudentId(r) === selectedStudentId);
    }, [results, profile, selectedStudentId]);

    const resultSummary = useMemo(() => studentScore(studentResults), [studentResults]);

    const rankMap = useMemo(() => buildRankMap(results), [results]);
    const selectedRank = selectedStudentId ? rankMap.get(selectedStudentId) : null;

    const selectedStudent = useMemo(() => {
        if (profile?.role === 'student') {
            return {
                full_name: profile.full_name,
                class_grade: roleMeta.class_grade,
                section: roleMeta.section,
            };
        }
        const fromResult = studentResults[0];
        if (fromResult?.student_name) {
            const populated = fromResult.student_id;
            return {
                full_name: fromResult.student_name,
                class_grade: populated?.class_grade,
                section: populated?.section,
            };
        }
        const fromList = students.find((s) => s.id === selectedStudentId);
        if (fromList) return fromList;
        const child = roleMeta.children?.find((c) => c.id === selectedStudentId);
        return child || null;
    }, [profile, roleMeta, studentResults, students, selectedStudentId]);

    const studentOptions = useMemo(() => {
        if (profile?.role === 'parent') {
            return (roleMeta.children ?? []).map((c) => ({
                id: c.id,
                label: `${c.full_name} (${c.class_grade}-${c.section})`,
            }));
        }
        return students
            .map((s) => ({
                id: s.id,
                label: `${s.full_name} (${s.class_grade}-${s.section})`,
            }));
    }, [profile, roleMeta, students]);

    const canPickStudent = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'teacher' || profile?.role === 'parent';
    const studentExams = exams.filter((exam) => {
        const student = students.find((row) => row.id === resultForm.student_id);
        return student && String(exam.class_grade) === String(student.class_grade);
    });
    const selectedExam = exams.find((exam) => String(exam.id) === String(resultForm.exam_id));

    const closePostResult = () => {
        setShowPostResult(false);
        setResultForm(emptyResultForm);
    };

    const postResult = async (e) => {
        e.preventDefault();
        const obtained = Number(resultForm.marks_obtained);
        const total = Number(selectedExam?.total_marks);
        if (!resultForm.student_id || !resultForm.exam_id) {
            toast('Select a student and an exam', 'error');
            return;
        }
        if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0 || obtained < 0 || obtained > total) {
            toast(`Enter marks between 0 and ${total || 'the exam total'}`, 'error');
            return;
        }

        setSaving(true);
        try {
            await api.post('/api/exams/results', {
                exam_id: resultForm.exam_id,
                student_id: resultForm.student_id,
                marks_obtained: obtained,
            });
            toast('Result posted');
            closePostResult();
            setResults(await api.get('/api/exams/results'));
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="font-display font-extrabold text-xl">Results</h2>
                    <p className="text-sm text-slate-500">Student exam performance and grades</p>
                </div>
                {averagePerformance !== null && (
                    <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                        Avg. {averagePerformance.toFixed(1)}%
                    </span>
                )}
                {canPostResults && (
                    <button
                        type="button"
                        onClick={() => setShowPostResult(true)}
                        className="h-10 px-4 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2"
                    >
                        <i className="fa-solid fa-plus"></i> Post Result
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-16">Loading results...</div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
                        <div className="font-bold">
                            {selectedStudent
                                ? `Results — ${selectedStudent.full_name} (${selectedStudent.class_grade}-${selectedStudent.section})`
                                : 'Exam Results'}
                        </div>
                        {canPickStudent && studentOptions.length > 0 && (
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-semibold"
                                aria-label="Select student"
                            >
                                {studentOptions.map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#F8FAFC] text-xs text-slate-500">
                                <tr>
                                    <th className="text-left px-4 py-3">Subject</th>
                                    <th className="text-center px-4 py-3">Marks</th>
                                    <th className="text-center px-4 py-3">Grade</th>
                                    <th className="text-center px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {studentResults.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-slate-400">
                                            No results recorded yet.
                                        </td>
                                    </tr>
                                )}
                                {studentResults.map((r) => {
                                    const passed = (r.marks_obtained ?? 0) >= (r.passing_marks ?? 35);
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-4 py-3 font-semibold">{r.subject || r.exam_title}</td>
                                            <td className="px-4 py-3 text-center font-bold">
                                                {r.marks_obtained}/{r.total_marks}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2.5 py-1 rounded-full ${gradeColor(r.grade)} font-bold text-xs`}>
                                                    {r.grade || '—'}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-center font-semibold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {passed ? 'Pass' : 'Fail'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {studentResults.length > 0 && (
                        <div className="p-4 bg-[#F8FAFC] flex flex-wrap gap-6 text-sm">
                            <span><b>Total:</b> {resultSummary.obtained}/{resultSummary.total}</span>
                            <span><b>Percentage:</b> {resultSummary.pct.toFixed(1)}%</span>
                            <span><b>Grade:</b> {pctToGrade(resultSummary.pct)}</span>
                            {selectedRank && (
                                <span><b>Rank:</b> {selectedRank.rank}/{selectedRank.total}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            <RecordModal
                open={showPostResult}
                onClose={closePostResult}
                title="Post Student Result"
                footer={(
                    <form onSubmit={postResult} className="flex justify-end gap-3">
                        <button type="button" onClick={closePostResult} className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm">Cancel</button>
                        <button type="submit" disabled={saving || !resultForm.student_id} className="h-10 px-5 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-60">
                            {saving ? 'Posting...' : 'Post Result'}
                        </button>
                    </form>
                )}
            >
                <div className="space-y-4">
                    <FormField label="Student" required>
                        <select
                            value={resultForm.student_id}
                            onChange={(e) => setResultForm({ ...emptyResultForm, student_id: e.target.value })}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                            required
                        >
                            <option value="">Select a student first</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.full_name} ({student.class_grade}-{student.section})
                                </option>
                            ))}
                        </select>
                    </FormField>
                    {resultForm.student_id && (
                        <>
                            <FormField label="Exam" required>
                                <select value={resultForm.exam_id} onChange={(e) => setResultForm({ ...resultForm, exam_id: e.target.value, marks_obtained: '' })} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm" required>
                                    <option value="">Select an exam</option>
                                    {studentExams.map((exam) => (
                                        <option key={exam.id} value={exam.id}>{exam.title} · {exam.subject} · {exam.total_marks} marks</option>
                                    ))}
                                </select>
                                {studentExams.length === 0 && <p className="mt-1 text-xs text-amber-700">No exams are scheduled for this student’s class.</p>}
                            </FormField>
                            {selectedExam && (
                                <FormField label={`Marks Obtained (out of ${selectedExam.total_marks})`} required>
                                    <input type="number" min="0" max={selectedExam.total_marks} step="any" value={resultForm.marks_obtained} onChange={(e) => setResultForm({ ...resultForm, marks_obtained: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm" required />
                                </FormField>
                            )}
                        </>
                    )}
                </div>
            </RecordModal>
        </div>
    );
}
