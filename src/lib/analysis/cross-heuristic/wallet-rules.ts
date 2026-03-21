import type { Finding } from "@/lib/types";

/**
 * Detect contradictions between wallet fingerprint signals and observed
 * behavior. For example, Wasabi is designed to prevent address reuse, so
 * seeing both signals together is a paradox worth flagging.
 */
export function applyWalletContradictionRules(findings: Finding[]): void {
  const hasWasabiFingerprint = findings.some(
    (f) =>
      f.id === "h11-wallet-fingerprint" &&
      typeof f.params?.walletGuess === "string" &&
      f.params.walletGuess.toLowerCase().includes("wasabi"),
  );
  const hasAddressReuse = findings.some(
    (f) => f.id === "h8-address-reuse" && f.scoreImpact < 0,
  );

  if (hasWasabiFingerprint && hasAddressReuse) {
    findings.push({
      id: "cross-wasabi-reuse-paradox",
      severity: "high",
      confidence: "high",
      title: "Wasabi wallet fingerprint detected with address reuse",
      description:
        "This transaction shows a Wasabi Wallet fingerprint (nVersion=1, nLockTime=0) " +
        "but the address has been reused. Wasabi is designed to prevent address reuse, " +
        "making this a contradiction. Either the fingerprint is coincidental (false positive) " +
        "or recommended Wasabi practices are not being followed, severely undermining " +
        "any privacy benefit from CoinJoin mixing.",
      recommendation:
        "If using Wasabi, enable automatic address generation and never manually reuse addresses. " +
        "Address reuse undoes the unlinkability that CoinJoin provides.",
      scoreImpact: 0,
      params: { context: "wasabi-reuse-paradox" },
    });
  }
}
