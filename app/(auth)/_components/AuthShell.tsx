'use client';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-midnight px-4">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-emerald/5 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass relative z-10 w-full max-w-[420px] rounded-3xl p-8 shadow-glass"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald">
            <TrendingUp className="h-6 w-6 text-midnight" strokeWidth={2.5} />
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-t1">{title}</h1>
          <p className="mt-1.5 text-[13px] text-t2">{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
