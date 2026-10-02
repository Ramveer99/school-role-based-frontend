import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { requestPasswordReset } from '../lib/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr('Please enter a valid email');
      return;
    }
    setEmailErr('');
    setError('');
    setLoading(true);
    try {
      const data = await requestPasswordReset(email.trim());
      setNotice(data.message || `Password reset link sent to ${email.trim()}.`);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={sent ? 'Check your email' : 'Forgot password'}
      subtitle={sent ? 'Open that inbox and use the reset button in the email.' : 'Enter your account email and we will send the reset link there.'}
    >
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
            {notice} It expires in 1 hour.
          </div>
          <Link to="/login" className="w-full h-[46px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center justify-center gap-2">
            Back to sign in
          </Link>
          <button type="button" onClick={() => setSent(false)} className="w-full text-sm font-semibold text-[#2563EB] hover:underline">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-regular fa-envelope text-sm"></i></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                autoComplete="email"
                className="w-full h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400"
              />
            </div>
            {emailErr && <p className="text-xs text-red-500 mt-1.5">{emailErr}</p>}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full h-[46px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-70">
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
          <Link to="/login" className="block text-center text-sm font-semibold text-[#2563EB] hover:underline">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
