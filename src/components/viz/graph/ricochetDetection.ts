import type { LayoutNode, LayoutEdge } from "./types";

const ASHIGARU_FEE_ADDR = "bc1qsc887pxce0r3qed50e8he49a3amenemgptakg2";

/**
 * Pre-compute ricochet hop labels by walking forward from hop 0 nodes.
 *
 * Hop 0 is identified by the Ashigaru fee address output (100,000 sats).
 * Hops 1-4 follow 1-in / <=2-out children forward through the graph.
 */
export function computeRicochetHopLabels(
  layoutNodes: LayoutNode[],
  edges: LayoutEdge[],
): Map<string, string> {
  const labels = new Map<string, string>();
  const nodeMap = new Map(layoutNodes.map(n => [n.txid, n]));

  // Build forward adjacency: fromTxid -> toTxid[] (use ALL edges regardless
  // of expansion direction - ricochet detection cares about tx flow, not how
  // the graph was built. When scanning hop 1, hop 0 is a backward parent but
  // the edge still flows from hop 0 to hop 1.)
  const forwardEdges = new Map<string, string[]>();
  for (const e of edges) {
    const arr = forwardEdges.get(e.fromTxid);
    if (arr) arr.push(e.toTxid); else forwardEdges.set(e.fromTxid, [e.toTxid]);
  }

  // Find hop 0 nodes (Ashigaru fee address output)
  for (const n of layoutNodes) {
    if (n.tx.vout.some(o => o.scriptpubkey_address === ASHIGARU_FEE_ADDR && o.value === 100_000)) {
      labels.set(n.txid, "ricochet hop 0");
      // Walk forward through 1-in-1-out children
      let currentTxid = n.txid;
      for (let hop = 1; hop <= 4; hop++) {
        const children = forwardEdges.get(currentTxid);
        if (!children || children.length === 0) break;
        // Find the 1-in sweep child (ricochet hop pattern)
        const nextTxid = children.find(cid => {
          const child = nodeMap.get(cid);
          return child && child.tx.vin.length === 1 && child.tx.vout.length <= 2;
        });
        if (!nextTxid) break;
        labels.set(nextTxid, `ricochet hop ${hop}`);
        currentTxid = nextTxid;
      }
    }
  }

  return labels;
}
