'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Landmark, BarChart3, Check, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: TrendingUp, title: 'Cashflow Forecasting', desc: 'See 7, 30, 90-day and 12-month projections before problems hit.' },
  { icon: Landmark, title: 'VAT Intelligence', desc: 'Automatic output/input VAT tracking with SARS-ready reports.' },
  { icon: Sparkles, title: 'AI Financial Insights', desc: 'Plain-English answers to "how is my business doing?"' },
  { icon: BarChart3, title: 'Real Business Intelligence', desc: 'Know your most profitable customer, not just your revenue.' },
];

const PRICING = [
  { name: 'Starter', price: 'R299', features: ['Up to 50 invoices/mo', 'VAT Centre', 'Cashflow forecast', 'Email support'] },
  { name: 'Pro', price: 'R499', highlight: true, features: ['Unlimited invoices', 'AI Assistant', 'Accountant Portal', 'Priority support'] },
  { name: 'Business', price: 'R899', features: ['Everything in Pro', 'Multi-user access', 'Custom reports', 'Dedicated support'] },
];

const FAQS = [
  { q: 'Is FlowLedger VAT compliant for South Africa?', a: 'Yes — built specifically around SARS VAT periods, inclusive/exclusive/zero-rated/exempt treatment, and VAT201-ready reporting.' },
  { q: 'Can my accountant access my data?', a: 'Invite them from the Accountant Portal for read-only access to transactions, VAT, and reports.' },
  { q: 'Do I need accounting experience?', a: 'No. FlowLedger is built to answer "how is my business doing" in plain language, not double-entry bookkeeping.' },
];

export default function LandingPage() {
  return (
    <div className="bg-midnight">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-midnight-border bg-midnight/80 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald"><TrendingUp className="h-4 w-4 text-midnight" strokeWidth={2.5} /></div>
          <span className="text-[15px] font-bold text-t1">FlowLedger</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] text-t2 hover:text-t1">Sign in</Link>
          <Link href="/register" className="rounded-xl bg-emerald px-4 py-2 text-[13px] font-semibold text-midnight hover:brightness-110">Start free trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-8 pt-24 pb-32 text-center">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald/10 blur-[140px]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-block rounded-full border border-emerald/25 bg-emerald-bg px-3 py-1 text-[12px] text-emerald">Finance, made clear</span>
          <h1 className="mt-6 text-[48px] font-bold leading-[1.1] tracking-tight text-t1">Cashflow clarity. <span className="text-emerald">VAT confidence.</span> Business control.</h1>
          <p className="mt-5 text-[17px] text-t2 max-w-xl mx-auto">The modern finance operating system that answers one question: how is my business doing today, and what should I do next?</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/register" className="flex items-center gap-2 rounded-xl bg-emerald px-6 py-3.5 text-[14px] font-semibold text-midnight hover:brightness-110">Start free trial <ArrowRight className="h-4 w-4" /></Link>
            <Link href="#features" className="rounded-xl border border-midnight-border2 px-6 py-3.5 text-[14px] text-t1 hover:bg-midnight-raised">See features</Link>
          </div>
        </motion.div>

        {/* Dashboard preview mock */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
          className="glass relative z-10 mx-auto mt-16 max-w-4xl rounded-3xl p-6 shadow-glass">
          <div className="grid grid-cols-4 gap-3">
            {['Cash Available','Monthly Income','Net Profit','Health Score'].map((l,i) => (
              <div key={l} className="glass-raised rounded-xl p-4 text-left">
                <div className="text-[10px] uppercase text-t3">{l}</div>
                <div className="mt-1 font-mono text-[18px] font-semibold text-emerald">{i===3?'87/100':'R 124k'}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20">
        <h2 className="text-center text-[28px] font-bold text-t1">Everything your business finances need</h2>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.1 }}
              className="glass rounded-2xl p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-bg"><f.icon className="h-5 w-5 text-emerald" /></div>
              <h3 className="mt-4 text-[14px] font-semibold text-t1">{f.title}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-t2">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-8 py-20">
        <h2 className="text-center text-[28px] font-bold text-t1">Simple, transparent pricing</h2>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-3 gap-5">
          {PRICING.map(p => (
            <div key={p.name} className={`rounded-2xl p-6 ${p.highlight ? 'glass-raised border-2 border-emerald' : 'glass'}`}>
              {p.highlight && <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald">Most popular</span>}
              <div className="mt-2 text-[16px] font-semibold text-t1">{p.name}</div>
              <div className="mt-1 font-mono text-[28px] font-bold text-t1">{p.price}<span className="text-[13px] font-normal text-t2">/mo</span></div>
              <ul className="mt-4 space-y-2">
                {p.features.map(f => <li key={f} className="flex items-center gap-2 text-[12px] text-t2"><Check className="h-3.5 w-3.5 text-emerald shrink-0" />{f}</li>)}
              </ul>
              <Link href="/register" className={`mt-5 block rounded-xl py-2.5 text-center text-[13px] font-semibold ${p.highlight ? 'bg-emerald text-midnight' : 'border border-midnight-border2 text-t1'}`}>Get started</Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-8 py-20 max-w-2xl mx-auto">
        <h2 className="text-center text-[28px] font-bold text-t1 mb-10">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map(f => (
            <div key={f.q} className="glass rounded-xl p-5">
              <div className="text-[14px] font-semibold text-t1">{f.q}</div>
              <p className="mt-1.5 text-[13px] text-t2">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 text-center">
        <h2 className="text-[28px] font-bold text-t1">Ready to take control of your finances?</h2>
        <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald px-6 py-3.5 text-[14px] font-semibold text-midnight hover:brightness-110">
          Start your free trial <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-midnight-border px-8 py-8 text-center">
        <p className="text-[12px] text-t3">© {new Date().getFullYear()} FlowLedger. All rights reserved.</p>
        <p className="mt-1 text-[11px] text-t3">
          Powered by <a href="https://gls-technologies.co.za" target="_blank" rel="noopener noreferrer" className="text-emerald hover:underline">GLS Technologies</a>
        </p>
      </footer>
    </div>
  );
}
