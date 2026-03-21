import {
  deriveOneAddress,
  type ParsedXpub,
} from "@/lib/bitcoin/descriptor";
import type { MempoolTransaction, MempoolUtxo } from "@/lib/api/types";
import type { WalletAddressInfo } from "@/lib/analysis/wallet-audit";
import type { DerivedAddress } from "@/lib/bitcoin/descriptor";
import type { MempoolClient } from "@/lib/api/mempool";

/** Default gap limit if settings unavailable. */
export const DEFAULT_GAP_LIMIT = 5;

/** Max UTXO txids to trace (prevents explosion on large wallets). */
export const MAX_UTXO_TRACES = 50;

/** Trace depth for UTXO provenance. */
export const UTXO_TRACE_DEPTH = 3;

/** Fetch all 3 endpoints for a single address. */
async function fetchAddress(
  api: MempoolClient,
  derived: DerivedAddress,
): Promise<WalletAddressInfo> {
  const [addressData, utxos, txs] = await Promise.all([
    api.getAddress(derived.address).catch(() => null),
    api.getAddressUtxos(derived.address).catch(() => [] as MempoolUtxo[]),
    api.getAddressTxs(derived.address).catch(() => [] as MempoolTransaction[]),
  ]);
  return { derived, addressData, utxos, txs };
}

/** Returns true if address has any on-chain activity. */
function isUsed(info: WalletAddressInfo): boolean {
  if (info.txs.length > 0) return true;
  if (info.addressData && typeof info.addressData === "object") {
    const stats = info.addressData.chain_stats;
    if (stats && (stats.tx_count > 0 || stats.funded_txo_count > 0)) return true;
  }
  return false;
}

/** Delay that can be cancelled via AbortSignal. */
function abortableDelay(ms: number, abortSignal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
    const timer = setTimeout(() => { abortSignal.removeEventListener("abort", onAbort); resolve(); }, ms);
    abortSignal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Scan one chain (receive=0 or change=1) incrementally.
 * Derives + fetches one address at a time, stops after gapLimit
 * consecutive unused addresses.
 */
export async function scanChain(
  parsed: ParsedXpub,
  chain: 0 | 1,
  api: MempoolClient,
  signal: AbortSignal,
  isLocal: boolean,
  gapLimit: number,
  onProgress: (info: WalletAddressInfo) => void,
): Promise<WalletAddressInfo[]> {
  const results: WalletAddressInfo[] = [];
  let consecutiveUnused = 0;
  let index = 0;
  /** Addresses in the initial token bucket (20 tokens / 3 per addr). */
  const BURST_SIZE = 6;
  /** Delay between addresses after burst for hosted APIs. */
  const SUSTAIN_DELAY_MS = 9000;
  /** Small gap between burst addresses. */
  const BURST_GAP_MS = 300;
  /** Track how many addresses have been fetched across this chain for burst logic. */
  let fetchCount = 0;

  while (consecutiveUnused < gapLimit) {
    if (signal.aborted) return results;

    const derived = deriveOneAddress(parsed, chain, index);
    const t0 = performance.now();
    const info = await fetchAddress(api, derived)
      .catch((): WalletAddressInfo => ({
        derived,
        addressData: null,
        txs: [],
        utxos: [],
      }));
    const wasCacheHit = performance.now() - t0 < 100;

    results.push(info);
    onProgress(info);
    if (!wasCacheHit) fetchCount++;

    if (isUsed(info)) {
      consecutiveUnused = 0;
    } else {
      consecutiveUnused++;
    }

    index++;

    // Rate limit for hosted APIs - skip delay on cache hits (IDB reads < 10ms)
    if (!isLocal && !wasCacheHit && consecutiveUnused < gapLimit) {
      const delayMs = fetchCount <= BURST_SIZE ? BURST_GAP_MS : SUSTAIN_DELAY_MS;
      await abortableDelay(delayMs, signal).catch((e) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.warn("delay failed:", e);
        }
      });
    }
  }

  return results;
}

/**
 * Collect unique transactions that have outputs belonging to the wallet.
 * Includes both spent and unspent outputs. Sorted by wallet output value descending.
 */
export function collectWalletTxs(
  allInfos: WalletAddressInfo[],
): Map<string, MempoolTransaction> {
  // Build set of all wallet addresses for output matching
  const walletAddresses = new Set<string>();
  for (const info of allInfos) {
    walletAddresses.add(info.derived.address);
  }

  const txMap = new Map<string, MempoolTransaction>();
  const valueMap = new Map<string, number>();

  for (const info of allInfos) {
    for (const tx of info.txs) {
      if (txMap.has(tx.txid)) continue;
      // Sum outputs belonging to the wallet
      let walletValue = 0;
      for (const vout of tx.vout) {
        if (vout.scriptpubkey_address && walletAddresses.has(vout.scriptpubkey_address)) {
          walletValue += vout.value;
        }
      }
      if (walletValue === 0) continue; // Skip txs where wallet has no outputs
      txMap.set(tx.txid, tx);
      valueMap.set(tx.txid, walletValue);
    }
  }

  // Sort by wallet output value descending and cap
  const sorted = [...txMap.entries()]
    .sort((a, b) => (valueMap.get(b[0]) ?? 0) - (valueMap.get(a[0]) ?? 0))
    .slice(0, MAX_UTXO_TRACES);

  return new Map(sorted);
}
