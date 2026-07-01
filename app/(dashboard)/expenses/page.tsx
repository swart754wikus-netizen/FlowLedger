'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, collection, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useExpenses } from '@/lib/hooks/useFirestoreData';
import { useToast } from '@/components/ui/Toast';
import { formatRands, formatDate } from '@/lib/utils/format';
import { Receipt, X, Loader2 } from 'lucide-react';
import type { VatTreatment } from '@/types/domain';

const INP = 'w-full rounded-xl border border-midnight-border2 bg-midnight-raised px-3.5 py-2.5 text-[13px] text-t1 placeholder:text-t3 outline-none focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring';
const SEL = `${INP} appearance-none`;
const CATEGORIES = ['Fuel', 'Materials', 'Rent', 'Utilities', 'Wages', 'Insurance', 'Professional Fees', 'Travel', 'Other'];

export default function ExpensesPage() {
  const { business } = useAuth();
  const { data: expenses, loading } = useExpenses();
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [showModal, setShowModal] = useState(sp.get('new') === '1');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'Materials', supplierName: '', date: new Date().toISOString().slice(0,10), amount: '', vatTreatment: 'inclusive' as VatTreatment, notes: '' });

  const total = expenses.reduce((s,e) => s+e.amount, 0);
  const thisMonth = expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((s,e) => s+e.amount, 0);

  async function save() {
    if (!business || !form.amount) { toast('Enter an amount', 'error'); return; }
    setSaving(true);
    const amount = parseFloat(form.amount);
    const vatAmount = form.vatTreatment === 'inclusive' ? amount - amount/1.15 : form.vatTreatment === 'exclusive' ? amount*0.15 : 0;
    try {
      const ref = doc(collection(db, 'expenses'));
      await setDoc(ref, { id: ref.id, businessId: business.id, category: form.category, supplierName: form.supplierName || null,
        date: form.date, amount, vatTreatment: form.vatTreatment, vatAmount, notes: form.notes, createdAt: Date.now() });
      await addDoc(collection(db, 'transactions'), { businessId: business.id, type: 'expense', date: form.date, amount, vatAmount,
        reference: form.supplierName || form.category, category: form.category, status: 'completed', sourceType: 'expense', sourceId: ref.id, createdAt: Date.now() });
      toast('Expense added');
      setShowModal(false);
      setForm({ category: 'Materials', supplierName: '', date: new Date().toISOString().slice(0,10), amount: '', vatTreatment: 'inclusive', notes: '' });
      router.replace('/expenses');
    } catch (e: any) { toast(e.message, 'error'); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Total Expenses</div><div className="mt-2 font-mono text-[24px] font-semibold text-t1">{formatRands(total, true)}</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">This Month</div><div className="mt-2 font-mono text-[24px] font-semibold text-loss">{formatRands(thisMonth, true)}</div></div>
      </div>

      {loading ? <div className="text-[13px] text-t2">Loading…</div> : expenses.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-2xl p-14 text-center">
          <Receipt className="h-10 w-10 text-t3 mb-3" />
          <div className="text-[14px] font-medium text-t1">No expenses yet</div>
          <p className="mt-1 text-[13px] text-t2">Track what's going out to see your true profit.</p>
          <button onClick={() => setShowModal(true)} className="mt-4 rounded-xl bg-emerald px-4 py-2.5 text-[13px] font-semibold text-midnight">+ New Expense</button>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => (
            <div key={e.id} className="glass flex items-center gap-4 rounded-xl p-4">
              <div className="flex-1">
                <div className="text-[13px] font-medium text-t1">{e.category}{e.supplierName ? ` — ${e.supplierName}` : ''}</div>
                <div className="text-[11px] text-t2">{formatDate(e.date)}</div>
              </div>
              <span className="font-mono text-[13px] text-loss">−{formatRands(e.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/85 backdrop-blur-sm p-4">
          <div className="glass-raised w-full max-w-md rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-t1">New Expense</h3>
              <button onClick={() => { setShowModal(false); router.replace('/expenses'); }} className="text-t2 hover:text-t1"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="mb-1.5 block text-[12px] text-t2">Category</label>
                <select className={SEL} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} className="bg-midnight-raised">{c}</option>)}
                </select></div>
              <div><label className="mb-1.5 block text-[12px] text-t2">Supplier (optional)</label>
                <input className={INP} value={form.supplierName} onChange={e => setForm(f => ({...f, supplierName: e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-[12px] text-t2">Date</label>
                  <input type="date" className={INP} value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} /></div>
                <div><label className="mb-1.5 block text-[12px] text-t2">Amount</label>
                  <input type="number" className={INP} value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} /></div>
              </div>
              <div><label className="mb-1.5 block text-[12px] text-t2">VAT treatment</label>
                <select className={SEL} value={form.vatTreatment} onChange={e => setForm(f => ({...f, vatTreatment: e.target.value as VatTreatment}))}>
                  <option value="inclusive" className="bg-midnight-raised">VAT Inclusive</option>
                  <option value="exclusive" className="bg-midnight-raised">VAT Exclusive</option>
                  <option value="zero_rated" className="bg-midnight-raised">Zero Rated</option>
                  <option value="exempt" className="bg-midnight-raised">Exempt</option>
                </select></div>
              <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-2.5 text-[13px] font-semibold text-midnight disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
