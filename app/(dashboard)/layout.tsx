'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Loader2 } from 'lucide-react';

function Guard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    if (profile && !profile.onboardingComplete) { router.push('/onboarding'); return; }
  }, [loading, user, profile, router]);

  if (loading || !user || !profile?.onboardingComplete) {
    return (
      <div className="flex h-screen items-center justify-center bg-midnight">
        <Loader2 className="h-6 w-6 animate-spin text-emerald" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-midnight">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-7">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Guard>{children}</Guard>
      </ToastProvider>
    </AuthProvider>
  );
}
