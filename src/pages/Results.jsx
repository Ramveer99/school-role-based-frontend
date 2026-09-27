import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { resultStudentId, gradeColor, pctToGrade, studentScore, buildRankMap } from '../lib/resultUtils';

export default function Results() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [roleMeta, setRoleMeta] = useState({});
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [loading, setLoading] = useState(true);

    const canManage = profile && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'teacher');

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
            const [resultsData, dashboard, studentRows = []] = await Promise.all(requests);
            setResults(resultsData);
            setStudents(studentRows);
            setRoleMeta(dashboard?.role_specific ?? {});

            if (profile.role === 'parent') {
                const childId = dashboard?.role_specific?.children?.[0]?.id;
                if (childId) setSelectedStudentId(childId);
            } else if (profile.role !== 'student') {
                const firstWithResults = resultsData.map(resultStudentId).find(Boolean);
                if (firstWithResults) setSelectedStudentId(firstWithResults);
            }
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [profile, canManage, toast]);

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
        const idsWithResults = new Set(results.map(resultStudentId));
        return students
            .filter((s) => idsWithResults.has(s.id))
            .map((s) => ({
                id: s.id,
                label: `${s.full_name} (${s.class_grade}-${s.section})`,
            }));
    }, [profile, roleMeta, students, results]);

    const canPickStudent = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'teacher' || profile?.role === 'parent';

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
                        {canPickStudent && studentOptions.length > 1 && (
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-semibold"
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
        </div>
    );
}
