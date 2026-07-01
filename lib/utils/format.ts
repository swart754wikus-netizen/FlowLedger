export function formatRands(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) return `R ${(amount / 1_000_000).toFixed(1)}M`;
  if (compact && Math.abs(amount) >= 100_000) return `R ${(amount / 1000).toFixed(0)}k`;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency', currency: 'ZAR', currencyDisplay: 'symbol',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount).replace('ZAR', 'R');
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function daysOverdue(iso: string): number {
  return Math.max(0, Math.ceil((Date.now() - new Date(iso).getTime()) / 86_400_000));
}
