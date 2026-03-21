import type { Finding } from "@/lib/types";

/** Suppress a finding by setting it to low severity with zero score impact. */
export function suppressFinding(f: Finding, context: string): void {
  f.severity = "low";
  f.params = { ...f.params, context };
  f.scoreImpact = 0;
}
