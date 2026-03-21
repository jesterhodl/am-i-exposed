"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { Group } from "@visx/group";
import { Text } from "@visx/text";
import { ParentSize } from "@visx/responsive";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { SVG_COLORS } from "./shared/svgConstants";
import { ChartDefs } from "./shared/ChartDefs";
import { ChartTooltip, useChartTooltip } from "./shared/ChartTooltip";
import { buildTaintGraph } from "./taint/taint-graph-builder";
import { TaintNodeShape } from "./taint/TaintNodeShape";
import { TaintTooltipContent } from "./taint/TaintTooltipContent";
import type { TaintTooltipData } from "./taint/TaintTooltipContent";
import { TaintLegend } from "./taint/TaintLegend";
import type { TaintNode } from "./taint/taint-graph-builder";
import type { Finding } from "@/lib/types";
import type { TraceLayer } from "@/lib/analysis/chain/recursive-trace";

/**
 * Bithypha-style taint path visualization.
 *
 * Shows how taint flows through the transaction graph across multiple hops.
 * Each column represents a hop depth, nodes are transactions,
 * and edges show value flow with taint coloring.
 */

interface TaintPathDiagramProps {
  findings: Finding[];
  backwardLayers?: TraceLayer[] | null;
  forwardLayers?: TraceLayer[] | null;
  onTxClick?: (txid: string) => void;
}

const NODE_RADIUS = 16;
const COL_WIDTH = 140;
const ROW_HEIGHT = 60;
const MARGIN = { top: 40, right: 30, bottom: 20, left: 30 };

const TYPE_COLORS: Record<string, string> = {
  root: SVG_COLORS.bitcoin,
  entity: SVG_COLORS.high,
  coinjoin: SVG_COLORS.good,
  regular: SVG_COLORS.muted,
};

const TYPE_SHAPES: Record<string, string> = {
  root: "circle",
  entity: "square",
  coinjoin: "diamond",
  regular: "circle",
};

// ── SVG Rendering ───────────────────────────────────────────────────────

