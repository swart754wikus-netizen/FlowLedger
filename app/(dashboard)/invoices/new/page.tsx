'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCustomers } from '@/lib/hooks/useFirestoreData';
import { useToast } from '@/components/ui/Toast';
import { calculateInvoiceTotals } from '@/lib/utils/vat';
import { formatRands } from '@/lib/utils/format';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import type { LineItem, VatTreatment } from '@/types/domain';

const INP = 'w-full rounded-xl border border-midnight-border2 bg-midnight-raised px-3.5 py-2.5 text-[13px] text-t1 placeholder:text-t3 outline-none focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring';
const SEL = `${INP} appearance-none`;

function newLine(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, vatTreatment: 'inclusive', total: 0 };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { business } = useAuth();
  const { data: customers } = useCustomers();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate()+30); return d.toISOString().slice(0,10); });
  const [discountPct, setDiscountPct] = useState(0);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([newLine()]);

  const totals = calculateInvoiceTotals(lines, discountPct);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  }

  async function resolveCustomer(): Promise<{ id: string; name: string } | null> {
    if (customerId) {
      const c = customers.find(c => c.id === customerId);
      return c ? { id: c.id, name: c.company } : null;
    }
    if (newCustomerName.trim() && business) {
      const ref = doc(collection(db, 'customers'));
      await setDoc(ref, {
        id: ref.id, businessId: business.id, company: newCustomerName.trim(),
        outstandingBalance: 0, createdAt: Date.now(),
      });
      return { id: ref.id, name: newCustomerName.trim() };
    }
    return null;
  }

  async function save(status: 'pending' | 'paid') {
    if (!business) return;
    const customer = await resolveCustomer();
    if (!customer) { toast('Select or enter a customer', 'error'); return; }
    if (!lines.some(l => l.description)) { toast('Add at least one line item', 'error'); return; }

    setSaving(true);
    try {
      const invoicesSnap = await getDocs(query(collection(db, 'invoices'), where('businessId', '==', business.id)));
      const invoiceNumber = `INV-${String(invoicesSnap.size + 1).padStart(4, '0')}`;

      const ref = doc(collection(db, 'invoices'));
      await setDoc(ref, {
        id: ref.id, businessId: business.id, invoiceNumber, customerId: customer.id, customerName: customer.name,
        status, issueDate, dueDate, lineItems: lines.filter(l => l.description),
        discountPct, subtotal: totals.subtotal, vatAmount: totals.vatAmount, total: totals.total,
        amountPaid: status === 'paid' ? totals.total : 0,
        balanceDue: status === 'paid' ? 0 : totals.total,
        notes, createdAt: Date.now(), updatedAt: Date.now(),
      });

      // Create transaction
      await addDoc(collection(db, 'transactions'), {
        businessId: business.id, type: 'income', date: issueDate, amount: totals.total, vatAmount: totals.vatAmount,
        reference: invoiceNumber, category: 'Sales', status, sourceType: 'invoice', sourceId: ref.id, createdAt: Date.now(),
      });

      toast(`Invoice ${invoiceNumber} created`);
      router.push('/invoices');
    } catch (e: any) { toast(e.message, 'error'); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-[14px] font-semibold text-t1">Invoice details</h2>
        <div>
          <label className="mb-1.5 block text-[12px] text-t2">Customer</label>
          <select className={SEL} value={customerId} onChange={e => { setCustomerId(e.target.value); setNewCustomerName(''); }}>
            <option value="" className="bg-midnight-raised">Select existing or type new below…</option>
            {customers.map(c => <option key={c.id} value={c.id} className="bg-midnight-raised">{c.company}</option>)}
          </select>
          {!customerId && (
            <input className={`${INP} mt-2`} placeholder="Or type a new customer name" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1.5 block text-[12px] text-t2">Issue date</label>
            <input type="date" className={INP} value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
          <div><label className="mb-1.5 block text-[12px] text-t2">Due date</label>
            <input type="date" className={INP} value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-3">
        <h2 className="text-[14px] font-semibold text-t1">Line items</h2>
        <div className="grid grid-cols-[1fr_60px_90px_110px_90px_28px] gap-2 text-[10px] uppercase tracking-wide text-t3 px-1">
          <span>Description</span><span>Qty</span><span>Unit Price</span><span>VAT</span><span>Total</span><span/>
        </div>
        {lines.map(line => {
          const calc = (() => {
            const gross = line.quantity * line.unitPrice;
            if (line.vatTreatment === 'exclusive') return gross * 1.15;
            return gross;
          })();
          return (
            <div key={line.id} className="grid grid-cols-[1fr_60px_90px_110px_90px_28px] gap-2 items-center">
              <input className={INP} value={line.description} onChange={e => updateLine(line.id, { description: e.target.value })} placeholder="Item description" />
              <input type="number" className={INP} value={line.quantity} onChange={e => updateLine(line.id, { quantity: parseFloat(e.target.value)||0 })} />
              <input type="number" className={INP} value={line.unitPrice} onChange={e => updateLine(line.id, { unitPrice: parseFloat(e.target.value)||0 })} />
              <select className={SEL} value={line.vatTreatment} onChange={e => updateLine(line.id, { vatTreatment: e.target.value as VatTreatment })}>
                <option value="inclusive" className="bg-midnight-raised">Incl.</option>
                <option value="exclusive" className="bg-midnight-raised">Excl.</option>
                <option value="zero_rated" className="bg-midnight-raised">Zero</option>
                <option value="exempt" className="bg-midnight-raised">Exempt</option>
              </select>
              <div className="font-mono text-[12px] text-right text-t1">{formatRands(calc)}</div>
              <button onClick={() => setLines(ls => ls.filter(l => l.id !== line.id))} className="text-t3 hover:text-loss"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
        <button onClick={() => setLines(ls => [...ls, newLine()])} className="flex items-center gap-1.5 text-[13px] text-emerald hover:underline">
          <Plus className="h-3.5 w-3.5" /> Add line
        </button>

        <div className="pt-3 border-t border-midnight-border space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12px] text-t2">Discount %</label>
            <input type="number" className="w-20 rounded-lg border border-midnight-border2 bg-midnight-raised px-2 py-1 text-[12px] text-t1 text-right" value={discountPct} onChange={e => setDiscountPct(parseFloat(e.target.value)||0)} />
          </div>
          <div className="flex justify-between text-[13px] text-t2"><span>Subtotal</span><span className="font-mono">{formatRands(totals.subtotal)}</span></div>
          <div className="flex justify-between text-[13px] text-t2"><span>VAT</span><span className="font-mono">{formatRands(totals.vatAmount)}</span></div>
          <div className="flex justify-between text-[16px] font-semibold text-t1 pt-1.5 border-t border-midnight-border"><span>Total</span><span className="font-mono">{formatRands(totals.total)}</span></div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <label className="mb-1.5 block text-[12px] text-t2">Notes</label>
        <textarea className={`${INP} min-h-[70px] resize-none`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Banking details, payment terms…" />
      </div>

      <div className="flex gap-3">
        <button onClick={() => save('pending')} disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-midnight-border2 py-3 text-[14px] text-t1 hover:bg-midnight-raised disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save & Send
        </button>
        <button onClick={() => save('paid')} disabled={saving} className="flex-1 rounded-xl bg-emerald py-3 text-[14px] font-semibold text-midnight hover:brightness-110 disabled:opacity-60">
          Mark as Paid
        </button>
      </div>
    </div>
  );
}
