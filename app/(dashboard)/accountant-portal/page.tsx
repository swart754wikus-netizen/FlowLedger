'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { UserCheck, Mail, Eye } from 'lucide-react';
import type { AccountantInvite } from '@/types/domain';

export default function AccountantPortalPage() {
  const { business } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<AccountantInvite[]>([]);

  useEffect(() => {
    if (!business?.id) return;
    const q = query(collection(db, 'accountantInvites'), where('businessId', '==', business.id));
    return onSnapshot(q, snap => setInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })) as AccountantInvite[]));
  }, [business?.id]);

  async function sendInvite() {
    if (!business || !email) return;
    const ref = doc(collection(db, 'accountantInvites'));
    await setDoc(ref, { id: ref.id, businessId: business.id, email, status: 'pending', invitedAt: Date.now() });
    toast(`Invite sent to ${email}`);
    setEmail('');
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald" /><h2 className="text-[14px] font-semibold text-t1">Invite your accountant</h2></div>
        <p className="text-[12px] text-t2">They'll get read-only access to review VAT, transactions, and download reports.</p>
        <div className="flex gap-2">
          <input className="flex-1 rounded-xl border border-midnight-border2 bg-midnight-raised px-3.5 py-2.5 text-[13px] text-t1 placeholder:text-t3 outline-none focus:border-emerald/50" placeholder="accountant@firm.co.za" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={sendInvite} className="flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2.5 text-[13px] font-semibold text-midnight hover:brightness-110"><Mail className="h-3.5 w-3.5" />Invite</button>
        </div>
      </div>

      {invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[13px] font-semibold text-t1">Invited accountants</h3>
          {invites.map(inv => (
            <div key={inv.id} className="glass flex items-center justify-between rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-[13px] text-t1"><Eye className="h-3.5 w-3.5 text-t3" />{inv.email}</div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${inv.status === 'accepted' ? 'bg-emerald-bg text-emerald' : 'bg-warn/10 text-warn'}`}>{inv.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
