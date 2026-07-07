/**
 * Format currency as Ethiopian Birr (ETB)
 * Always displays with no decimal places per design spec
 */
export function formatBirr(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(amount)
}
