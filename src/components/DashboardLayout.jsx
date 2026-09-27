import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MENU } from './menu';
import { useToast } from '../contexts/ToastContext';
import { resolveAvatarUrl } from '../lib/avatar';
const roleLabel = {
    super_admin: 'Super Admin', admin: 'Admin', teacher: 'Teacher', student: 'Student', parent: 'Parent',
};
export default function DashboardLayout() {
    const { profile, signOut } = useAuth();
    const { toast } = useToast();
    const nav = useNavigate();
    const loc = useLocation();
    const [sbOpen, setSbOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [pmOpen, setPmOpen] = useState(false);
    useEffect(() => { setSbOpen(false); setNotifOpen(false); setPmOpen(false); }, [loc.pathname]);
    const items = useMemo(() => (profile ? MENU[profile.role] : []), [profile]);
    const crumb = useMemo(() => {
        const seg = loc.pathname.split('/').filter(Boolean)[0] || 'dashboard';
        const found = items.find(i => i.path === '/' + seg);
        if (found)
            return found.label;
        return seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }, [loc.pathname, items]);
    if (!profile)
        return null;
    const avatar = resolveAvatarUrl(profile.avatar_url, profile.full_name, '2563EB,0EA5E9,0F172A,10B981,F59E0B');
    return (<div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-[272px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sbOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-[68px] flex items-center px-5 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white"><i className="fa-solid fa-graduation-cap text-sm"></i></div>
          <div className="ml-3">
            <div className="font-display font-extrabold text-[15px] leading-none">EduCore</div>
            <div className="text-[10px] tracking-[0.14em] font-bold text-slate-400">SCHOOL ERP</div>
          </div>
          <button onClick={() => setSbOpen(false)} className="ml-auto lg:hidden w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="px-4 py-4">
          <div className={`flex items-center gap-3 px-3 py-3 rounded-2xl border ${profile.role === 'super_admin' ? 'bg-[#0F172A] text-white border-slate-800' : 'bg-[#F8FAFC] border-slate-200'}`}>
            <img src={avatar} className="w-9 h-9 rounded-full object-cover bg-white"/>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{profile.full_name}</div>
              <div className={`text-xs ${profile.role === 'super_admin' ? 'text-slate-400' : 'text-slate-500'}`}>{roleLabel[profile.role]}{profile.organization_name ? ` • ${profile.organization_name}` : ''}</div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {items.map(it => (<NavLink key={it.id} to={it.path} end={it.path === '/dashboard'} className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-[#2563EB] text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
              <i className={`fa-solid ${it.icon} w-5 text-[13px]`}></i>
              <span className="flex-1 text-left">{it.label}</span>
              {it.badge && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
            </NavLink>))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="bg-[#0F172A] rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full"></div>
            <div className="text-xs font-semibold text-white/80">Need help?</div>
            <div className="text-sm font-bold">Support Center</div>
            <button onClick={() => toast('Support ticket created')} className="mt-3 w-full h-8 rounded-xl bg-white text-slate-900 text-xs font-bold">Contact Support</button>
          </div>
          <button onClick={async () => { await signOut(); nav('/login'); }} className="mt-3 w-full h-10 rounded-xl border border-slate-200 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50">
            <i className="fa-solid fa-right-from-bracket text-xs"></i> Log Out
          </button>
        </div>
      </aside>
      {sbOpen && <div onClick={() => setSbOpen(false)} className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"></div>}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <header className="h-[68px] bg-white border-b border-slate-200 flex items-center gap-4 px-4 lg:px-6 shrink-0 sticky top-0 z-20">
          <button onClick={() => setSbOpen(true)} className="lg:hidden w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center"><i className="fa-solid fa-bars"></i></button>
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <Link to="/dashboard" className="text-slate-400 hover:text-slate-600">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">{crumb}</span>
          </div>
          <div className="flex-1 lg:max-w-[420px] relative hidden md:block">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input placeholder="Search students, teachers, classes..." className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm placeholder:text-slate-400"/>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:gap-3 relative">
            <button onClick={() => { setNotifOpen(!notifOpen); setPmOpen(false); }} className="relative w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50">
              <i className="fa-regular fa-bell text-slate-600"></i>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">3</span>
            </button>
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden lg:block">
                <div className="text-sm font-semibold leading-none">{profile.full_name}</div>
                <div className="text-xs text-slate-500">{roleLabel[profile.role]}</div>
              </div>
              <button onClick={() => { setPmOpen(!pmOpen); setNotifOpen(false); }} className="relative">
                <img src={avatar} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow bg-white"/>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </button>
            </div>
            {notifOpen && (<div className="absolute right-0 top-[52px] w-[360px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-30">
                <div className="p-4 border-b flex items-center justify-between"><span className="font-bold">Notifications</span><span className="text-xs bg-blue-50 text-[#2563EB] px-2 py-1 rounded-full font-semibold">3 new</span></div>
                <div className="divide-y max-h-[320px] overflow-y-auto">
                  <div className="p-4 flex gap-3 hover:bg-slate-50"><span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-triangle-exclamation text-xs"></i></span><div><div className="text-sm font-semibold">Fee payment overdue — Class 10-A</div><div className="text-xs text-slate-500">2 hours ago</div></div></div>
                  <div className="p-4 flex gap-3 hover:bg-slate-50"><span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-file-lines text-xs"></i></span><div><div className="text-sm font-semibold">New assignment: Mathematics</div><div className="text-xs text-slate-500">5 hours ago</div></div></div>
                  <div className="p-4 flex gap-3 hover:bg-slate-50"><span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-check text-xs"></i></span><div><div className="text-sm font-semibold">Attendance submitted — 10-A</div><div className="text-xs text-slate-500">Yesterday</div></div></div>
                </div>
                <button onClick={() => setNotifOpen(false)} className="w-full py-3 text-sm font-semibold text-[#2563EB] bg-slate-50">View all notifications</button>
              </div>)}
            {pmOpen && (<div className="absolute right-0 top-[52px] w-[240px] bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30">
                <div className="px-3 py-3 flex items-center gap-3"><img src={avatar} className="w-10 h-10 rounded-full bg-white"/><div><div className="text-sm font-semibold">{profile.full_name}</div><div className="text-xs text-slate-500 truncate w-[140px]">{profile.email}</div></div></div>
                <div className="h-px bg-slate-100 my-1"></div>
                <Link to="/profile" onClick={() => setPmOpen(false)} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2"><i className="fa-regular fa-user w-4"></i> My Profile</Link>
                <Link to="/settings" onClick={() => setPmOpen(false)} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm flex items-center gap-2"><i className="fa-solid fa-gear w-4"></i> Settings</Link>
                <button onClick={async () => { await signOut(); nav('/login'); }} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 text-sm flex items-center gap-2"><i className="fa-solid fa-right-from-bracket w-4"></i> Logout</button>
              </div>)}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>);
}
