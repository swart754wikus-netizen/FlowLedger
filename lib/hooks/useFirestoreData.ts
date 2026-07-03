'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from './useAuth';
import type { Invoice, Expense, Transaction, Customer, Supplier } from '@/types/domain';

function useCollection<T>(name: string, orderField = 'createdAt') {
  const { business } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) return;
    const q = query(collection(db, name), where('businessId', '==', business.id), orderBy(orderField, 'desc'));
    const unsub = onSnapshot(q, snap => {
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[]);
      setLoading(false);
    }, err => {
      console.error(`useCollection(${name}) failed:`, err);
      setLoading(false);
    });
    return unsub;
  }, [business?.id, name, orderField]);

  return { data, loading };
}

export const useInvoices = () => useCollection<Invoice>('invoices');
export const useExpenses = () => useCollection<Expense>('expenses');
export const useTransactions = () => useCollection<Transaction>('transactions');
export const useCustomers = () => useCollection<Customer>('customers');
export const useSuppliers = () => useCollection<Supplier>('suppliers');
