'use client';
import { useInvoices, useExpenses } from '@/lib/hooks/useFirestoreData';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatRands, formatDate } from '@/lib/utils/format';
import { Landmark, FileWarning, Download } from 'lucide-react';
import { useState } from 'react';

export default function VatCentrePage() {
  const { business } = useAuth();
  const { data: invoices } = useInvoices();
  const { data: expenses } = useExpenses();

  // Current bi-monthly VAT period
  const now = new Date();
  const periodMonth = Math.floor(now.getMonth() / 2) * 2;
  const periodStart = new Date(now.getFullYear(), periodMonth, 1);
  const periodEnd = new Date(now.getFullYear(), periodMonth + 2, 0);

  const periodInvoices = invoices.filter(i => new Date(i.issueDate) >= periodStart && new Date(i.issueDate) <= periodEnd);
  const periodExpenses = expenses.filter(e => new Date(e.date) >= periodStart && new Date(e.date) <= periodEnd);

  const outputVat = periodInvoices.reduce((s,i) => s+i.vatAmount, 0);
  const inputVat = periodExpenses.reduce((s,e) => s+e.vatAmount, 0);
  const vatPayable = outputVat - inputVat;

  const missingVat = invoices.filter(i => !i.lineItems?.some(l => l.vatTreatment));

  function exportReport() {
    const rows = [
      ['VAT Period', `${formatDate(periodStart.toISOString())} - ${formatDate(periodEnd.toISOString())}`],
      ['Output VAT', outputVat.toFixed(2)],
      ['Input VAT', inputVat.toFixed(2)],
      ['VAT Payable', vatPayable.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vat-report.csv'; a.click();
  }

  if (!business?.vatRegistered) {
    return (
      <div className="glass flex flex-col items-center rounded-2xl p-14 text-center">
        <Landmark className="h-10 w-10 text-t3 mb-3" />
        <div className="text-[14px] font-medium text-t1">VAT tracking not enabled</div>
        <p className="mt-1 text-[13px] text-t2 max-w-sm">Your business isn't marked as VAT registered. Update this in Settings to activate the VAT Centre.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <div className="text-[11px] uppercase tracking-wide text-t2">Current VAT Period</div>
        <div className="mt-1 text-[15px] font-semibold text-t1">{formatDate(periodStart.toISOString())} — {formatDate(periodEnd.toISOString())}</div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Output VAT</div><div className="mt-2 font-mono text-[22px] font-semibold text-emerald">{formatRands(outputVat, true)}</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Input VAT</div><div className="mt-2 font-mono text-[22px] font-semibold text-t1">{formatRands(inputVat, true)}</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Est. VAT Payable</div><div className={`mt-2 font-mono text-[22px] font-semibold ${vatPayable>=0?'text-warn':'text-emerald'}`}>{formatRands(Math.abs(vatPayable), true)}</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">VAT Reserve</div><div className="mt-2 font-mono text-[22px] font-semibold text-t1">{formatRands(Math.max(0,vatPayable), true)}</div></div>
      </div>

      {missingVat.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-warn/25 bg-warn/5 p-4">
          <FileWarning className="h-4 w-4 text-warn shrink-0" />
          <span className="text-[13px] text-warn">{missingVat.length} invoice(s) missing VAT treatment — review before filing.</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-t1">VAT History</h2>
        <button onClick={exportReport} className="flex items-center gap-1.5 rounded-xl border border-midnight-border2 px-3.5 py-2 text-[12px] text-t1 hover:bg-midnight-raised">
          <Download className="h-3.5 w-3.5" /> Generate VAT report
        </button>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-midnight-border">
            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-t3">Invoice</th>
            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-t3">Date</th>
            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wide text-t3">VAT</th>
          </tr></thead>
          <tbody>
            {periodInvoices.map(i => (
              <tr key={i.id} className="border-b border-midnight-border/40">
                <td className="px-4 py-2.5 text-t1">{i.invoiceNumber}</td>
                <td className="px-4 py-2.5 text-t2">{formatDate(i.issueDate)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-t1">{formatRands(i.vatAmount)}</td>
              </tr>
            ))}
            {periodInvoices.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-t2">No invoices this period</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
