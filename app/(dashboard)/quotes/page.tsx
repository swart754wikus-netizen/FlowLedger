'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuotes, useInvoices } from '@/lib/hooks/useFirestoreData';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatRands, formatDate } from '@/lib/utils/format';
import { FileStack, Trash2, Pencil, ArrowRightLeft } from 'lucide-react';
import { doc, deleteDoc, updateDoc, collection, setDoc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Quote, QuoteStatus } from '@/types/domain';

const STATUS_STYLE: Record<QuoteStatus, string> = {
  draft: 'bg-t3/10 text-t3',
  sent: 'bg-warn/10 text-warn',
  accepted: 'bg-emerald-bg text-emerald',
  declined: 'bg-loss/10 text-loss',
  converted: 'bg-emerald-bg text-emerald',
};
const STATUS_LABEL: Record<QuoteStatus, string> = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', declined: 'Declined', converted: 'Converted' };

const FILTERS: { key: QuoteStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'draft', label: 'Draft' }, { key: 'sent', label: 'Sent' },
  { key: 'accepted', label: 'Accepted' }, { key: 'declined', label: 'Declined' }, { key: 'converted', label: 'Converted' },
];

export default function QuotesPage() {
  const { business } = useAuth();
  const { data: quotes, loading } = useQuotes();
  const { data: invoices } = useInvoices();
  const [filter, setFilter] = useState<QuoteStatus | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [convertTarget, setConvertTarget] = useState<Quote | null>(null);
  const toast = useToast();

  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter);
  const awaitingCount = quotes.filter(q => q.status === 'sent').length;
  const acceptedCount = quotes.filter(q => q.status === 'accepted' || q.status === 'converted').length;

  async function deleteQuote(id: string) {
    setDeleteTarget(null);
    await deleteDoc(doc(db, 'quotes', id));
    toast('Quote deleted');
  }

  async function convertToInvoice(q: any) {
    if (!business) return;
    setConvertTarget(null);
    try {
      const invoicesSnap = await getDocs(query(collection(db, 'invoices'), where('businessId', '==', business.id)));
      const invoiceNumber = `INV-${String(invoicesSnap.size + 1).padStart(4, '0')}`;
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);

      const ref = doc(collection(db, 'invoices'));
      await setDoc(ref, {
        id: ref.id, businessId: business.id, invoiceNumber, customerId: q.customerId, customerName: q.customerName,
        status: 'pending', issueDate: new Date().toISOString().slice(0, 10), dueDate: dueDate.toISOString().slice(0, 10),
        lineItems: q.lineItems, discountPct: q.discountPct, subtotal: q.subtotal, vatAmount: q.vatAmount, total: q.total,
        amountPaid: 0, balanceDue: q.total, notes: q.notes || '', createdAt: Date.now(), updatedAt: Date.now(),
      });
      await addDoc(collection(db, 'transactions'), {
        businessId: business.id, type: 'income', date: new Date().toISOString().slice(0, 10), amount: q.total, vatAmount: q.vatAmount,
        reference: invoiceNumber, category: 'Sales', status: 'pending', sourceType: 'invoice', sourceId: ref.id, createdAt: Date.now(),
      });
      await updateDoc(doc(db, 'quotes', q.id), { status: 'converted', convertedInvoiceId: ref.id, updatedAt: Date.now() });
      toast(`Converted to invoice ${invoiceNumber}`);
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wide text-t2">Total Quotes</div>
          <div className="mt-2 font-mono text-[24px] font-semibold text-t1 tabular-nums">{quotes.length}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wide text-t2">Awaiting Response</div>
          <div className="mt-2 font-mono text-[24px] font-semibold text-warn tabular-nums">{awaitingCount}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wide text-t2">Accepted</div>
          <div className="mt-2 font-mono text-[24px] font-semibold text-emerald tabular-nums">{acceptedCount}</div>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-midnight-card p-1 w-fit overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors ${filter===f.key?'bg-midnight-raised text-t1':'text-t2 hover:text-t1'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[13px] text-t2">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-2xl p-14 text-center">
          <FileStack className="h-10 w-10 text-t3 mb-3" />
          <div className="text-[14px] font-medium text-t1">No quotes yet</div>
          <p className="mt-1 text-[13px] text-t2">Send a quote before you invoice — win the work first.</p>
          <Link href="/quotes/new" className="mt-4 rounded-xl bg-emerald px-4 py-2.5 text-[13px] font-semibold text-midnight hover:brightness-110">+ New Quote</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="glass flex items-center gap-4 rounded-xl p-4 hover:bg-midnight-raised/60 transition-colors">
              <Link href={`/quotes/${q.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                <span className="font-mono text-[12px] text-t3 w-20 shrink-0">{q.quoteNumber}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-t1 truncate">{q.customerName}</div>
                  <div className="text-[11px] text-t2">{formatDate(q.issueDate)} · Expires {formatDate(q.expiryDate)}</div>
                </div>
                <span className="font-mono text-[13px] tabular-nums text-t1">{formatRands(q.total)}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[q.status]}`}>{STATUS_LABEL[q.status]}</span>
              </Link>
              <div className="flex gap-1 shrink-0">
                {(q.status === 'accepted') && (
                  <button onClick={() => setConvertTarget(q)} title="Convert to invoice" className="flex h-7 w-7 items-center justify-center rounded-lg text-t3 hover:bg-emerald-bg hover:text-emerald"><ArrowRightLeft className="h-3.5 w-3.5" /></button>
                )}
                <Link href={`/quotes/new?edit=${q.id}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-t3 hover:bg-midnight-raised hover:text-t1"><Pencil className="h-3.5 w-3.5" /></Link>
                <button onClick={() => setDeleteTarget(q.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-t3 hover:bg-loss/10 hover:text-loss"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} message="Delete this quote permanently?"
        onConfirm={() => deleteTarget && deleteQuote(deleteTarget)} onCancel={() => setDeleteTarget(null)} />
      <ConfirmDialog open={!!convertTarget} message={`Convert quote ${convertTarget?.quoteNumber} into an invoice?`}
        onConfirm={() => convertTarget && convertToInvoice(convertTarget)} onCancel={() => setConvertTarget(null)} />
    </div>
  );
}
