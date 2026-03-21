import { useCallback } from "react";
import type { LayoutEdge, TooltipData } from "./types";
import type { EntropyEdgeEntry } from "./edge-utils";
import type { useChartTooltip } from "../shared/ChartTooltip";

interface UseEdgeTooltipParams {
  tooltip: ReturnType<typeof useChartTooltip<TooltipData>>;
  toScreen: (gx: number, gy: number) => { x: number; y: number };
  setHoveredEdgeKey: (key: string | null) => void;
}

interface EdgeTooltipContext {
  edge: LayoutEdge;
  edgeKey: string;
  edgeMaxProb: number | undefined;
  entropyEntry: EntropyEdgeEntry | undefined;
}

/**
 * Encapsulates the tooltip interaction logic for graph edges:
 * mouse-move show and mouse-leave hide for edge hover tooltips.
 */
export function useEdgeTooltip({ tooltip, toScreen, setHoveredEdgeKey }: UseEdgeTooltipParams) {
  const showEdgeTooltip = useCallback(
    (ctx: EdgeTooltipContext) => {
      const { edge, edgeKey, edgeMaxProb, entropyEntry } = ctx;
      setHoveredEdgeKey(edgeKey);
      const eMidX = (edge.x1 + edge.x2) / 2;
      const eMidY = (edge.y1 + edge.y2) / 2;
      const pos = toScreen(eMidX, eMidY - 12);
      tooltip.showTooltip({
        tooltipData: {
          txid: edge.fromTxid,
          inputCount: 0, outputCount: 0, totalValue: 0,
          isCoinJoin: false, depth: 0, fee: 0, feeRate: "",
          confirmed: true,
          linkProb: edgeMaxProb,
          entropyNormalized: entropyEntry?.normalized,
          entropyBits: entropyEntry?.effectiveEntropy,
        },
        tooltipLeft: pos.x,
        tooltipTop: pos.y,
      });
    },
    [tooltip, toScreen, setHoveredEdgeKey],
  );

  const hideEdgeTooltip = useCallback(() => {
    setHoveredEdgeKey(null);
    tooltip.hideTooltip();
  }, [setHoveredEdgeKey, tooltip]);

  return { showEdgeTooltip, hideEdgeTooltip };
}
