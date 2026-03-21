/**
 * Hook that auto-detects change outputs for all graph nodes using
 * the change detection heuristic. Merges results into reducer state
 * without overwriting user-toggled outputs.
 */

import { useRef, useEffect } from "react";
import { analyzeChangeDetection } from "@/lib/analysis/heuristics/change-detection";
import type { GraphNode } from "@/hooks/useGraphExpansion";

interface UseChangeOutputDetectionOptions {
  nodes: Map<string, GraphNode>;
  dispatch: (action: { type: "MERGE_CHANGE_OUTPUTS"; keys: Set<string>; userToggled: Set<string> }) => void;
  userToggledRef: React.RefObject<Set<string>>;
}

export function useChangeOutputDetection({ nodes, dispatch, userToggledRef }: UseChangeOutputDetectionOptions) {
  const analyzedChangeTxidsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newKeys = new Set<string>();
    let hasNew = false;
    for (const [txid, node] of nodes) {
      if (analyzedChangeTxidsRef.current.has(txid)) continue;
      analyzedChangeTxidsRef.current.add(txid);
      hasNew = true;
      const result = analyzeChangeDetection(node.tx);
      for (const finding of result.findings) {
        if (finding.id === "h2-change-detected" && finding.params) {
          const ci = finding.params.changeIndex;
          if (typeof ci === "number") newKeys.add(`${txid}:${ci}`);
        }
        if ((finding.id === "h2-same-address-io" || finding.id === "h2-self-send") && finding.params) {
          const indicesStr = finding.params.selfSendIndices;
          if (typeof indicesStr === "string" && indicesStr.length > 0) {
            for (const idxStr of indicesStr.split(",")) {
              const n = parseInt(idxStr, 10);
              if (!isNaN(n)) newKeys.add(`${txid}:${n}`);
            }
          }
        }
      }
    }
    for (const txid of analyzedChangeTxidsRef.current) {
      if (!nodes.has(txid)) analyzedChangeTxidsRef.current.delete(txid);
    }
    if (!hasNew) return;
    dispatch({ type: "MERGE_CHANGE_OUTPUTS", keys: newKeys, userToggled: userToggledRef.current });
  }, [nodes, dispatch, userToggledRef]);
}
