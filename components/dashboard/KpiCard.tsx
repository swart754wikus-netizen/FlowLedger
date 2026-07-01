'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'profit' | 'warn' | 'loss';
  delay?: number;
}

const TONE = { default: 'text-t1', profit: 'text-emerald', warn: 'text-warn', loss: 'text-loss' };

export function KpiCard({ label, value, sub, icon: Icon, tone = 'default', delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-t2">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-t3" />}
      </div>
      <div className={cn('mt-2.5 font-mono text-[24px] font-semibold tabular-nums', TONE[tone])}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-t2">{sub}</div>}
    </motion.div>
  );
}
