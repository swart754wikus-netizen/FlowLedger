'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  TrendingUp, LayoutDashboard, FileText, Receipt, ArrowLeftRight, Landmark,
  LineChart, Users, Truck, BarChart3, Sparkles, UserCheck, Settings, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'VAT Centre', href: '/vat-centre', icon: Landmark },
  { label: 'Cashflow Forecast', href: '/cashflow', icon: LineChart },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Suppliers', href: '/suppliers', icon: Truck },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
  { label: 'Accountant Portal', href: '/accountant-portal', icon: UserCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, business } = useAuth();

  const initials = (profile?.fullName ?? '').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  async function handleSignOut() {
    await signOut(auth);
    router.push('/login');
  }

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-midnight-border bg-midnight-card/40 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald">
          <TrendingUp className="h-4 w-4 text-midnight" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-t1">FlowLedger</div>
          <div className="truncate text-[9px] uppercase tracking-wider text-emerald">{business?.name ?? '...'}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={cn(
                'mb-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-colors',
                active ? 'bg-emerald-bg text-emerald font-medium' : 'text-t2 hover:bg-midnight-raised hover:text-t1',
              )}>
              <Icon className="h-[15px] w-[15px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-midnight-border px-3 py-2">
        <Link href="/settings"
          className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-colors',
            pathname === '/settings' ? 'bg-emerald-bg text-emerald font-medium' : 'text-t2 hover:bg-midnight-raised hover:text-t1')}>
          <Settings className="h-[15px] w-[15px]" /> Settings
        </Link>
      </div>

      <div className="border-t border-midnight-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-bg text-[11px] font-semibold text-emerald">
            {initials || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] text-t1">{profile?.fullName ?? '...'}</div>
            <div className="text-[10px] text-t3 capitalize">{profile?.role ?? 'owner'}</div>
          </div>
          <button onClick={handleSignOut} className="text-t3 hover:text-loss"><LogOut className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </aside>
  );
}
