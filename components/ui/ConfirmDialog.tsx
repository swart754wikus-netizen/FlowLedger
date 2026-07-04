'use client';

export function ConfirmDialog({ open, message, onConfirm, onCancel }: { open: boolean; message: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/85 backdrop-blur-sm p-4">
      <div className="glass-raised w-full max-w-sm rounded-2xl p-6 space-y-4">
        <p className="text-[14px] text-t1">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-midnight-border2 py-2.5 text-[13px] text-t1 hover:bg-midnight-raised">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-emerald py-2.5 text-[13px] font-semibold text-midnight hover:brightness-110">Confirm</button>
        </div>
      </div>
    </div>
  );
}
