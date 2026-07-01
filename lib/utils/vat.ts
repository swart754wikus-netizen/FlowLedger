import type { VatTreatment, LineItem } from '@/types/domain';

export const VAT_RATE = 0.15;

/**
 * Calculates the VAT amount and total for a single line item based on treatment.
 * - inclusive: unitPrice already includes VAT; VAT is backed out
 * - exclusive: unitPrice excludes VAT; VAT is added on top
 * - zero_rated / exempt: no VAT charged, but zero_rated still counts for VAT201 reporting
 */
export function calculateLineItem(quantity: number, unitPrice: number, treatment: VatTreatment) {
  const gross = quantity * unitPrice;

  if (treatment === 'exclusive') {
    const vat = gross * VAT_RATE;
    return { subtotal: gross, vat, total: gross + vat };
  }
  if (treatment === 'inclusive') {
    const subtotal = gross / (1 + VAT_RATE);
    const vat = gross - subtotal;
    return { subtotal, vat, total: gross };
  }
  // zero_rated or exempt
  return { subtotal: gross, vat: 0, total: gross };
}

export function calculateInvoiceTotals(lineItems: LineItem[], discountPct: number) {
  let subtotal = 0;
  let vatAmount = 0;

  for (const item of lineItems) {
    const calc = calculateLineItem(item.quantity, item.unitPrice, item.vatTreatment);
    subtotal += calc.subtotal;
    vatAmount += calc.vat;
  }

  const discountAmount = subtotal * (discountPct / 100);
  const discountedSubtotal = subtotal - discountAmount;
  // Discount applied proportionally to VAT too (simplification)
  const discountedVat = subtotal > 0 ? vatAmount * (discountedSubtotal / subtotal) : 0;

  return {
    subtotal: round2(discountedSubtotal),
    vatAmount: round2(discountedVat),
    total: round2(discountedSubtotal + discountedVat),
  };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function addVat(exclAmount: number) { return round2(exclAmount * (1 + VAT_RATE)); }
export function removeVat(inclAmount: number) { return round2(inclAmount / (1 + VAT_RATE)); }
export function vatPortion(inclAmount: number) { return round2(inclAmount - removeVat(inclAmount)); }
