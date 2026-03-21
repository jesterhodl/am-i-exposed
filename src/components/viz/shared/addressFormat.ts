/**
 * Address truncation helpers for visualization components.
 * Used by LinkabilityHeatmap (row/column labels) and potentially other
 * visualizations that need compact address display.
 */

/** Truncate address for row labels (prefix + suffix with ellipsis). */
export function truncAddr(addr: string | undefined, n = 5): string {
  if (!addr) return "?";
  if (addr.length <= n * 2 + 2) return addr;
  return `${addr.slice(0, n)}\u2026${addr.slice(-n)}`;
}

/** Truncate address for column headers (suffix only - the bc1q prefix is shared). */
export function truncAddrSuffix(addr: string | undefined, n = 5): string {
  if (!addr) return "?";
  if (addr.length <= n + 2) return addr;
  return `\u2026${addr.slice(-n)}`;
}
