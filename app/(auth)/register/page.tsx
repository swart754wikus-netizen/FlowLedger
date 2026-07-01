'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { AuthShell } from '../_components/AuthShell';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const INP = 'w-full rounded-xl border border-midnight-border2 bg-midnight-raised px-4 py-3 text-[14px] text-t1 placeholder:text-t3 outline-none transition-colors focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function strength(pw: string) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }
  const pwStrength = strength(form.password);
  const strengthColor = ['bg-loss','bg-loss','bg-warn','bg-emerald','bg-emerald'][pwStrength];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.fullName });
      await setDoc(doc(db, 'profiles', cred.user.uid), {
        id: cred.user.uid, fullName: form.fullName, email: form.email,
        role: 'owner', onboardingComplete: false, businessId: null, createdAt: Date.now(),
      });
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.code === 'auth/email-already-in-use' ? 'An account with this email already exists.' : err.message);
    } finally { setLoading(false); }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start your free trial — no card required">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-xl bg-loss/10 border border-loss/30 px-3 py-2 text-[12px] text-loss">{error}</div>}
        <div>
          <label className="mb-1.5 block text-[12px] text-t2">Full name</label>
          <input required className={INP} value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))} placeholder="Your name" />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] text-t2">Email</label>
          <input type="email" required className={INP} value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@business.co.za" />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] text-t2">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} required minLength={8} className={INP} value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t3 hover:text-t1">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2 flex gap-1">
              {[0,1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i < pwStrength ? strengthColor : 'bg-midnight-border2'}`} />)}
            </div>
          )}
        </div>
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-3 text-[14px] font-semibold text-midnight hover:brightness-110 disabled:opacity-60 transition">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-t2">
        Already have an account? <Link href="/login" className="text-emerald hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
