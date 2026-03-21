"use client";

import { SVG_COLORS } from "../shared/svgConstants";

const TYPE_COLORS: Record<string, string> = {
  root: SVG_COLORS.bitcoin,
  entity: SVG_COLORS.high,
  coinjoin: SVG_COLORS.good,
  regular: SVG_COLORS.muted,
};

const TYPE_LABELS: Record<string, string> = {
  root: "Target transaction",
  entity: "Known entity",
  coinjoin: "CoinJoin transaction",
  regular: "Transaction",
};

export interface TaintTooltipData {
  label: string;
  type: string;
  taintPct: number;
  entityName?: string;
  category?: string;
  hops?: number;
  clickTarget?: string;
}

interface TaintTooltipContentProps {
  data: TaintTooltipData;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

/** Tooltip body for taint path nodes. */
export function TaintTooltipContent({ data, t }: TaintTooltipContentProps) {
  return (
    <div className="space-y-1">
      <div className="font-medium">{data.label}</div>
      <div className="text-xs" style={{ color: TYPE_COLORS[data.type] ?? SVG_COLORS.muted }}>
        {TYPE_LABELS[data.type] ?? data.type}
      </div>
      {data.entityName && (
        <div className="text-xs" style={{ color: SVG_COLORS.high }}>
          {data.entityName} ({data.category})
        </div>
      )}
      {data.hops !== undefined && data.hops > 0 && (
        <div className="text-xs" style={{ color: SVG_COLORS.muted }}>
          {t("taintFlow.hopsFromTarget", { count: data.hops, defaultValue: "{{count}} hop from target" })}
        </div>
      )}
      {data.taintPct > 0 && (
        <div className="text-xs" style={{ color: SVG_COLORS.critical }}>
          {t("taintFlow.taintPct", { pct: data.taintPct, defaultValue: "Taint: {{pct}}%" })}
        </div>
      )}
      {data.clickTarget && (
        <div className="text-xs" style={{ color: SVG_COLORS.bitcoin }}>
          {t("taintFlow.clickToAnalyze", { defaultValue: "Click to analyze" })}
        </div>
      )}
    </div>
  );
}
