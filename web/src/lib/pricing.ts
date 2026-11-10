import { differenceInCalendarDays, parseISO } from 'date-fns'
export const SERVICE_FEE_RATE = 0.1
export function nightsBetween(a: string, b: string) { if (!a || !b) return 0; return Math.max(0, differenceInCalendarDays(parseISO(b), parseISO(a))) }
export function priceBreakdown(price: number, nights: number) {
  const subtotal = price * nights; const fee = Math.round(subtotal * SERVICE_FEE_RATE)
  return { subtotal, fee, total: subtotal + fee }
}
export const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
