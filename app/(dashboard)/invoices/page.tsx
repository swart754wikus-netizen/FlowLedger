'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useInvoices } from '@/lib/hooks/useFirestoreData';
import { formatRands, formatDate, daysOverdue } from '@/lib/utils/format';
import { FileText, Copy, Trash2, Pencil } from 'lucide-react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { InvoiceStatus } from '@/types/domain';

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  pending: 'bg-warn/10 text-warn',
  part_paid: 'bg-warn/10 text-warn',
  paid: 'bg-emerald-bg text-emerald',
  cancelled: 'bg-t3/10 text-t3',
};
const STATUS_LABEL: Record<InvoiceStatus, string> = { pending: 'Pending', part_paid: 'Part Paid', paid: 'Paid', cancelled: 'Cancelled' };

const FILTERS: { key: InvoiceStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' },
  { key: 'part_paid', label: 'Part Paid' }, { key: 'paid', label: 'Paid' }, { key: 'cancelled', label: 'Cancelled' },
];

export default function InvoicesPage() {
  const { data: invoices, loading } = useInvoices();
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const toast = useToast();

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);
  const outstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s,i) => s+i.balanceDue, 0);
  const overdueCount = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && daysOverdue(i.dueDate) > 0).length;

  async function duplicateInvoice(inv: any) {
    toast('Duplicate feature creates a new draft — coming from this invoice', 'success');
  }
  async function deleteInvoice(id: string) {
    setDeleteTarget(null);
    await deleteDoc(doc(db, 'invoices', id));
    toast('Invoice deleted');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wide text-t2">Total Outstanding</div>
          <div className="mt-2 font-mono text-[24px] font-semibold text-t1 tabular-nums">{formatRands(outstanding, true)}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wide text-t2">Overdue</div>
          <div className="mt-2 font-mono text-[24px] font-semibold text-loss tabular-nums">{overdueCount}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wide text-t2">Total Invoices</div>
          <div className="mt-2 font-mono text-[24px] font-semibold text-t1 tabular-nums">{invoices.length}</div>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-midnight-card p-1 w-fit">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors ${filter===f.key?'bg-midnight-raised text-t1':'text-t2 hover:text-t1'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[13px] text-t2">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-2xl p-14 text-center">
          <FileText className="h-10 w-10 text-t3 mb-3" />
          <div className="text-[14px] font-medium text-t1">No invoices yet</div>
          <p className="mt-1 text-[13px] text-t2">Create your first invoice to start tracking income.</p>
          <Link href="/invoices/new" className="mt-4 rounded-xl bg-emerald px-4 py-2.5 text-[13px] font-semibold text-midnight hover:brightness-110">+ New Invoice</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv, i) => {
            const overdue = inv.status !== 'paid' && inv.status !== 'cancelled' && daysOverdue(inv.dueDate) > 0;
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="glass flex items-center gap-4 rounded-xl p-4 hover:bg-midnight-raised/60 transition-colors">
                <Link href={`/invoices/${inv.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                  <span className="font-mono text-[12px] text-t3 w-20 shrink-0">{inv.invoiceNumber}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-t1 truncate">{inv.customerName}</div>
                    <div className="text-[11px] text-t2">{formatDate(inv.issueDate)} · Due {formatDate(inv.dueDate)}</div>
                  </div>
                  <span className={`font-mono text-[13px] tabular-nums ${overdue ? 'text-loss' : 'text-t1'}`}>{formatRands(inv.total)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[inv.status]}`}>{STATUS_LABEL[inv.status]}</span>
                </Link>
                <div className="flex gap-1 shrink-0">
                  <Link href={`/invoices/new?edit=${inv.id}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-t3 hover:bg-midnight-raised hover:text-t1"><Pencil className="h-3.5 w-3.5" /></Link>
                  <button onClick={() => duplicateInvoice(inv)} className="flex h-7 w-7 items-center justify-center rounded-lg text-t3 hover:bg-midnight-raised hover:text-t1"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(inv.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-t3 hover:bg-loss/10 hover:text-loss"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} message="Delete this invoice permanently?"
        onConfirm={() => deleteTarget && deleteInvoice(deleteTarget)} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
