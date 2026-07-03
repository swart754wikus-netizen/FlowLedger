'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useInvoices, useExpenses } from '@/lib/hooks/useFirestoreData';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { formatRands, formatPercent, daysUntil, daysOverdue } from '@/lib/utils/format';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, FileWarning, Landmark, Activity, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data: invoices, loading: invLoading } = useInvoices();
  const { data: expenses, loading: expLoading } = useExpenses();
  const loading = invLoading || expLoading;

  const firstName = (profile?.fullName ?? '').split(' ')[0] || 'there';
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyIncome = invoices.filter(i => new Date(i.issueDate) >= monthStart).reduce((s, i) => s + i.total, 0);
  const monthlyExpenses = expenses.filter(e => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0);
  const netProfit = monthlyIncome - monthlyExpenses;
  const outstandingInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + i.balanceDue, 0);
  const overdueInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && daysOverdue(i.dueDate) > 0 && new Date(i.dueDate) < now);
  const outputVat = invoices.reduce((s, i) => s + i.vatAmount, 0);
  const inputVat = expenses.reduce((s, e) => s + e.vatAmount, 0);
  const vatPayable = outputVat - inputVat;
  const cashAvailable = monthlyIncome - monthlyExpenses; // simplified proxy

  const healthScore = Math.min(100, Math.max(0, Math.round(
    (netProfit > 0 ? 30 : 10) + (overdueInvoices.length === 0 ? 30 : Math.max(0, 30 - overdueInvoices.length * 5)) + 25 + 15
  )));

  // Build simple 6-month chart from invoices/expenses
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - 5 + i + 1, 1);
    const income = invoices.filter(inv => new Date(inv.issueDate) >= d && new Date(inv.issueDate) < next).reduce((s, inv) => s + inv.total, 0);
    const exp = expenses.filter(e => new Date(e.date) >= d && new Date(e.date) < next).reduce((s, e) => s + e.amount, 0);
    return { month: d.toLocaleDateString('en-ZA', { month: 'short' }), income, expenses: exp, balance: income - exp };
  });

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[24px] font-bold text-t1">{greeting()}, {firstName}. 👋</h1>
        <p className="text-[13px] text-t2">{now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Cash Available" value={formatRands(cashAvailable, true)} icon={Wallet} tone={cashAvailable >= 0 ? 'profit' : 'loss'} delay={0} />
        <KpiCard label="Monthly Income" value={formatRands(monthlyIncome, true)} icon={TrendingUp} delay={0.05} />
        <KpiCard label="Monthly Expenses" value={formatRands(monthlyExpenses, true)} icon={TrendingDown} delay={0.1} />
        <KpiCard label="Net Profit" value={formatRands(netProfit, true)} tone={netProfit >= 0 ? 'profit' : 'loss'} delay={0.15} />
        <KpiCard label="Outstanding Invoices" value={formatRands(outstandingInvoices, true)} icon={FileWarning} tone={outstandingInvoices > 0 ? 'warn' : 'default'} delay={0.2} />
        <KpiCard label="Outstanding Bills" value={formatRands(0, true)} delay={0.25} />
        <KpiCard label="VAT Reserve" value={formatRands(Math.max(0, vatPayable), true)} icon={Landmark} delay={0.3} />
        <KpiCard label="Business Health" value={`${healthScore}/100`} icon={Activity} tone={healthScore >= 70 ? 'profit' : healthScore >= 45 ? 'warn' : 'loss'} delay={0.35} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-t1">Cashflow Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222a35" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#4a5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} width={50} />
              <Tooltip contentStyle={{ background: '#161c26', border: '1px solid #2e3845', borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatRands(v)} />
              <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fill="url(#cf)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-2xl p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-t1">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222a35" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#4a5563', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4a5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} width={50} />
              <Tooltip contentStyle={{ background: '#161c26', border: '1px solid #2e3845', borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatRands(v)} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {overdueInvoices.length > 0 && (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between rounded-2xl border border-loss/25 bg-loss/5 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-loss shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-loss">{overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}</div>
                <div className="text-[12px] text-t2">{formatRands(overdueInvoices.reduce((s,i) => s+i.balanceDue,0))} outstanding</div>
              </div>
            </div>
            <Link href="/invoices" className="text-[12px] font-medium text-loss hover:underline">Review →</Link>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          className="flex items-center justify-between rounded-2xl border border-emerald/20 bg-emerald-bg p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-emerald shrink-0" />
            <div>
              <div className="text-[13px] font-medium text-emerald">Ask the AI Assistant</div>
              <div className="text-[12px] text-t2">Get instant insights about your cashflow, VAT, and profitability.</div>
            </div>
          </div>
          <Link href="/ai-assistant" className="text-[12px] font-medium text-emerald hover:underline flex items-center gap-1">Open <ArrowRight className="h-3 w-3" /></Link>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-t1">Recent Activity</h2>
        {loading ? (
          <div className="text-[13px] text-t2">Loading…</div>
        ) : invoices.length === 0 && expenses.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-[13px] text-t2">
            No activity yet. <Link href="/invoices/new" className="text-emerald hover:underline">Create your first invoice →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {[...invoices.slice(0,3).map(i => ({ kind: 'invoice' as const, ...i })), ...expenses.slice(0,2).map(e => ({ kind: 'expense' as const, ...e }))]
              .sort((a,b) => b.createdAt - a.createdAt).slice(0,5).map((item: any) => (
              <div key={item.id} className="glass flex items-center gap-4 rounded-xl p-3.5">
                <div className={`h-2 w-2 rounded-full ${item.kind === 'invoice' ? 'bg-emerald' : 'bg-loss'}`} />
                <div className="flex-1 text-[13px] text-t1">
                  {item.kind === 'invoice' ? `Invoice ${item.invoiceNumber} — ${item.customerName}` : `Expense — ${item.category}`}
                </div>
                <div className={`font-mono text-[13px] ${item.kind === 'invoice' ? 'text-emerald' : 'text-loss'}`}>
                  {item.kind === 'invoice' ? '+' : '−'}{formatRands(item.kind === 'invoice' ? item.total : item.amount, true)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
