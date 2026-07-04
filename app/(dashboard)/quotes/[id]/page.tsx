'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot, updateDoc, collection, setDoc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatRands, formatDate } from '@/lib/utils/format';
import { Download, Mail, MessageCircle, CheckCircle, XCircle, Pencil, ArrowRightLeft } from 'lucide-react';
import type { Quote, QuoteStatus } from '@/types/domain';

const STATUS_LABEL: Record<QuoteStatus, string> = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', declined: 'Declined', converted: 'Converted' };
const STATUS_STYLE: Record<QuoteStatus, string> = {
  draft: 'bg-t3/10 text-t3', sent: 'bg-warn/10 text-warn', accepted: 'bg-emerald-bg text-emerald',
  declined: 'bg-loss/10 text-loss', converted: 'bg-emerald-bg text-emerald',
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { business } = useAuth();
  const toast = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [confirmConvert, setConfirmConvert] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const unsub = onSnapshot(doc(db, 'quotes', id), snap => {
      if (snap.exists()) setQuote({ id: snap.id, ...snap.data() } as Quote);
    });
    return unsub;
  }, [params.id]);

  async function setStatus(status: QuoteStatus) {
    if (!quote) return;
    await updateDoc(doc(db, 'quotes', quote.id), { status, updatedAt: Date.now() });
    toast(`Quote marked as ${STATUS_LABEL[status].toLowerCase()}`);
  }

  async function convertToInvoice() {
    if (!business || !quote) return;
    setConfirmConvert(false);
    try {
      const invoicesSnap = await getDocs(query(collection(db, 'invoices'), where('businessId', '==', business.id)));
      const invoiceNumber = `INV-${String(invoicesSnap.size + 1).padStart(4, '0')}`;
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 30);

      const ref = doc(collection(db, 'invoices'));
      await setDoc(ref, {
        id: ref.id, businessId: business.id, invoiceNumber, customerId: quote.customerId, customerName: quote.customerName,
        status: 'pending', issueDate: new Date().toISOString().slice(0, 10), dueDate: dueDate.toISOString().slice(0, 10),
        lineItems: quote.lineItems, discountPct: quote.discountPct, subtotal: quote.subtotal, vatAmount: quote.vatAmount, total: quote.total,
        amountPaid: 0, balanceDue: quote.total, notes: quote.notes || '', createdAt: Date.now(), updatedAt: Date.now(),
      });
      await addDoc(collection(db, 'transactions'), {
        businessId: business.id, type: 'income', date: new Date().toISOString().slice(0, 10), amount: quote.total, vatAmount: quote.vatAmount,
        reference: invoiceNumber, category: 'Sales', status: 'pending', sourceType: 'invoice', sourceId: ref.id, createdAt: Date.now(),
      });
      await updateDoc(doc(db, 'quotes', quote.id), { status: 'converted', convertedInvoiceId: ref.id, updatedAt: Date.now() });
      toast(`Converted to invoice ${invoiceNumber}`);
      router.push(`/invoices/${ref.id}`);
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }

  async function downloadPdf() {
    if (!quote) return;
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.text('FlowLedger', 14, 20);
    docPdf.setFontSize(11); docPdf.text(`Quote ${quote.quoteNumber}`, 14, 30);
    docPdf.text(`For: ${quote.customerName}`, 14, 38);
    docPdf.text(`Issue date: ${formatDate(quote.issueDate)}`, 14, 45);
    docPdf.text(`Valid until: ${formatDate(quote.expiryDate)}`, 14, 51);
    // @ts-ignore
    docPdf.autoTable({
      startY: 60,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: quote.lineItems.map(l => [l.description, l.quantity, formatRands(l.unitPrice), formatRands(l.quantity*l.unitPrice)]),
    });
    docPdf.text(`Total: ${formatRands(quote.total)}`, 14, (docPdf as any).lastAutoTable.finalY + 10);
    docPdf.save(`${quote.quoteNumber}.pdf`);
    toast('PDF downloaded');
  }

  if (!quote) return <div className="text-[13px] text-t2">Loading…</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[13px] text-t3">{quote.quoteNumber}</div>
            <h1 className="mt-1 text-[20px] font-bold text-t1">{quote.customerName}</h1>
          </div>
          <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${STATUS_STYLE[quote.status]}`}>
            {STATUS_LABEL[quote.status]}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
          <div><span className="text-t2">Issue date</span><div className="text-t1">{formatDate(quote.issueDate)}</div></div>
          <div><span className="text-t2">Valid until</span><div className="text-t1">{formatDate(quote.expiryDate)}</div></div>
        </div>

        <div className="mt-6 space-y-2">
          {quote.lineItems.map(l => (
            <div key={l.id} className="flex justify-between text-[13px] text-t1">
              <span>{l.description} <span className="text-t3">×{l.quantity}</span></span>
              <span className="font-mono">{formatRands(l.quantity * l.unitPrice)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-midnight-border pt-3">
          <div className="flex justify-between text-[13px] text-t2"><span>Subtotal</span><span className="font-mono">{formatRands(quote.subtotal)}</span></div>
          <div className="flex justify-between text-[13px] text-t2"><span>VAT</span><span className="font-mono">{formatRands(quote.vatAmount)}</span></div>
          <div className="flex justify-between text-[18px] font-bold text-t1"><span>Total</span><span className="font-mono">{formatRands(quote.total)}</span></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quote.status !== 'converted' && (
          <Link href={`/quotes/new?edit=${quote.id}`} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-4 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised"><Pencil className="h-3.5 w-3.5" />Edit</Link>
        )}
        <button onClick={downloadPdf} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-4 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised"><Download className="h-3.5 w-3.5" />PDF</button>
        <button onClick={() => toast('Email sent (demo)')} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-4 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised"><Mail className="h-3.5 w-3.5" />Email</button>
        <button onClick={() => toast('WhatsApp link opened (demo)')} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-4 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button>

        {(quote.status === 'sent' || quote.status === 'draft') && (
          <>
            <button onClick={() => setStatus('accepted')} className="ml-auto flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2.5 text-[13px] font-semibold text-midnight hover:brightness-110"><CheckCircle className="h-3.5 w-3.5" />Mark Accepted</button>
            <button onClick={() => setStatus('declined')} className="flex items-center gap-1.5 rounded-xl border border-loss/25 px-4 py-2.5 text-[13px] text-loss hover:bg-loss/10"><XCircle className="h-3.5 w-3.5" />Mark Declined</button>
          </>
        )}
        {quote.status === 'accepted' && (
          <button onClick={() => setConfirmConvert(true)} className="ml-auto flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2.5 text-[13px] font-semibold text-midnight hover:brightness-110"><ArrowRightLeft className="h-3.5 w-3.5" />Convert to Invoice</button>
        )}
      </div>

      <ConfirmDialog open={confirmConvert} message={`Convert quote ${quote.quoteNumber} into an invoice?`}
        onConfirm={convertToInvoice} onCancel={() => setConfirmConvert(false)} />
    </div>
  );
}
