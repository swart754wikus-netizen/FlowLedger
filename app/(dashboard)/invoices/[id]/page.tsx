'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ui/Toast';
import { formatRands, formatDate } from '@/lib/utils/format';
import { Download, Mail, MessageCircle, CheckCircle, Pencil } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '@/types/domain';

const STATUS_LABEL: Record<InvoiceStatus, string> = { pending: 'Pending', part_paid: 'Part Paid', paid: 'Paid', cancelled: 'Cancelled' };

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const id = params.id as string;
    const unsub = onSnapshot(doc(db, 'invoices', id), snap => {
      if (snap.exists()) setInvoice({ id: snap.id, ...snap.data() } as Invoice);
    });
    return unsub;
  }, [params.id]);

  async function markPaid() {
    if (!invoice) return;
    await updateDoc(doc(db, 'invoices', invoice.id), { status: 'paid', amountPaid: invoice.total, balanceDue: 0, updatedAt: Date.now() });
    toast('Invoice marked as paid');
  }

  async function downloadPdf() {
    if (!invoice) return;
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.text('FlowLedger', 14, 20);
    docPdf.setFontSize(11); docPdf.text(`Invoice ${invoice.invoiceNumber}`, 14, 30);
    docPdf.text(`Bill to: ${invoice.customerName}`, 14, 38);
    docPdf.text(`Issue date: ${formatDate(invoice.issueDate)}`, 14, 45);
    docPdf.text(`Due date: ${formatDate(invoice.dueDate)}`, 14, 51);
    // @ts-ignore
    docPdf.autoTable({
      startY: 60,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: invoice.lineItems.map(l => [l.description, l.quantity, formatRands(l.unitPrice), formatRands(l.quantity*l.unitPrice)]),
    });
    docPdf.text(`Total: ${formatRands(invoice.total)}`, 14, (docPdf as any).lastAutoTable.finalY + 10);
    docPdf.save(`${invoice.invoiceNumber}.pdf`);
    toast('PDF downloaded');
  }

  if (!invoice) return <div className="text-[13px] text-t2">Loading…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[13px] text-t3">{invoice.invoiceNumber}</div>
            <h1 className="mt-1 text-[20px] font-bold text-t1">{invoice.customerName}</h1>
          </div>
          <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${invoice.status==='paid'?'bg-emerald-bg text-emerald':invoice.status==='cancelled'?'bg-t3/10 text-t3':'bg-warn/10 text-warn'}`}>
            {STATUS_LABEL[invoice.status]}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
          <div><span className="text-t2">Issue date</span><div className="text-t1">{formatDate(invoice.issueDate)}</div></div>
          <div><span className="text-t2">Due date</span><div className="text-t1">{formatDate(invoice.dueDate)}</div></div>
        </div>

        <div className="mt-6 space-y-2">
          {invoice.lineItems.map(l => (
            <div key={l.id} className="flex justify-between text-[13px] text-t1">
              <span>{l.description} <span className="text-t3">×{l.quantity}</span></span>
              <span className="font-mono">{formatRands(l.quantity * l.unitPrice)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-midnight-border pt-3">
          <div className="flex justify-between text-[13px] text-t2"><span>Subtotal</span><span className="font-mono">{formatRands(invoice.subtotal)}</span></div>
          <div className="flex justify-between text-[13px] text-t2"><span>VAT</span><span className="font-mono">{formatRands(invoice.vatAmount)}</span></div>
          <div className="flex justify-between text-[18px] font-bold text-t1"><span>Total</span><span className="font-mono">{formatRands(invoice.total)}</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/invoices/new?edit=${invoice.id}`} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-4 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised"><Pencil className="h-3.5 w-3.5" />Edit</Link>
        <button onClick={downloadPdf} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-4 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised"><Download className="h-3.5 w-3.5" />PDF</button>
        <button onClick={() => toast('Email sent (demo)')} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-4 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised"><Mail className="h-3.5 w-3.5" />Email</button>
        <button onClick={() => toast('WhatsApp link opened (demo)')} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-4 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button>
        {invoice.status !== 'paid' && (
          <button onClick={markPaid} className="ml-auto flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2.5 text-[13px] font-semibold text-midnight hover:brightness-110"><CheckCircle className="h-3.5 w-3.5" />Mark Paid</button>
        )}
      </div>
    </div>
  );
}
