'use client';
import { useTransactions } from '@/lib/hooks/useFirestoreData';
import { formatRands, formatDate } from '@/lib/utils/format';
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function TransactionsPage() {
  const { data: transactions, loading } = useTransactions();
  const income = transactions.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Total Income</div><div className="mt-2 font-mono text-[24px] font-semibold text-emerald">{formatRands(income, true)}</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Total Expenses</div><div className="mt-2 font-mono text-[24px] font-semibold text-loss">{formatRands(expense, true)}</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-[11px] uppercase tracking-wide text-t2">Net</div><div className={`mt-2 font-mono text-[24px] font-semibold ${income-expense>=0?'text-emerald':'text-loss'}`}>{formatRands(income-expense, true)}</div></div>
      </div>

      {loading ? <div className="text-[13px] text-t2">Loading…</div> : transactions.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-2xl p-14 text-center">
          <ArrowLeftRight className="h-10 w-10 text-t3 mb-3" />
          <div className="text-[14px] font-medium text-t1">No transactions yet</div>
          <p className="mt-1 text-[13px] text-t2">Invoices and expenses will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(t => (
            <div key={t.id} className="glass flex items-center gap-4 rounded-xl p-3.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${t.type==='income'?'bg-emerald-bg':'bg-loss/10'}`}>
                {t.type==='income' ? <ArrowUpRight className="h-4 w-4 text-emerald" /> : <ArrowDownRight className="h-4 w-4 text-loss" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-t1 truncate">{t.reference}</div>
                <div className="text-[11px] text-t2">{t.category} · {formatDate(t.date)}</div>
              </div>
              <span className={`font-mono text-[13px] ${t.type==='income'?'text-emerald':'text-loss'}`}>{t.type==='income'?'+':'−'}{formatRands(t.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
