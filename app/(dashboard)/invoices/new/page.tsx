'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, query, where, getDocs, getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCustomers } from '@/lib/hooks/useFirestoreData';
import { useToast } from '@/components/ui/Toast';
import { calculateInvoiceTotals } from '@/lib/utils/vat';
import { formatRands } from '@/lib/utils/format';
import { Plus, Trash2, Loader2, Upload } from 'lucide-react';
import type { LineItem, VatTreatment } from '@/types/domain';

const INP = 'w-full rounded-xl border border-midnight-border2 bg-midnight-raised px-3.5 py-2.5 text-[13px] text-t1 placeholder:text-t3 outline-none focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring';
const SEL = `${INP} appearance-none`;

function newLine(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, vatTreatment: 'inclusive', total: 0 };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp.get('edit');
  const { business } = useAuth();
  const { data: customers } = useCustomers();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(!!editId);
  const [customerId, setCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate()+30); return d.toISOString().slice(0,10); });
  const [discountPct, setDiscountPct] = useState(0);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const snap = await getDoc(doc(db, 'invoices', editId));
      if (snap.exists()) {
        const inv = snap.data() as any;
        setCustomerId(inv.customerId);
        setIssueDate(inv.issueDate);
        setDueDate(inv.dueDate);
        setDiscountPct(inv.discountPct);
        setNotes(inv.notes || '');
        setLines(inv.lineItems?.length ? inv.lineItems : [newLine()]);
      }
      setLoadingExisting(false);
    })();
  }, [editId]);

  const totals = calculateInvoiceTotals(lines, discountPct);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Normalizes any image (including HEIC from iPhones, which Claude's vision API can't read directly)
  // to a JPEG data URL by drawing it through a canvas, and downsizes large photos.
  async function imageToJpegBase64(file: File): Promise<string> {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = objectUrl;
      });
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return dataUrl.split(',')[1];
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setExtracting(true);
    try {
      const isPdf = file.type === 'application/pdf';
      const data = isPdf ? await fileToBase64(file) : await imageToJpegBase64(file);
      const mediaType = isPdf ? 'application/pdf' : 'image/jpeg';

      const res = await fetch('/api/ai/extract-invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaType, data }),
      });
      const body = await res.json();
      if (!res.ok) { toast(body.error || 'Could not read that file', 'error'); return; }

      const ex = body.extracted;
      if (ex.customerName) {
        const match = customers.find(c => c.company.toLowerCase() === ex.customerName.toLowerCase());
        if (match) { setCustomerId(match.id); setNewCustomerName(''); }
        else { setCustomerId(''); setNewCustomerName(ex.customerName); }
      }
      if (ex.issueDate) setIssueDate(ex.issueDate);
      if (ex.dueDate) setDueDate(ex.dueDate);
      if (ex.lineItems?.length) {
        setLines(ex.lineItems.map((l: any) => ({
          id: crypto.randomUUID(), description: l.description || '', quantity: l.quantity || 1,
          unitPrice: l.unitPrice || 0, vatTreatment: l.vatTreatment || 'inclusive', total: 0,
        })));
      }
      toast('Invoice details extracted — please review before saving');
    } catch (err: any) {
      toast('Could not read that file', 'error');
    } finally {
      setExtracting(false);
    }
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
      if (editId) {
        await updateDoc(doc(db, 'invoices', editId), {
          customerId: customer.id, customerName: customer.name,
          status, issueDate, dueDate, lineItems: lines.filter(l => l.description),
          discountPct, subtotal: totals.subtotal, vatAmount: totals.vatAmount, total: totals.total,
          amountPaid: status === 'paid' ? totals.total : 0,
          balanceDue: status === 'paid' ? 0 : totals.total,
          notes, updatedAt: Date.now(),
        });

        const txSnap = await getDocs(query(collection(db, 'transactions'), where('sourceType', '==', 'invoice'), where('sourceId', '==', editId)));
        if (!txSnap.empty) {
          await updateDoc(txSnap.docs[0].ref, { date: issueDate, amount: totals.total, vatAmount: totals.vatAmount, status });
        }

        toast('Invoice updated');
      } else {
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
      }
      router.push('/invoices');
    } catch (e: any) { toast(e.message, 'error'); } finally { setSaving(false); }
  }

  if (loadingExisting) return <div className="text-[13px] text-t2">Loading…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      {!editId && (
        <label className="glass flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-midnight-border2 p-4 text-[13px] text-t2 hover:border-emerald/40 hover:text-emerald transition-colors">
          {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {extracting ? 'Reading invoice…' : 'Upload an invoice photo or PDF to auto-fill'}
          <input type="file" accept="image/*,application/pdf" className="hidden" disabled={extracting} onChange={handleUpload} />
        </label>
      )}

      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-[14px] font-semibold text-t1">{editId ? 'Edit invoice' : 'Invoice details'}</h2>
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
              <input type="number" step="0.01" className={INP} value={line.quantity} onChange={e => updateLine(line.id, { quantity: parseFloat(e.target.value)||0 })} />
              <input type="number" step="0.01" className={INP} value={line.unitPrice} onChange={e => updateLine(line.id, { unitPrice: parseFloat(e.target.value)||0 })} />
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
            <input type="number" step="0.01" className="w-20 rounded-lg border border-midnight-border2 bg-midnight-raised px-2 py-1 text-[12px] text-t1 text-right" value={discountPct} onChange={e => setDiscountPct(parseFloat(e.target.value)||0)} />
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
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editId ? 'Save changes' : 'Save & Send'}
        </button>
        <button onClick={() => save('paid')} disabled={saving} className="flex-1 rounded-xl bg-emerald py-3 text-[14px] font-semibold text-midnight hover:brightness-110 disabled:opacity-60">
          Mark as Paid
        </button>
      </div>
    </div>
  );
}
