import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import RecordModal, { FormField } from '../components/RecordModal';

const FEE_TYPES = ['Tuition', 'Transport', 'Library', 'Exam', 'Other'];
const FEE_STATUSES = ['Pending', 'Partial', 'Paid', 'Overdue'];

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAcademicYear(year) {
    if (!year) return '—';
    const parts = year.split('-');
    if (parts.length === 2 && parts[1].length === 4) {
        return `${parts[0]}-${parts[1].slice(-2)}`;
    }
    return year;
}

function getDueLabel(dueDate) {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    const dateStr = formatDate(dueDate);
    if (diffDays < 0) return `Due: ${dateStr} • Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    if (diffDays === 0) return `Due: ${dateStr} • Due today`;
    return `Due: ${dateStr} • Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

function statusBadgeClass(status) {
    const map = {
        Paid: 'bg-emerald-50 text-emerald-700',
        Pending: 'bg-amber-50 text-amber-700',
        Overdue: 'bg-red-50 text-red-700',
        Partial: 'bg-orange-50 text-orange-700',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
}

function buildPaymentRows(fees) {
    const rows = [];
    for (const fee of fees) {
        for (const payment of fee.payments || []) {
            rows.push({
                id: `${fee.id}-${payment.receipt_no || payment.transaction_id || payment.date}`,
                invoice: payment.receipt_no || payment.transaction_id || `FEE-${String(fee.id).slice(-6).toUpperCase()}`,
                date: payment.date,
                amount: payment.amount,
                method: payment.payment_method || '—',
                status: 'Paid',
                student_name: fee.student_name,
            });
        }
        const pending = Math.max(0, (fee.total_amount || 0) - (fee.paid_amount || 0));
        if (pending > 0) {
            rows.push({
                id: `${fee.id}-pending`,
                invoice: `FEE-${String(fee.id).slice(-6).toUpperCase()}`,
                date: fee.due_date,
                amount: pending,
                method: '—',
                status: fee.status === 'Overdue' ? 'Overdue' : 'Pending',
                student_name: fee.student_name,
                fee_id: fee.id,
                pending_amount: pending,
            });
        }
    }
    return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const emptyForm = {
    student_id: '',
    title: '',
    fee_type: 'Tuition',
    academic_year: '2025-2026',
    total_amount: '',
    paid_amount: '0',
    due_date: '',
    status: 'Pending',
};

export default function Fees() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const isAdmin = profile && (profile.role === 'admin' || profile.role === 'super_admin');
    const canPay = profile && (profile.role === 'student' || profile.role === 'parent');

    const load = async () => {
        setLoading(true);
        try {
            const requests = [
                api.get('/api/fees'),
                api.get('/api/fees/stats'),
            ];
            if (isAdmin) requests.push(api.get('/api/students'));
            const results = await Promise.all(requests);
            setFees(results[0]);
            setStats(results[1]);
            if (isAdmin) setStudents(results[2]);
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [profile?.role]);

    const paymentRows = useMemo(() => buildPaymentRows(fees), [fees]);

    const pendingFee = useMemo(() => {
        return fees
            .filter((f) => Math.max(0, (f.total_amount || 0) - (f.paid_amount || 0)) > 0)
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0] || null;
    }, [fees]);

    const academicYear = fees[0]?.academic_year;
    const totalFees = stats?.total_fees ?? 0;
    const paidAmount = stats?.total_paid ?? 0;
    const pendingAmount = stats?.total_pending ?? 0;
    const paidPercentage = stats?.paid_percentage ?? 0;

    const openCreate = () => {
        setForm(emptyForm);
        setShowCreate(true);
    };

    const openEdit = (fee) => {
        setEditRecord(fee);
        setForm({
            student_id: fee.student_id?.id || fee.student_id || '',
            title: fee.title || '',
            fee_type: fee.fee_type || 'Tuition',
            academic_year: fee.academic_year || '2025-2026',
            total_amount: String(fee.total_amount ?? ''),
            paid_amount: String(fee.paid_amount ?? 0),
            due_date: fee.due_date ? fee.due_date.slice(0, 10) : '',
            status: fee.status || 'Pending',
        });
    };

    const closeModal = () => {
        setShowCreate(false);
        setEditRecord(null);
        setForm(emptyForm);
    };

    const saveCreate = async (e) => {
        e.preventDefault();
        if (!form.student_id || !form.title || !form.total_amount || !form.due_date) {
            toast('Student, title, amount and due date are required', 'error');
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/fees', {
                student_id: form.student_id,
                title: form.title,
                fee_type: form.fee_type,
                academic_year: form.academic_year,
                total_amount: Number(form.total_amount),
                paid_amount: Number(form.paid_amount || 0),
                due_date: form.due_date,
            });
            toast('Fee record created');
            closeModal();
            load();
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.total_amount || !form.due_date) {
            toast('Title, amount and due date are required', 'error');
            return;
        }
        setSaving(true);
        try {
            await api.put(`/api/fees/${editRecord.id}`, {
                title: form.title,
                fee_type: form.fee_type,
                academic_year: form.academic_year,
                total_amount: Number(form.total_amount),
                paid_amount: Number(form.paid_amount || 0),
                due_date: form.due_date,
                status: form.status,
            });
            toast('Fee record updated');
            closeModal();
            load();
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const payNow = async () => {
        if (!pendingFee) {
            toast('No pending fees', 'error');
            return;
        }
        const amount = Math.max(0, (pendingFee.total_amount || 0) - (pendingFee.paid_amount || 0));
        if (amount <= 0) return;

        setPaying(true);
        try {
            await api.post(`/api/fees/${pendingFee.id}/pay`, {
                amount,
                payment_method: 'Online',
            });
            toast('Payment recorded successfully');
            load();
        } catch (e) {
            toast(e.message, 'error');
        } finally {
            setPaying(false);
        }
    };

    const inputClass = 'w-full h-11 px-3 rounded-xl border border-slate-200 text-sm';
    const modalOpen = showCreate || !!editRecord;

    return (<div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display font-extrabold text-xl">Fees Management</h2>
          <p className="text-sm text-slate-500">Track payments, dues and receipts</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="h-10 px-5 rounded-xl bg-[#2563EB] text-white text-sm font-bold flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Add Fee
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-xs font-bold tracking-widest text-slate-400">TOTAL FEES</div>
          <div className="text-2xl font-extrabold mt-1">{loading ? '—' : formatCurrency(totalFees)}</div>
          <div className="text-xs text-slate-500">{loading ? '—' : `Academic Year ${formatAcademicYear(academicYear)}`}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-xs font-bold tracking-widest text-slate-400">PAID</div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-600">{loading ? '—' : formatCurrency(paidAmount)}</div>
          <div className="h-2 bg-slate-100 rounded-full mt-3">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: loading ? '0%' : `${paidPercentage}%` }}></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-xs font-bold tracking-widest text-slate-400">PENDING</div>
          <div className="text-2xl font-extrabold mt-1 text-amber-600">{loading ? '—' : formatCurrency(pendingAmount)}</div>
          <div className="text-xs text-red-500 font-semibold mt-1">
            {loading ? '—' : pendingFee ? getDueLabel(pendingFee.due_date) : 'No pending dues'}
          </div>
          {canPay && pendingAmount > 0 && (
            <button
              onClick={payNow}
              disabled={paying}
              className="mt-3 w-full h-9 rounded-xl bg-[#2563EB] text-white text-sm font-bold disabled:opacity-70"
            >
              {paying ? 'Processing...' : 'Pay Now'}
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 font-bold border-b">Fee Records</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] text-xs text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Paid</th>
                  <th className="text-left px-4 py-3">Due Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
                )}
                {!loading && fees.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No fee records. Click Add Fee to create one.</td></tr>
                )}
                {!loading && fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">{fee.student_name || '—'}</td>
                    <td className="px-4 py-3">{fee.title}</td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(fee.total_amount)}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{formatCurrency(fee.paid_amount)}</td>
                    <td className="px-4 py-3">{formatDate(fee.due_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass(fee.status)}`}>{fee.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(fee)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <i className="fa-regular fa-pen-to-square text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 font-bold border-b flex items-center justify-between">
          <span>Payment History</span>
          <button onClick={() => toast('Receipts downloaded')} className="text-xs font-bold text-[#2563EB]">Download All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Invoice</th>
                {isAdmin && <th className="text-left px-4 py-3">Student</th>}
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              )}
              {!loading && paymentRows.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-10 text-center text-slate-400">No fee records found.</td></tr>
              )}
              {!loading && paymentRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-mono text-xs">{row.invoice}</td>
                  {isAdmin && <td className="px-4 py-3">{row.student_name || '—'}</td>}
                  <td className="px-4 py-3">{formatDate(row.date)}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3">{row.method}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass(row.status)}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RecordModal
        open={modalOpen}
        onClose={closeModal}
        title={showCreate ? 'Add Fee Record' : 'Edit Fee Record'}
        footer={(<form onSubmit={showCreate ? saveCreate : saveEdit} className="flex justify-end gap-3">
          <button type="button" onClick={closeModal} className="h-10 px-5 rounded-xl border border-slate-200 font-semibold text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white font-bold text-sm disabled:opacity-70">
            {saving ? 'Saving...' : showCreate ? 'Create Fee' : 'Save Changes'}
          </button>
        </form>)}
      >
        <div className="grid grid-cols-2 gap-4">
          {showCreate && (
            <div className="col-span-2">
              <FormField label="Student" required>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>
                  ))}
                </select>
              </FormField>
            </div>
          )}
          <div className="col-span-2">
            <FormField label="Title" required>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Academic Year Fee 2025-26"/>
            </FormField>
          </div>
          <FormField label="Fee Type">
            <select value={form.fee_type} onChange={(e) => setForm({ ...form, fee_type: e.target.value })} className={`${inputClass} bg-white`}>
              {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Academic Year">
            <input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} className={inputClass} placeholder="2025-2026"/>
          </FormField>
          <FormField label="Total Amount" required>
            <input type="number" min="0" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className={inputClass}/>
          </FormField>
          <FormField label="Paid Amount">
            <input type="number" min="0" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} className={inputClass}/>
          </FormField>
          <FormField label="Due Date" required>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputClass}/>
          </FormField>
          {!showCreate && (
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${inputClass} bg-white`}>
                {FEE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          )}
        </div>
      </RecordModal>
    </div>);
}
