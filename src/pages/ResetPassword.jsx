import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { resetPassword } from '../lib/auth';
import { useToast } from '../contexts/ToastContext';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || params.get('resetToken') || '';
  const nav = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('This reset link is missing a token. Request a new one.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await resetPassword(token, password);
      toast(data.message || 'Password has been reset successfully');
      nav('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Reset link invalid" subtitle="This page needs the token from your email.">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Open the reset link from your email, or request a new one.</p>
          <Link to="/forgot-password" className="w-full h-[46px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center justify-center">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700">New password</label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-lock text-sm"></i></span>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full h-[44px] pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">Confirm password</label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-solid fa-lock text-sm"></i></span>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              className="w-full h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="w-full h-[46px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-70">
          {loading ? 'Saving...' : 'Reset password'}
        </button>
        <Link to="/login" className="block text-center text-sm font-semibold text-[#2563EB] hover:underline">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
