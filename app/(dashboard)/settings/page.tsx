'use client';
import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';

const TABS = ['Business Profile', 'Billing'];
const INP = 'w-full rounded-xl border border-midnight-border2 bg-midnight-raised px-3.5 py-2.5 text-[13px] text-t1 placeholder:text-t3 outline-none focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring';

export default function SettingsPage() {
  const { business } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('Business Profile');
  const [form, setForm] = useState({ name: '', tradingName: '', vatNumber: '', vatRegistered: false });

  useEffect(() => { if (business) setForm({ name: business.name, tradingName: business.tradingName ?? '', vatNumber: business.vatNumber ?? '', vatRegistered: business.vatRegistered }); }, [business]);

  async function save() {
    if (!business) return;
    await updateDoc(doc(db, 'businesses', business.id), form);
    toast('Settings saved');
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 rounded-xl bg-midnight-card p-1 w-fit">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${tab===t?'bg-midnight-raised text-t1':'text-t2 hover:text-t1'}`}>{t}</button>)}
      </div>

      {tab === 'Business Profile' && (
        <div className="max-w-lg space-y-4">
          <div><label className="mb-1.5 block text-[12px] text-t2">Business name</label><input className={INP} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
          <div><label className="mb-1.5 block text-[12px] text-t2">Trading name</label><input className={INP} value={form.tradingName} onChange={e => setForm(f => ({...f, tradingName: e.target.value}))} /></div>
          <label className="flex items-center gap-2 text-[13px] text-t2 cursor-pointer"><input type="checkbox" checked={form.vatRegistered} onChange={e => setForm(f => ({...f, vatRegistered: e.target.checked}))} className="accent-emerald h-4 w-4" />VAT registered</label>
          {form.vatRegistered && <div><label className="mb-1.5 block text-[12px] text-t2">VAT number</label><input className={INP} value={form.vatNumber} onChange={e => setForm(f => ({...f, vatNumber: e.target.value}))} /></div>}
          <button onClick={save} className="rounded-xl bg-emerald px-5 py-2.5 text-[13px] font-semibold text-midnight hover:brightness-110">Save changes</button>
        </div>
      )}

      {tab === 'Billing' && (
        <div className="max-w-md glass rounded-2xl p-6 space-y-3">
          <div className="text-[16px] font-semibold text-t1">Pro Plan</div>
          <div className="font-mono text-[28px] font-bold text-emerald">R 499<span className="text-[14px] font-normal text-t2">/mo</span></div>
          <p className="text-[13px] text-t2">Your 14-day free trial is active.</p>
          <button onClick={() => toast('Billing upgrades coming soon', 'error')} className="w-full rounded-xl border border-midnight-border2 py-2.5 text-[13px] text-t2">Manage plan — coming soon</button>
        </div>
      )}
    </div>
  );
}
