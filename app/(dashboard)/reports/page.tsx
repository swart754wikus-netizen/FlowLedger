'use client';
import { useInvoices, useExpenses } from '@/lib/hooks/useFirestoreData';
import { formatRands } from '@/lib/utils/format';
import { FileText, Download } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const REPORTS = [
  { key: 'pl', label: 'Profit & Loss', desc: 'Income, expenses, and net profit summary' },
  { key: 'cashflow', label: 'Cashflow Report', desc: 'Money in vs money out over time' },
  { key: 'sales', label: 'Sales Report', desc: 'Revenue by customer and period' },
  { key: 'expense', label: 'Expense Report', desc: 'Spending by category and supplier' },
  { key: 'vat', label: 'VAT Report', desc: 'Output and input VAT for filing' },
  { key: 'customer', label: 'Customer Statements', desc: 'Per-customer transaction history' },
  { key: 'supplier', label: 'Supplier Statements', desc: 'Per-supplier transaction history' },
];

export default function ReportsPage() {
  const { data: invoices } = useInvoices();
  const { data: expenses } = useExpenses();
  const toast = useToast();

  function exportCsv(key: string) {
    let rows: string[][] = [];
    if (key === 'pl') {
      const income = invoices.reduce((s,i) => s+i.total, 0);
      const exp = expenses.reduce((s,e) => s+e.amount, 0);
      rows = [['Metric','Amount'],['Total Income', income.toFixed(2)],['Total Expenses', exp.toFixed(2)],['Net Profit', (income-exp).toFixed(2)]];
    } else if (key === 'sales') {
      rows = [['Invoice','Customer','Total','Status'], ...invoices.map(i => [i.invoiceNumber, i.customerName, i.total.toFixed(2), i.status])];
    } else if (key === 'expense') {
      rows = [['Category','Supplier','Amount','Date'], ...expenses.map(e => [e.category, e.supplierName ?? '', e.amount.toFixed(2), e.date])];
    } else if (key === 'vat') {
      rows = [['Type','Reference','VAT'], ...invoices.map(i => ['Output', i.invoiceNumber, i.vatAmount.toFixed(2)]), ...expenses.map(e => ['Input', e.category, e.vatAmount.toFixed(2)])];
    } else {
      rows = [['Report', key], ['Note', 'Sample export — connect more data to populate fully']];
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${key}-report.csv`; a.click();
    toast('Report exported');
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {REPORTS.map(r => (
        <div key={r.key} className="glass flex items-center justify-between rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-bg"><FileText className="h-4 w-4 text-emerald" /></div>
            <div><div className="text-[13px] font-semibold text-t1">{r.label}</div><div className="text-[11px] text-t2">{r.desc}</div></div>
          </div>
          <button onClick={() => exportCsv(r.key)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-midnight-border2 text-t2 hover:text-t1 hover:bg-midnight-raised"><Download className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  );
}
