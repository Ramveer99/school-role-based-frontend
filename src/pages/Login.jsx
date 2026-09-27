import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestPasswordReset } from '../lib/auth';
import { useToast } from '../contexts/ToastContext';
const DEMO = [
    { role: 'super_admin', label: 'Super\nAdmin', email: 'superadmin@educore.edu', bg: 'bg-[#0F172A]', initials: 'SA', img: null },
    { role: 'admin', label: 'Admin', email: 'admin@greenwood.edu', bg: 'bg-[#2563EB]', initials: 'AD', img: null },
    { role: 'teacher', label: 'Teacher', email: 'sarah.j@greenwood.edu', bg: '', initials: 'T', img: 'https://i.pravatar.cc/100?img=32' },
    { role: 'student', label: 'Student', email: 'rahul.k@greenwood.edu', bg: '', initials: 'S', img: 'https://i.pravatar.cc/100?img=12' },
    { role: 'parent', label: 'Parent', email: 'rajesh.k@greenwood.edu', bg: '', initials: 'P', img: 'https://i.pravatar.cc/100?img=15' },
];
export default function Login() {
    const { signIn } = useAuth();
    const { toast } = useToast();
    const nav = useNavigate();
    const [email, setEmail] = useState('superadmin@educore.edu');
    const [password, setPassword] = useState('password123');
    const [remember, setRemember] = useState(true);
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailErr, setEmailErr] = useState('');
    const [passErr, setPassErr] = useState('');
    const submit = async (e) => {
        e?.preventDefault();
        let ok = true;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailErr('Please enter a valid email');
            ok = false;
        }
        else
            setEmailErr('');
        if (!password || password.length < 6) {
            setPassErr('Password must be at least 6 characters');
            ok = false;
        }
        else
            setPassErr('');
        if (!ok)
            return;
        setLoading(true);
        try {
            await signIn(email, password);
            toast('Welcome back!');
            nav('/dashboard');
        }
        catch (err) {
            toast(err.message || 'Login failed', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const quick = async (e) => {
        setEmail(e);
        setPassword('password123');
        setLoading(true);
        try {
            await signIn(e, 'password123');
            toast('Welcome back!');
            nav('/dashboard');
        }
        catch (err) {
            toast(err.message || 'Login failed', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-[#F1F5F9]">
      <div className="w-full max-w-[1080px] bg-white rounded-[28px] shadow-[0_20px_60px_-16px_rgba(15,23,42,.12)] border border-slate-200 overflow-hidden grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:flex flex-col p-10 bg-[#0F172A] text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-[#2563EB] rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute -bottom-20 -left-20 w-[380px] h-[380px] bg-[#0EA5E9] rounded-full blur-[80px] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-14">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white"><i className="fa-solid fa-graduation-cap"></i></div>
              <div><div className="font-display font-extrabold text-[17px] leading-none">EduCore</div><div className="text-[11px] tracking-[0.18em] text-slate-400 font-semibold">SCHOOL MANAGEMENT</div></div>
            </div>
            <h2 className="font-display text-[34px] font-extrabold leading-[0.95] mb-4">Empowering<br />Education<br /><span className="text-[#60A5FA]">Management.</span></h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-[360px]">A unified platform for administrators, teachers, students and parents — simple, fast and secure.</p>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i className="fa-solid fa-check text-xs"></i></span> Role-based access & permissions</div>
              <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i className="fa-solid fa-check text-xs"></i></span> Multi-tenant organizations</div>
              <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i className="fa-solid fa-check text-xs"></i></span> Trusted by 1,200+ schools</div>
            </div>
            <div className="mt-10 bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <img src="https://i.pravatar.cc/100?img=33" className="w-10 h-10 rounded-full object-cover"/>
              <div className="flex-1"><div className="text-sm font-semibold">“EduCore cut our admin time by 60%.”</div><div className="text-xs text-slate-400">— Principal, Greenwood Academy</div></div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-7 lg:p-10">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white"><i className="fa-solid fa-graduation-cap"></i></div>
            <div><div className="font-display font-extrabold leading-none">EduCore</div><div className="text-[11px] tracking-widest text-slate-500 font-semibold">SCHOOL MANAGEMENT</div></div>
          </div>
          <h1 className="font-display text-[26px] font-extrabold leading-none">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-2 mb-7">Sign in to your account</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-regular fa-envelope text-sm"></i></span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu" className="w-full h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400"/>
              </div>
              {emailErr && <p className="text-xs text-red-500 mt-1.5">{emailErr}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-lock text-sm"></i></span>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-[44px] pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm"/>
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i></button>
              </div>
              {passErr && <p className="text-xs text-red-500 mt-1.5">{passErr}</p>}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#2563EB]"/> Remember me
              </label>
              <button type="button" onClick={async () => {
                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setEmailErr('Enter your email above first');
                  return;
                }
                try {
                  const data = await requestPasswordReset(email);
                  toast(data.message || 'If that email exists, a reset link was sent.');
                  if (data.resetToken) {
                    console.info('Dev reset token:', data.resetToken);
                  }
                }
                catch (err) {
                  toast(err.message || 'Could not send reset email', 'error');
                }
              }} className="text-sm font-semibold text-[#2563EB] hover:underline">Forgot password?</button>
            </div>
            <button type="submit" disabled={loading} className="w-full h-[46px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-70">
              {loading ? (<><span>Signing in...</span><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span></>) : (<><span>Sign In</span><i className="fa-solid fa-arrow-right text-xs"></i></>)}
            </button>
          </div>

          <div className="mt-7">
            <div className="flex items-center gap-3 mb-4"><div className="h-px flex-1 bg-slate-200"></div><span className="text-[11px] font-semibold tracking-widest text-slate-400">DEMO ACCOUNTS</span><div className="h-px flex-1 bg-slate-200"></div></div>
            <div className="grid grid-cols-5 gap-2">
              {DEMO.map(d => (<button key={d.role} type="button" onClick={() => quick(d.email)} className="group flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-slate-200 hover:border-[#2563EB] hover:bg-blue-50 transition">
                  {d.img ? <img src={d.img} className="w-9 h-9 rounded-full object-cover"/> : <span className={`w-9 h-9 rounded-full ${d.bg} text-white flex items-center justify-center text-xs font-bold`}>{d.initials}</span>}
                  <span className="text-[10px] font-semibold leading-none text-slate-700 whitespace-pre-line text-center">{d.label}</span>
                </button>))}
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">Click any role to instantly login • Password is <b>password123</b></p>
          </div>
        </form>
      </div>
    </div>);
}
