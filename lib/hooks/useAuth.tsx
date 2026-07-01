'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { UserProfile, Business } from '@/types/domain';

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  business: Business | null;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, profile: null, business: null, loading: true });

export function useAuth() { return useContext(Ctx); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) { setProfile(null); setBusiness(null); setLoading(false); }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), snap => {
      const data = snap.data() as UserProfile | undefined;
      setProfile(data ?? null);
      if (!data?.businessId) setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!profile?.businessId) return;
    const unsub = onSnapshot(doc(db, 'businesses', profile.businessId), snap => {
      setBusiness((snap.data() as Business) ?? null);
      setLoading(false);
    });
    return unsub;
  }, [profile?.businessId]);

  return <Ctx.Provider value={{ user, profile, business, loading }}>{children}</Ctx.Provider>;
}
