import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const BCRYPT_PREFIX = /^\$2[aby]\$/;

function passwordError(value) {
    if (!value || !value.trim()) return 'Password cannot be blank.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    if (new TextEncoder().encode(value).length > 72) return 'Password must be at most 72 UTF-8 bytes.';
    if (BCRYPT_PREFIX.test(value)) return 'Password cannot start with a bcrypt hash prefix.';
    return '';
}

export default function DefaultPassword() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [orgs, setOrgs] = useState([]);
    const [orgId, setOrgId] = useState('');
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [current, setCurrent] = useState('');
    const [revealed, setRevealed] = useState(false);
    const [nextPassword, setNextPassword] = useState('');
    const [showNext, setShowNext] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile?.role !== 'super_admin') return;
        let active = true;
        (async () => {
            setLoadingOrgs(true);
            try {
                const rows = await api.get('/api/organizations');
                if (!active) return;
                const list = Array.isArray(rows) ? rows : [];
                setOrgs(list);
                if (list.length === 1) setOrgId(String(list[0].id || list[0]._id));
            }
            catch (e) {
                if (active) toast(e.message || 'Could not load organizations', 'error');
            }
            finally {
                if (active) setLoadingOrgs(false);
            }
        })();
        return () => { active = false; };
    }, [profile?.role]);

    const loadPassword = async (id) => {
        if (!id) {
            setCurrent('');
            return;
        }
        setLoadingPassword(true);
        setRevealed(false);
        try {
            const data = await api.get(`/api/organizations/${id}/default-password`);
            setCurrent(data?.default_password || '');
        }
        catch (e) {
            setCurrent('');
            toast(e.message || 'Could not load the school default password', 'error');
        }
        finally {
            setLoadingPassword(false);
        }
    };

    useEffect(() => {
        if (!orgId) return;
        loadPassword(orgId);
    }, [orgId]);

    const save = async (e) => {
        e.preventDefault();
        if (!orgId) {
            toast('Select an organization first', 'error');
            return;
        }
        const error = passwordError(nextPassword);
        if (error) {
            toast(error, 'error');
            return;
        }
        setSaving(true);
        try {
            const data = await api.put(`/api/organizations/${orgId}/default-password`, {
                default_password: nextPassword,
            });
            setCurrent(data?.default_password || nextPassword);
            setNextPassword('');
            setShowNext(false);
            toast('Default password updated. Existing accounts are unchanged.');
        }
        catch (err) {
            toast(err.message || 'Could not update the default password', 'error');
        }
        finally {
            setSaving(false);
        }
    };

    if (profile?.role !== 'super_admin') {
        return <div className="p-6 text-slate-500">Only the Super Admin can access this section.</div>;
    }

    const selected = orgs.find((o) => String(o.id || o._id) === orgId);

    return (
        <div className="p-4 lg:p-6 max-w-3xl">
            <div className="mb-5">
                <h2 className="font-display font-extrabold text-xl">Default Password</h2>
                <p className="text-sm text-slate-500">View and set the school password used when new accounts are created.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div className="p-5 border-b border-slate-100 font-bold">School</div>
                <div className="p-5">
                    <label className="text-xs font-bold text-slate-600">Organization</label>
                    <select
                        value={orgId}
                        onChange={(e) => setOrgId(e.target.value)}
                        disabled={loadingOrgs}
                        className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                        <option value="">{loadingOrgs ? 'Loading schools...' : 'Select a school'}</option>
                        {orgs.map((o) => {
                            const id = String(o.id || o._id);
                            return <option key={id} value={id}>{o.name}{o.code ? ` (${o.code})` : ''}</option>;
                        })}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="font-bold">Current default</div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-400">GET</span>
                </div>
                <div className="p-5">
                    {!orgId && <p className="text-sm text-slate-400">Select a school to load its default password.</p>}
                    {orgId && loadingPassword && <p className="text-sm text-slate-400">Loading...</p>}
                    {orgId && !loadingPassword && (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center font-mono text-sm tracking-wide">
                                {current ? (revealed ? current : '••••••••') : 'No default password set'}
                            </div>
                            {current && (
                                <button
                                    type="button"
                                    onClick={() => setRevealed((v) => !v)}
                                    className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50"
                                >
                                    <i className={`fa-solid ${revealed ? 'fa-eye-slash' : 'fa-eye'} mr-2`}></i>
                                    {revealed ? 'Hide' : 'Show'}
                                </button>
                            )}
                        </div>
                    )}
                    {selected && (
                        <p className="mt-3 text-xs text-slate-500">
                            <i className="fa-solid fa-building mr-1.5"></i>
                            {selected.name}{selected.code ? ` · ${selected.code}` : ''}
                        </p>
                    )}
                </div>
            </div>

            <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="font-bold">Set default password</div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-400">PUT</span>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-[#1D4ED8]">
                        <i className="fa-solid fa-circle-info mr-2"></i>
                        Applies to future account creation only. Existing account passwords stay the same.
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600">New default password <span className="text-red-500">*</span></label>
                        <div className="mt-1.5 flex items-center gap-3">
                            <input
                                type={showNext ? 'text' : 'password'}
                                value={nextPassword}
                                onChange={(e) => setNextPassword(e.target.value)}
                                placeholder="SchoolWelcome123!"
                                autoComplete="new-password"
                                className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNext((v) => !v)}
                                className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50"
                            >
                                {showNext ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">8 to 72 characters. Blank values and bcrypt hash prefixes are rejected.</p>
                    </div>
                </div>
                <div className="p-5 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || !orgId}
                        className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70"
                    >
                        {saving ? 'Saving...' : 'Update password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
