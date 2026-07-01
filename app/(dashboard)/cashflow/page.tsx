'use client';
import { useState } from 'react';
import { useInvoices, useExpenses } from '@/lib/hooks/useFirestoreData';
import { formatRands, daysUntil } from '@/lib/utils/format';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

const PERIODS = [{ label: '7 Days', days: 7 }, { label: '30 Days', days: 30 }, { label: '90 Days', days: 90 }, { label: '12 Months', days: 365 }];

export default function CashflowPage() {
  const [period, setPeriod] = useState(30);
  const { data: invoices } = useInvoices();
  const { data: expenses } = useExpenses();

  const periodEnd = new Date(); periodEnd.setDate(periodEnd.getDate() + period);
  const expectedIn = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && new Date(i.dueDate) <= periodEnd).reduce((s,i) => s+i.balanceDue, 0);
  const avgMonthlyExpense = expenses.length ? expenses.reduce((s,e) => s+e.amount,0) / Math.max(1, new Set(expenses.map(e => e.date.slice(0,7))).size) : 0;
  const expectedOut = avgMonthlyExpense * (period / 30);

  const buckets = Math.min(12, Math.ceil(period / (period > 90 ? 30 : 7)));
  const bucketLabel = period > 90 ? 'month' : 'week';
  const chartData = Array.from({ length: buckets }, (_, i) => ({
    label: `${bucketLabel === 'week' ? 'W' : 'M'}${i+1}`,
    balance: (expectedIn / buckets) - (expectedOut / buckets),
  }));

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl bg-midnight-card p-1 w-fit">
        {PERIODS.map(p => (
          <button key={p.days} onClick={() => setPeriod(p.days)} className={`rounded-lg px-4 py-2 text-[12px] font-medium transition-colors ${period===p.days?'bg-midnight-raised text-t1':'text-t2 hover:text-t1'}`}>{p.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Cash Now</div><div className="mt-2 font-mono text-[24px] font-semibold text-t3">—</div><div className="mt-1 text-[11px] text-t3">Connect bank for live balance</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Expected In</div><div className="mt-2 font-mono text-[24px] font-semibold text-emerald">{formatRands(expectedIn, true)}</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Expected Out</div><div className="mt-2 font-mono text-[24px] font-semibold text-loss">{formatRands(expectedOut, true)}</div></div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-4 text-[14px] font-semibold text-t1">Projected Bank Balance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <XAxis dataKey="label" tick={{ fill: '#4a5563', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4a5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} width={55} />
            <Tooltip contentStyle={{ background: '#161c26', border: '1px solid #2e3845', borderRadius: 12 }} formatter={(v: number) => formatRands(v)} />
            <Bar dataKey="balance" radius={[6,6,0,0]}>
              {chartData.map((d, i) => <Cell key={i} fill={d.balance >= 0 ? '#10b981' : '#f87171'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-3 text-[14px] font-semibold text-t1">Upcoming</h3>
        <div className="space-y-2">
          {invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').sort((a,b) => a.dueDate.localeCompare(b.dueDate)).slice(0,8).map(inv => (
            <div key={inv.id} className="glass flex items-center gap-3 rounded-xl p-3.5">
              <div className="h-2 w-2 rounded-full bg-emerald shrink-0" />
              <div className="flex-1"><div className="text-[13px] text-t1">{inv.invoiceNumber} — {inv.customerName}</div><div className="text-[11px] text-t2">Due in {daysUntil(inv.dueDate)} days</div></div>
              <span className="font-mono text-[13px] text-emerald">+{formatRands(inv.balanceDue, true)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
