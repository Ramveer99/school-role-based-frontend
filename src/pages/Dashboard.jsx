import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { AvatarImg } from '../components/Avatar';

function attendanceTrend(rate) {
    if (rate >= 90) return 'Excellent';
    if (rate >= 75) return 'Good';
    return 'Needs attention';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function Dashboard() {
    const { profile } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.get('/api/dashboard/stats');
                setDashboard(data);
            } catch {
                setDashboard(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [profile]);

    if (!profile) return null;

    const counts = dashboard?.counts ?? {};
    const attendance = dashboard?.attendance ?? {};
    const fees = dashboard?.fees ?? {};
    const recentNotices = dashboard?.recent_notices ?? [];
    const roleSpecific = dashboard?.role_specific ?? {};
    const attendanceRate = attendance.rate_percentage ?? 0;
    const attendanceLabel = attendanceTrend(attendanceRate);

    const listItems = profile.role === 'parent'
        ? (roleSpecific.children ?? [])
        : (dashboard?.recent_admissions ?? []);

    const firstChild = roleSpecific.children?.[0];

    const kpis = profile.role === 'super_admin' ? [
        { label: 'Organizations', value: counts.organizations ?? 0, icon: 'fa-building', color: 'bg-blue-50 text-[#2563EB]', trend: 'Active tenants' },
        { label: 'Total Students', value: counts.students ?? 0, icon: 'fa-user-graduate', color: 'bg-violet-50 text-violet-700', trend: 'Enrolled' },
        { label: 'Total Teachers', value: counts.teachers ?? 0, icon: 'fa-chalkboard-user', color: 'bg-emerald-50 text-emerald-700', trend: 'On staff' },
        { label: 'Notices', value: counts.notices ?? 0, icon: 'fa-bullhorn', color: 'bg-amber-50 text-amber-700', trend: 'View all' },
    ] : profile.role === 'admin' ? [
        { label: 'Students', value: counts.students ?? 0, icon: 'fa-user-graduate', color: 'bg-blue-50 text-[#2563EB]', trend: 'Enrolled' },
        { label: 'Teachers', value: counts.teachers ?? 0, icon: 'fa-chalkboard-user', color: 'bg-emerald-50 text-emerald-700', trend: 'On staff' },
        { label: 'Parents', value: counts.parents ?? 0, icon: 'fa-people-roof', color: 'bg-violet-50 text-violet-700', trend: 'Linked' },
        { label: 'Attendance', value: `${attendanceRate}%`, icon: 'fa-clipboard-user', color: 'bg-amber-50 text-amber-700', trend: attendanceLabel },
    ] : profile.role === 'parent' ? [
        { label: 'Children', value: roleSpecific.children_count ?? 0, icon: 'fa-child', color: 'bg-blue-50 text-[#2563EB]', trend: 'Linked students' },
        { label: 'Attendance', value: `${attendanceRate}%`, icon: 'fa-clipboard-user', color: 'bg-emerald-50 text-emerald-700', trend: attendanceLabel },
        { label: 'Fees Pending', value: formatCurrency(fees.pending), icon: 'fa-wallet', color: 'bg-violet-50 text-violet-700', trend: `${formatCurrency(fees.collected)} collected` },
        { label: 'Notices', value: counts.notices ?? 0, icon: 'fa-bullhorn', color: 'bg-amber-50 text-amber-700', trend: 'View all' },
    ] : profile.role === 'student' ? [
        { label: 'Attendance', value: `${roleSpecific.attendance_percentage ?? attendanceRate}%`, icon: 'fa-clipboard-user', color: 'bg-emerald-50 text-emerald-700', trend: attendanceLabel },
        { label: 'Class', value: roleSpecific.class_grade ? `${roleSpecific.class_grade}-${roleSpecific.section}` : '—', icon: 'fa-school', color: 'bg-blue-50 text-[#2563EB]', trend: 'Your section' },
        { label: 'Fees Due', value: roleSpecific.pending_fees_count ?? 0, icon: 'fa-wallet', color: 'bg-violet-50 text-violet-700', trend: 'Pending invoices' },
        { label: 'Notices', value: counts.notices ?? 0, icon: 'fa-bullhorn', color: 'bg-amber-50 text-amber-700', trend: 'View all' },
    ] : [
        { label: 'Students', value: counts.students ?? 0, icon: 'fa-user-graduate', color: 'bg-blue-50 text-[#2563EB]', trend: 'In organization' },
        { label: 'Attendance', value: `${attendanceRate}%`, icon: 'fa-clipboard-user', color: 'bg-emerald-50 text-emerald-700', trend: attendanceLabel },
        { label: 'Notices', value: counts.notices ?? 0, icon: 'fa-bullhorn', color: 'bg-amber-50 text-amber-700', trend: 'View all' },
        { label: 'Parents', value: counts.parents ?? 0, icon: 'fa-people-roof', color: 'bg-violet-50 text-violet-700', trend: 'Linked' },
    ];

    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
    const showStudentList = isAdmin || profile.role === 'parent';
    const listTitle = profile.role === 'parent' ? 'My Children' : 'Recent Admissions';
    const listSubtitle = profile.role === 'parent'
        ? 'Students linked to your account'
        : 'Latest students in your organization';
    const listEmpty = profile.role === 'parent'
        ? 'No children linked yet.'
        : 'No students yet. Start by creating a new admission.';

    return (<div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl">Welcome back, {profile.full_name.split(' ')[0]} 👋</h1>
          <p className="text-sm text-slate-500">Here’s what’s happening in {profile.organization_name || 'your platform'} today.</p>
        </div>
        <div className="flex gap-2">
          {(profile.role === 'super_admin' || profile.role === 'admin') && (<Link to="/students/new" className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2"><i className="fa-solid fa-plus"></i> New Admission</Link>)}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (<div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`w-11 h-11 rounded-xl ${k.color} flex items-center justify-center mb-4`}><i className={`fa-solid ${k.icon}`}></i></div>
            <div className="text-xs font-bold tracking-widest text-slate-400">{k.label.toUpperCase()}</div>
            <div className="text-2xl font-extrabold mt-1">{loading ? '—' : k.value}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-2"><i className="fa-solid fa-arrow-trend-up mr-1"></i>{k.trend}</div>
          </div>))}
      </div>

      <div className={`grid gap-6 ${showStudentList ? 'lg:grid-cols-[1.5fr_1fr]' : ''}`}>
        {showStudentList && (<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div><div className="font-bold">{listTitle}</div><div className="text-xs text-slate-500">{listSubtitle}</div></div>
            <Link to="/students" className="text-xs font-bold text-[#2563EB]">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {!loading && listItems.length === 0 && (<div className="p-8 text-center text-sm text-slate-400">{listEmpty}</div>)}
            {listItems.map(s => (<div key={s.id} className="p-4 flex items-center gap-4">
                <AvatarImg src={s.avatar_url} name={s.full_name} colors="2563EB,0EA5E9,10B981" className="w-10 h-10 rounded-full bg-white object-cover"/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{s.full_name}</div>
                  <div className="text-xs text-slate-500">
                    {s.admission_no ? `${s.admission_no} • ` : ''}Class {s.class_grade}-{s.section}
                  </div>
                </div>
                {s.status && (<span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span>)}
              </div>))}
          </div>
        </div>)}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div><div className="font-bold">Latest Notices</div><div className="text-xs text-slate-500">Announcements & updates</div></div>
            <Link to="/notices" className="text-xs font-bold text-[#2563EB]">All</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {!loading && recentNotices.length === 0 && (<div className="p-8 text-center text-sm text-slate-400">No notices yet.</div>)}
            {recentNotices.map((n) => (<div key={n.id} className="p-4">
                <div className="flex items-start gap-2">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mt-2 ${n.color === 'emerald' ? 'bg-emerald-500' : n.color === 'amber' ? 'bg-amber-500' : n.color === 'violet' ? 'bg-violet-500' : 'bg-[#2563EB]'}`}></span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{n.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-bold tracking-wider">{n.audience?.toUpperCase()} • {new Date(n.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>))}
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-2xl p-6 text-white">
          <div className="text-xs font-bold tracking-widest opacity-80">ATTENDANCE</div>
          <div className="text-2xl font-extrabold mt-1">{loading ? '—' : `${attendanceRate}%`}</div>
          <div className="text-sm opacity-80 mt-1">{attendance.present_records ?? 0} present of {attendance.total_records ?? 0} records</div>
          <div className="h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width: `${attendanceRate}%` }}></div></div>
          <div className="text-xs mt-2 opacity-70">{attendanceLabel}</div>
        </div>
        {isAdmin && (<div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3"><i className="fa-solid fa-wallet"></i></div>
          <div className="font-bold">Fees Summary</div>
          <div className="text-sm text-slate-500 mt-1">{loading ? '—' : `${formatCurrency(fees.collected)} collected`}</div>
          <div className="text-xs mt-3 text-slate-500">{loading ? '—' : `${formatCurrency(fees.pending)} pending`}</div>
        </div>)}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3"><i className="fa-solid fa-award"></i></div>
          <div className="font-bold">{profile.role === 'parent' ? 'Child Overview' : 'Top Performance'}</div>
          <div className="text-sm text-slate-500 mt-1">
            {loading ? '—' : firstChild
                ? `Class ${firstChild.class_grade}-${firstChild.section} — ${firstChild.full_name}`
                : `Organization attendance — ${attendanceRate}%`}
          </div>
          <div className="text-xs mt-3 text-emerald-600 font-semibold"><i className="fa-solid fa-arrow-up mr-1"></i>{attendanceLabel}</div>
        </div>
      </div>
    </div>);
}
