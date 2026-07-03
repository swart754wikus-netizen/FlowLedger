'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, collection, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCustomers, useInvoices } from '@/lib/hooks/useFirestoreData';
import { useToast } from '@/components/ui/Toast';
import { formatRands } from '@/lib/utils/format';
import { Users, X } from 'lucide-react';

const INP = 'w-full rounded-xl border border-midnight-border2 bg-midnight-raised px-3.5 py-2.5 text-[13px] text-t1 placeholder:text-t3 outline-none focus:border-emerald/50 focus:ring-2 focus:ring-emerald-ring';

export default function CustomersPage() {
  const { business } = useAuth();
  const { data: customers, loading } = useCustomers();
  const { data: invoices } = useInvoices();
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [showModal, setShowModal] = useState(sp.get('new') === '1');
  const [form, setForm] = useState({ company: '', contactPerson: '', email: '', phone: '' });

  useEffect(() => {
    if (sp.get('new') === '1') setShowModal(true);
  }, [sp]);

  async function save() {
    if (!business || !form.company) { toast('Enter a company name', 'error'); return; }
    try {
      const ref = doc(collection(db, 'customers'));
      await setDoc(ref, { id: ref.id, businessId: business.id, ...form, outstandingBalance: 0, createdAt: Date.now() });
      toast('Customer added');
      setShowModal(false); setForm({ company: '', contactPerson: '', email: '', phone: '' });
      router.replace('/customers');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      {loading ? <div className="text-[13px] text-t2">Loading…</div> : customers.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-2xl p-14 text-center">
          <Users className="h-10 w-10 text-t3 mb-3" />
          <div className="text-[14px] font-medium text-t1">No customers yet</div>
          <button onClick={() => setShowModal(true)} className="mt-4 rounded-xl bg-emerald px-4 py-2.5 text-[13px] font-semibold text-midnight">+ New Customer</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map(c => {
            const custInvoices = invoices.filter(i => i.customerId === c.id);
            const outstanding = custInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s,i) => s+i.balanceDue, 0);
            return (
              <div key={c.id} className="glass rounded-2xl p-5">
                <div className="text-[14px] font-semibold text-t1">{c.company}</div>
                {c.contactPerson && <div className="text-[12px] text-t2">{c.contactPerson}</div>}
                <div className="mt-3 flex justify-between text-[12px]">
                  <span className="text-t2">Outstanding</span>
                  <span className={`font-mono ${outstanding > 0 ? 'text-warn' : 'text-t1'}`}>{formatRands(outstanding, true)}</span>
                </div>
                <div className="mt-1 flex justify-between text-[12px]">
                  <span className="text-t2">Invoices</span><span className="font-mono text-t1">{custInvoices.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/85 backdrop-blur-sm p-4">
          <div className="glass-raised w-full max-w-sm rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-[16px] font-semibold text-t1">New Customer</h3>
              <button onClick={() => { setShowModal(false); router.replace('/customers'); }} className="text-t2 hover:text-t1"><X className="h-4 w-4" /></button></div>
            <div className="space-y-3">
              <input className={INP} placeholder="Company *" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} />
              <input className={INP} placeholder="Contact person" value={form.contactPerson} onChange={e => setForm(f => ({...f, contactPerson: e.target.value}))} />
              <input className={INP} placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              <input className={INP} placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
              <button onClick={save} className="w-full rounded-xl bg-emerald py-2.5 text-[13px] font-semibold text-midnight">Save customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
