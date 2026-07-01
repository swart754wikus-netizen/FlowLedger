'use client';
import { useState, useEffect, useRef } from 'react';
import { useInvoices, useExpenses } from '@/lib/hooks/useFirestoreData';
import { formatRands } from '@/lib/utils/format';
import { Send, Sparkles, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const CHIPS = ['What are my unpaid invoices?', 'Why are my expenses up?', 'Can I afford new equipment?', 'How much VAT do I owe?'];

interface Msg { role: 'user' | 'assistant'; content: string; }
interface Insight { title: string; body: string; tone: 'warn' | 'profit' | 'neutral'; }

export default function AiAssistantPage() {
  const { data: invoices } = useInvoices();
  const { data: expenses } = useExpenses();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  function buildContext() {
    const outstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s,i) => s+i.balanceDue, 0);
    const totalIncome = invoices.reduce((s,i) => s+i.total, 0);
    const totalExpenses = expenses.reduce((s,e) => s+e.amount, 0);
    const outputVat = invoices.reduce((s,i) => s+i.vatAmount, 0);
    const inputVat = expenses.reduce((s,e) => s+e.vatAmount, 0);
    return {
      outstanding_invoices: formatRands(outstanding),
      total_income: formatRands(totalIncome),
      total_expenses: formatRands(totalExpenses),
      net_profit: formatRands(totalIncome - totalExpenses),
      vat_payable: formatRands(outputVat - inputVat),
      invoice_count: invoices.length,
      expense_count: expenses.length,
    };
  }

  useEffect(() => {
    if (invoices.length === 0 && expenses.length === 0) { setInsightsLoading(false); return; }
    fetch('/api/ai/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: buildContext() }) })
      .then(r => r.json()).then(d => setInsights(d.insights ?? [])).finally(() => setInsightsLoading(false));
  }, [invoices.length, expenses.length]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMessages(m => [...m, { role: 'user', content: text }]);
    setInput(''); setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: messages, context: buildContext() }) });
      const { response } = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: response }]);
    } catch { setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong — try again.' }]); }
    setLoading(false);
  }

  const ICONS = { warn: AlertTriangle, profit: TrendingUp, neutral: Sparkles };
  const COLORS = { warn: 'text-warn border-warn/25 bg-warn/5', profit: 'text-emerald border-emerald/25 bg-emerald-bg', neutral: 'text-t2 border-midnight-border bg-midnight-card' };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 h-full" style={{ height: 'calc(100vh - 60px - 3.5rem)' }}>
      <div className="flex flex-col">
        <div className="flex flex-wrap gap-2 mb-4">
          {CHIPS.map(c => <button key={c} onClick={() => send(c)} className="rounded-full border border-midnight-border2 px-3 py-1.5 text-[12px] text-t2 hover:border-emerald/40 hover:text-emerald transition-colors">{c}</button>)}
        </div>
        <div className="glass flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 mb-4">
          {messages.length === 0 && <div className="flex h-full items-center justify-center text-[13px] text-t3">Ask anything about your finances.</div>}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-emerald text-midnight' : 'glass-raised text-t1'}`}>{m.content}</div>
            </div>
          ))}
          {loading && <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-t3 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Ask FlowLedger AI…" className="flex-1 rounded-xl border border-midnight-border2 bg-midnight-raised px-4 py-3 text-[13px] text-t1 placeholder:text-t3 outline-none focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring" />
          <button onClick={() => send(input)} disabled={loading} className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-emerald text-midnight hover:brightness-110 disabled:opacity-60"><Send className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-t2">AI Insights</h3>
        {insightsLoading ? <div className="text-[12px] text-t3">Generating…</div> : insights.length === 0 ? (
          <div className="text-[12px] text-t3">Add invoices and expenses to unlock insights.</div>
        ) : insights.map((ins, i) => {
          const Icon = ICONS[ins.tone] ?? Sparkles;
          return (
            <div key={i} className={`rounded-xl border p-3.5 ${COLORS[ins.tone] ?? COLORS.neutral}`}>
              <div className="flex items-center gap-2 mb-1"><Icon className="h-3.5 w-3.5" /><span className="text-[12px] font-semibold">{ins.title}</span></div>
              <p className="text-[12px] leading-relaxed text-t1">{ins.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
