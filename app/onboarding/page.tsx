'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { motion } from 'framer-motion';
import { TrendingUp, Loader2 } from 'lucide-react';

const INP = 'w-full rounded-xl border border-midnight-border2 bg-midnight-raised px-4 py-3 text-[14px] text-t1 placeholder:text-t3 outline-none focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring';
const SEL = `${INP} appearance-none`;

export default function OnboardingPage() {
  const router = useRouter();
  const [uid, setUid] = useState('');
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', tradingName: '', vatNumber: '', vatRegistered: false });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push('/login'); return; }
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
      const profile = profileSnap.data();
      if (profile?.onboardingComplete && profile?.businessId) { router.push('/dashboard'); return; }
      setUid(user.uid);
      setChecking(false);
    });
    return unsub;
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const bizRef = doc(collection(db, 'businesses'));
      await setDoc(bizRef, {
        id: bizRef.id, name: form.name, tradingName: form.tradingName || null,
        vatNumber: form.vatNumber || null, vatRegistered: form.vatRegistered,
        vatPeriodMonths: 2, currency: 'ZAR', createdAt: Date.now(),
      });
      await setDoc(doc(db, 'profiles', uid), { businessId: bizRef.id, onboardingComplete: true }, { merge: true });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-midnight text-[13px] text-t2">Loading…</div>;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald/10 blur-[120px]" />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass relative z-10 w-full max-w-[440px] rounded-3xl p-8 shadow-glass">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald">
            <TrendingUp className="h-6 w-6 text-midnight" strokeWidth={2.5} />
          </div>
          <h1 className="text-[20px] font-bold text-t1">Tell us about your business</h1>
          <p className="mt-1 text-[13px] text-t2">Takes less than a minute</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] text-t2">Business name *</label>
            <input required className={INP} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] text-t2">Trading name</label>
            <input className={INP} value={form.tradingName} onChange={e => setForm(f => ({...f, tradingName: e.target.value}))} />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-t2 cursor-pointer">
            <input type="checkbox" checked={form.vatRegistered} onChange={e => setForm(f => ({...f, vatRegistered: e.target.checked}))} className="accent-emerald h-4 w-4" />
            We are VAT registered
          </label>
          {form.vatRegistered && (
            <div>
              <label className="mb-1.5 block text-[12px] text-t2">VAT number</label>
              <input className={INP} value={form.vatNumber} onChange={e => setForm(f => ({...f, vatNumber: e.target.value}))} />
            </div>
          )}
          <button type="submit" disabled={loading || !form.name}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-3 text-[14px] font-semibold text-midnight hover:brightness-110 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue to dashboard →
          </button>
        </form>
      </motion.div>
    </div>
  );
}
