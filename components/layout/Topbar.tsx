'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, Plus, Menu } from 'lucide-react';

const PAGE: Record<string, { title: string; action?: { label: string; href: string } }> = {
  '/dashboard': { title: 'Dashboard' },
  '/quotes': { title: 'Quotes', action: { label: 'New Quote', href: '/quotes/new' } },
  '/invoices': { title: 'Invoices', action: { label: 'New Invoice', href: '/invoices/new' } },
  '/expenses': { title: 'Expenses', action: { label: 'New Expense', href: '/expenses?new=1' } },
  '/transactions': { title: 'Transactions' },
  '/vat-centre': { title: 'VAT Centre' },
  '/cashflow': { title: 'Cashflow Forecast' },
  '/customers': { title: 'Customers', action: { label: 'New Customer', href: '/customers?new=1' } },
  '/suppliers': { title: 'Suppliers', action: { label: 'New Supplier', href: '/suppliers?new=1' } },
  '/reports': { title: 'Reports' },
  '/ai-assistant': { title: 'AI Assistant' },
  '/accountant-portal': { title: 'Accountant Portal' },
  '/settings': { title: 'Settings' },
};

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const base = '/' + (pathname.split('/').filter(Boolean)[0] ?? '');
  const config = PAGE[base] ?? { title: 'FlowLedger' };

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-midnight-border bg-midnight/70 px-4 backdrop-blur-xl md:px-7">
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="flex h-9 w-9 items-center justify-center rounded-xl text-t2 hover:bg-midnight-raised hover:text-t1 md:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-[15px] font-semibold text-t1">{config.title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-t2 hover:bg-midnight-raised hover:text-t1 transition-colors">
          <Search className="h-4 w-4" />
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-t2 hover:bg-midnight-raised hover:text-t1 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald" />
        </button>
        {config.action && (
          <Link href={config.action.href}
            className="flex items-center gap-1.5 rounded-xl bg-emerald px-4 py-2 text-[13px] font-semibold text-midnight hover:brightness-110 transition">
            <Plus className="h-3.5 w-3.5" /> {config.action.label}
          </Link>
        )}
      </div>
    </header>
  );
}
