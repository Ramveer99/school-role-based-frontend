import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AuthShell from '../components/AuthShell';
const DEMO = [
    // { role: 'super_admin', label: 'Super\nAdmin', email: 'superadmin@educore.edu', bg: 'bg-[#0F172A]', initials: 'SA', img: null },
    { role: 'admin', label: 'Admin', email: 'admin@greenwood.edu', bg: 'bg-[#2563EB]', initials: 'AD', img: null },
    { role: 'teacher', label: 'Teacher', email: 'sarah.j@greenwood.edu', bg: '', initials: 'T', img: 'https://i.pravatar.cc/100?img=32' },
    { role: 'student', label: 'Student', email: 'rahul.k@greenwood.edu', bg: '', initials: 'S', img: 'https://i.pravatar.cc/100?img=12' },
    { role: 'parent', label: 'Parent', email: 'rajesh.k@greenwood.edu', bg: '', initials: 'P', img: 'https://i.pravatar.cc/100?img=15' },
];
export default function Login() {
    const { signIn } = useAuth();
    const { toast } = useToast();
    const nav = useNavigate();
    const [params] = useSearchParams();
    useEffect(() => {
        const token = params.get('token') || params.get('resetToken');
        if (token) nav(`/reset-password?token=${encodeURIComponent(token)}`, { replace: true });
    }, [params, nav]);
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
    return (
      <AuthShell title="Welcome Back" subtitle="Sign in to your account">
        <form onSubmit={submit}>

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
              <Link to="/forgot-password" className="text-sm font-semibold text-[#2563EB] hover:underline">Forgot password?</Link>
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
      </AuthShell>
    );
}
