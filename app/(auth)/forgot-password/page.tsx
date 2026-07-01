'use client';
import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { AuthShell } from '../_components/AuthShell';
import { Loader2, CheckCircle } from 'lucide-react';

const INP = 'w-full rounded-xl border border-midnight-border2 bg-midnight-raised px-4 py-3 text-[14px] text-t1 placeholder:text-t3 outline-none transition-colors focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a reset link">
      {sent ? (
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle className="h-10 w-10 text-emerald mb-3" />
          <p className="text-[13px] text-t2">Check <span className="text-t1">{email}</span> for a link to reset your password.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-loss/10 border border-loss/30 px-3 py-2 text-[12px] text-loss">{error}</div>}
          <div>
            <label className="mb-1.5 block text-[12px] text-t2">Email</label>
            <input type="email" required className={INP} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.co.za" />
          </div>
          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-3 text-[14px] font-semibold text-midnight hover:brightness-110 disabled:opacity-60 transition">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-[13px] text-t2">
        <Link href="/login" className="text-emerald hover:underline">← Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
