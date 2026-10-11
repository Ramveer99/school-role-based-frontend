import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import RecordModal, { FormField } from '../components/RecordModal';
import { api, authFetch } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function toINR(paise) {
    if (typeof paise !== 'number') return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const emptyForm = {
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    payment_method: 'Bank transfer',
    reference: '',
    description: '',
};

export default function Payment() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [summary, setSummary] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [organizationId, setOrganizationId] = useState(profile?.organization_id || '');
    const [form, setForm] = useState(emptyForm);

    const isSuperAdmin = profile?.role === 'super_admin';
    const canPostPayment = profile?.role === 'super_admin';

    const orgId = useMemo(() => {
        if (profile?.organization_id) return profile.organization_id;
        return organizationId;
    }, [profile?.organization_id, organizationId]);

    const load = async (targetOrgId = orgId) => {
        if (!profile) return;
        setLoading(true);
        try {
            let nextOrgId = targetOrgId;
            if (!nextOrgId && isSuperAdmin && organizations.length) {
                nextOrgId = String(organizations[0].id || organizations[0]._id || '');
                setOrganizationId(nextOrgId);
            }

            if (!nextOrgId) {
                setSummary(null);
                setPayments([]);
                setLoading(false);
                return;
            }

            const [ledgerSummary, ledgerPayments] = await Promise.all([
                api.get(`/api/organizations/${nextOrgId}/ledger`),
                api.get(`/api/organizations/${nextOrgId}/ledger/payments`),
            ]);

            setSummary(ledgerSummary || null);
            setPayments(Array.isArray(ledgerPayments?.data) ? ledgerPayments.data : []);
        } catch (e) {
            toast(e.message, 'error');
            setSummary(null);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadOrganizations = async () => {
            if (!isSuperAdmin) return;
            try {
                const rows = await api.get('/api/organizations');
                const list = Array.isArray(rows) ? rows : [];
                setOrganizations(list);
                if (!organizationId && list.length) {
                    setOrganizationId(String(list[0].id || list[0]._id || ''));
                }
            } catch (e) {
                toast(e.message, 'error');
            }
        };

        loadOrganizations();
    }, [isSuperAdmin, organizationId, toast]);

    useEffect(() => {
        load();
    }, [profile, orgId, isSuperAdmin, organizations, toast]);

    const submitPayment = async (e) => {
        e.preventDefault();

        if (!canPostPayment) {
            toast('Only Super Admin can record a payment', 'error');
            return;
        }

        const amountValue = Number(form.amount);
        if (!form.amount || Number.isNaN(amountValue) || amountValue <= 0) {
            toast('Enter a valid payment amount', 'error');
            return;
        }

        if (!form.date) {
            toast('Payment date is required', 'error');
            return;
        }

        const orgToPost = isSuperAdmin ? (organizationId || orgId) : orgId;
        if (!orgToPost) {
            toast('Select an organization before recording a payment', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                amount_paise: Math.round(amountValue * 100),
                date: form.date,
                payment_method: form.payment_method || 'Bank transfer',
                reference: form.reference?.trim() || undefined,
                description: form.description?.trim() || undefined,
            };

            await authFetch(`/api/organizations/${orgToPost}/ledger/payments`, {
                method: 'POST',
                headers: {
                    'Idempotency-Key': crypto.randomUUID(),
                },
                body: JSON.stringify(payload),
            });

            toast('Payment recorded successfully');
            setShowCreate(false);
            setForm(emptyForm);
            await load(orgToPost);
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!profile) return null;

    return (
        <div className="p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="font-display font-extrabold text-2xl">Payment</h2>
                    <p className="text-sm text-slate-500">Organization ledger overview and payment records</p>
                </div>
                <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                        <select
                            value={organizationId}
                            onChange={(e) => setOrganizationId(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 min-w-[220px]"
                        >
                            {organizations.length === 0 ? <option value="">Loading organizations...</option> : organizations.map((org) => (
                                <option key={org.id || org._id} value={String(org.id || org._id)}>{org.name}</option>
                            ))}
                        </select>
                    )}
                    {canPostPayment && (
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="h-10 px-4 rounded-xl bg-[#2563EB] text-white text-sm font-bold"
                        >
                            Record Payment
                        </button>
                    )}
                    {/* <Link to="/dashboard" className="h-10 px-4 rounded-xl bg-[#2563EB] text-white text-sm font-bold inline-flex items-center justify-center">Back to Dashboard</Link> */}
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs font-bold tracking-[0.12em] text-slate-500">TOTAL CHARGED</div>
                    <div className="mt-2 text-2xl font-extrabold">{summary ? toINR(summary.total_charged_paise) : '—'}</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs font-bold tracking-[0.12em] text-slate-500">TOTAL RECEIVED</div>
                    <div className="mt-2 text-2xl font-extrabold">{summary ? toINR(summary.total_received_paise) : '—'}</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs font-bold tracking-[0.12em] text-slate-500">OUTSTANDING</div>
                    <div className="mt-2 text-2xl font-extrabold">{summary ? toINR(summary.outstanding_paise) : '—'}</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs font-bold tracking-[0.12em] text-slate-500">AVAILABLE CREDIT</div>
                    <div className="mt-2 text-2xl font-extrabold">{summary ? toINR(summary.available_credit_paise) : '—'}</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="font-bold">Recent Payments</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[11px] font-bold tracking-widest text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-3">Description</th>
                                <th className="text-left px-4 py-3">Reference</th>
                                <th className="text-left px-4 py-3">Method</th>
                                <th className="text-left px-4 py-3">Date</th>
                                <th className="text-left px-4 py-3">Amount</th>
                                <th className="text-left px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading payment ledger...</td></tr>
                            )}
                            {!loading && payments.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No payment records found.</td></tr>
                            )}
                            {!loading && payments.map((row, idx) => (
                                <tr key={row.id || `${row.reference || 'payment'}-${idx}`} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-3 font-semibold">{row.description || 'Payment'}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{row.reference || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{row.payment_method || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{formatDate(row.date || row.created_at)}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-700">{toINR(Number(row.amount_paise ?? row.amount ?? 0))}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.status === 'reversed' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {row.status || 'recorded'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <RecordModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                title="Record Payment"
                footer={(
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowCreate(false)} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold">
                            Cancel
                        </button>
                        <button type="submit" form="payment-form" disabled={saving} className="h-10 px-4 rounded-xl bg-[#2563EB] text-white text-sm font-bold disabled:opacity-60">
                            {saving ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                )}
            >
                <form id="payment-form" onSubmit={submitPayment} className="space-y-4">
                    <FormField label="Amount" required>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                            placeholder="5000"
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Date" required>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                            />
                        </FormField>

                        <FormField label="Method" required>
                            <select
                                value={form.payment_method}
                                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                            >
                                <option value="Bank transfer">Bank transfer</option>
                                <option value="UPI">UPI</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Card">Card</option>
                            </select>
                        </FormField>
                    </div>

                    <FormField label="Reference">
                        <input
                            type="text"
                            value={form.reference}
                            onChange={(e) => setForm({ ...form, reference: e.target.value })}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
                            placeholder="BANK-12345"
                        />
                    </FormField>

                    <FormField label="Description">
                        <textarea
                            rows="3"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none"
                            placeholder="School ERP annual payment"
                        />
                    </FormField>
                </form>
            </RecordModal>
        </div>
    );
}
