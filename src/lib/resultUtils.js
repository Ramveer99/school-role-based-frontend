export function resultStudentId(r) {
    return r.student_id?.id || r.student_id;
}

export function gradeColor(grade) {
    if (!grade) return 'bg-slate-50 text-slate-600';
    if (grade === 'A+') return 'bg-violet-50 text-violet-700';
    if (grade.startsWith('A')) return 'bg-blue-50 text-[#2563EB]';
    if (grade.startsWith('B')) return 'bg-emerald-50 text-emerald-700';
    if (grade.startsWith('C')) return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-600';
}

export function pctToGrade(pct) {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    if (pct >= 35) return 'E';
    return 'F';
}

export function studentScore(results) {
    const obtained = results.reduce((sum, r) => sum + (r.marks_obtained || 0), 0);
    const total = results.reduce((sum, r) => sum + (r.total_marks || 100), 0);
    const pct = total > 0 ? (obtained / total) * 100 : 0;
    return { obtained, total, pct };
}

export function buildRankMap(allResults) {
    const byStudent = new Map();
    for (const r of allResults) {
        const id = resultStudentId(r);
        if (!id) continue;
        if (!byStudent.has(id)) byStudent.set(id, []);
        byStudent.get(id).push(r);
    }
    const ranked = [...byStudent.entries()]
        .map(([id, rows]) => ({ id, ...studentScore(rows) }))
        .sort((a, b) => b.pct - a.pct);
    const rankMap = new Map();
    ranked.forEach((entry, index) => rankMap.set(entry.id, { rank: index + 1, total: ranked.length }));
    return rankMap;
}