function TaintPath({
  width,
  findings,
  backwardLayers,
  forwardLayers,
  onTxClick,
  t,
  tooltip,
  containerRef,
}: {
  width: number;
  findings: Finding[];
  backwardLayers?: TraceLayer[] | null;
  forwardLayers?: TraceLayer[] | null;
  onTxClick?: (txid: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  tooltip: ReturnType<typeof useChartTooltip<TaintTooltipData>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { nodes, edges } = useMemo(
    () => buildTaintGraph(findings, backwardLayers, forwardLayers),
    [findings, backwardLayers, forwardLayers],
  );

  const depths = nodes.map((n) => n.depth);
  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);
  const cols = maxDepth - minDepth + 1;

  const requiredWidth = cols * COL_WIDTH + MARGIN.left + MARGIN.right;
  const svgWidth = Math.max(width, requiredWidth);
  const innerWidth = svgWidth - MARGIN.left - MARGIN.right;
  const maxRows = Math.max(...[...new Set(depths)].map((d) => nodes.filter((n) => n.depth === d).length));
  const innerHeight = Math.max(maxRows * ROW_HEIGHT, 100);
  const svgHeight = innerHeight + MARGIN.top + MARGIN.bottom;

  const getX = useCallback((depth: number) => {
    const offset = depth - minDepth;
    return MARGIN.left + (offset + 0.5) * (innerWidth / cols);
  }, [minDepth, cols, innerWidth]);

  const getY = useCallback((depth: number, y: number) => {
    const group = nodes.filter((n) => n.depth === depth);
    const groupHeight = group.length * ROW_HEIGHT;
    const startY = MARGIN.top + (innerHeight - groupHeight) / 2;
    return startY + (y + 0.5) * ROW_HEIGHT;
  }, [nodes, innerHeight]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, TaintNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  if (nodes.length <= 1) return null;

  return (
    <div className="relative" style={{ position: "relative", minWidth: svgWidth }}>
      <svg width={svgWidth} height={svgHeight} className="overflow-visible">
        <ChartDefs />
        <defs>
          <linearGradient id="grad-taint-high">
            <stop offset="0%" stopColor={SVG_COLORS.critical} stopOpacity={0.8} />
            <stop offset="100%" stopColor={SVG_COLORS.high} stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="grad-taint-low">
            <stop offset="0%" stopColor={SVG_COLORS.muted} stopOpacity={0.3} />
            <stop offset="100%" stopColor={SVG_COLORS.muted} stopOpacity={0.1} />
          </linearGradient>
          <marker id="arrow-taint" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill={SVG_COLORS.high} fillOpacity={0.6} />
          </marker>
          <marker id="arrow-clean" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill={SVG_COLORS.foreground} fillOpacity={0.6} />
          </marker>
        </defs>

        <Group>
          {/* Column labels */}
          {[...new Set(depths)].sort((a, b) => a - b).map((d) => (
            <Text
              key={`col-${d}`}
              x={getX(d)}
              y={MARGIN.top - 16}
              fontSize={11}
              fill={d === 0 ? SVG_COLORS.bitcoin : SVG_COLORS.muted}
              textAnchor="middle"
              fontWeight={d === 0 ? 600 : 400}
            >
              {d === 0 ? t("taintFlow.target", { defaultValue: "Target" }) : d < 0 ? `Hop ${d}` : `Hop +${d}`}
            </Text>
          ))}

          {/* Edges */}
          {edges.map((edge, i) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const x1 = getX(src.depth);
            const y1 = getY(src.depth, src.y);
            const x2 = getX(tgt.depth);
            const y2 = getY(tgt.depth, tgt.y);
            const isTainted = edge.taintPct > 50;
            const midX = (x1 + x2) / 2;

            return (
              <motion.path
                key={`edge-${i}`}
                d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
                fill="none"
                stroke={isTainted ? SVG_COLORS.high : SVG_COLORS.foreground}
                strokeWidth={isTainted ? 2.5 : 1.5}
                strokeOpacity={isTainted ? 0.7 : 0.6}
                strokeDasharray={isTainted ? undefined : "4,4"}
                markerEnd={isTainted ? "url(#arrow-taint)" : "url(#arrow-clean)"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const cx = getX(node.depth);
            const cy = getY(node.depth, node.y);
            const color = TYPE_COLORS[node.type] ?? SVG_COLORS.muted;
            const shape = TYPE_SHAPES[node.type] ?? "circle";

            return (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                style={{ cursor: node.clickTarget && onTxClick ? "pointer" : "default" }}
                onClick={() => { if (node.clickTarget && onTxClick) onTxClick(node.clickTarget); }}
                onMouseEnter={(e: React.MouseEvent) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  tooltip.showTooltip({
                    tooltipData: {
                      label: node.label, type: node.type, taintPct: node.taintPct,
                      entityName: node.entityName, category: node.category,
                      hops: Math.abs(node.depth), clickTarget: node.clickTarget,
                    },
                    tooltipLeft: e.clientX - rect.left,
                    tooltipTop: e.clientY - rect.top - 8,
                  });
                }}
                onMouseLeave={tooltip.hideTooltip}
              >
                <TaintNodeShape cx={cx} cy={cy} color={color} shape={shape} taintPct={node.taintPct} />

                {/* Node label */}
                <Text x={cx} y={cy + NODE_RADIUS + 14} fontSize={10} fill={SVG_COLORS.muted} textAnchor="middle" width={COL_WIDTH - 20}>
                  {(() => {
                    const label = node.label === "Analyzed TX"
                      ? t("taintFlow.analyzedTx", { defaultValue: "Analyzed TX" })
                      : node.label;
                    return label.length > 16 ? label.slice(0, 14) + "..." : label;
                  })()}
                </Text>

                {/* Category badge for entities */}
                {node.category && (
                  <Text x={cx} y={cy + NODE_RADIUS + 26} fontSize={9} fill={SVG_COLORS.high} textAnchor="middle" fontStyle="italic">
                    {node.category}
                  </Text>
                )}
              </motion.g>
            );
          })}
        </Group>
      </svg>
    </div>
  );
}

export function TaintPathDiagram({ findings, backwardLayers, forwardLayers, onTxClick }: TaintPathDiagramProps) {
  const { t } = useTranslation();
  useTheme();
  const tooltip = useChartTooltip<TaintTooltipData>();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasChainData = (backwardLayers && backwardLayers.length > 0)
    || (forwardLayers && forwardLayers.length > 0)
    || findings.some((f) =>
      f.id === "chain-taint-backward" ||
      f.id === "chain-entity-proximity-backward" ||
      f.id === "chain-entity-proximity-forward" ||
      f.id === "chain-coinjoin-ancestry" ||
      f.id === "chain-coinjoin-descendancy" ||
      f.id === "chain-trace-summary"
    );

  const backwardHops = backwardLayers?.length ?? 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || backwardHops === 0) return;
    const timer = setTimeout(() => {
      const cols = backwardHops + 1 + (forwardLayers?.length ?? 0);
      const targetColFraction = (backwardHops + 0.5) / cols;
      const targetX = targetColFraction * el.scrollWidth;
      const center = targetX - el.clientWidth / 2;
      el.scrollLeft = Math.max(0, center);
    }, 200);
    return () => clearTimeout(timer);
  }, [backwardHops, forwardLayers?.length]);

  if (!hasChainData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-xl border border-card-border bg-surface-inset p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/70">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M1 8h14M4 4l-3 4 3 4M12 4l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("taintFlow.title", { defaultValue: "Taint Flow" })}
      </div>

      <TaintLegend t={t} />

      <div className="relative" ref={containerRef}>
        <div ref={scrollRef} className="overflow-x-auto -mx-4 px-4">
          <ParentSize debounceTime={100}>
            {({ width }) => width > 0 ? (
              <TaintPath
                width={Math.max(width, 400)}
                findings={findings}
                backwardLayers={backwardLayers}
                forwardLayers={forwardLayers}
                onTxClick={onTxClick}
                t={t}
                tooltip={tooltip}
                containerRef={containerRef}
              />
            ) : null}
          </ParentSize>
        </div>

        {tooltip.tooltipOpen && tooltip.tooltipData && (
          <ChartTooltip top={tooltip.tooltipTop} left={tooltip.tooltipLeft} containerRef={containerRef}>
            <TaintTooltipContent data={tooltip.tooltipData} t={t} />
          </ChartTooltip>
        )}
      </div>
    </motion.div>
  );
}
