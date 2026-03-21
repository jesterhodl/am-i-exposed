"use client";

import { SVG_COLORS } from "../shared/svgConstants";

interface TaintLegendProps {
  t: (key: string, opts?: Record<string, unknown>) => string;
}

/** Legend strip for the taint flow diagram: target, entity, coinjoin, tainted/clean paths. */
export function TaintLegend({ t }: TaintLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: SVG_COLORS.bitcoin, background: `${SVG_COLORS.bitcoin}22` }} />
        {t("taintFlow.targetTx", { defaultValue: "Target TX" })}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded border-2" style={{ borderColor: SVG_COLORS.high, background: `${SVG_COLORS.high}22` }} />
        {t("taintFlow.knownEntity", { defaultValue: "Known Entity" })}
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="6,0 12,6 6,12 0,6" fill={`${SVG_COLORS.good}22`} stroke={SVG_COLORS.good} strokeWidth="1.5" />
        </svg>
        CoinJoin
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-6 border-t-2" style={{ borderColor: SVG_COLORS.high }} />
        {t("taintFlow.taintedPath", { defaultValue: "Tainted path" })}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-6 border-t-2 border-dashed" style={{ borderColor: SVG_COLORS.foreground }} />
        {t("taintFlow.cleanPath", { defaultValue: "Clean path" })}
      </span>
    </div>
  );
}
