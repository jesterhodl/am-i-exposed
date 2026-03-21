"use client";

import { Group } from "@visx/group";
import { Text } from "@visx/text";
import { motion } from "motion/react";
import { SVG_COLORS, ANIMATION_DEFAULTS, WATERFALL_GRADIENT_IDS } from "../shared/svgConstants";
import type { WaterfallSegment } from "./buildWaterfallSegments";
import type { Grade } from "@/lib/types";

/** Map grade to severity key for gradient lookup. */
const GRADE_TO_SEV: Record<Grade, string> = {
  "A+": "good",
  B: "low",
  C: "medium",
  D: "high",
  F: "critical",
};

/** Resolve bar fill for a waterfall segment. */
function getBarStyle(seg: WaterfallSegment, grade: Grade): { fill: string; fillOpacity?: number } {
  if (seg.key === "base") {
    return { fill: `url(#${WATERFALL_GRADIENT_IDS.base})`, fillOpacity: 0.6 };
  }
  if (seg.key === "final") {
    const sevKey = GRADE_TO_SEV[grade];
    return { fill: `url(#${WATERFALL_GRADIENT_IDS[sevKey] ?? WATERFALL_GRADIENT_IDS.good})` };
  }
  if (seg.value > 0) {
    return { fill: `url(#${WATERFALL_GRADIENT_IDS.positive})` };
  }
  const sevId = WATERFALL_GRADIENT_IDS[seg.severity ?? "high"] ?? WATERFALL_GRADIENT_IDS.high;
  return { fill: `url(#${sevId})` };
}

interface ImpactLabelProps {
  seg: WaterfallSegment;
  barX: number;
  barWidth: number;
  barY: number;
  barHeight: number;
  innerHeight: number;
}

/** Adaptive impact label - positions above, inside, or below the bar depending on space. */
function ImpactLabel({ seg, barX, barWidth, barY, barHeight, innerHeight }: ImpactLabelProps) {
  if (seg.key === "base" || seg.key === "final" || barWidth < 20) return null;

  const spaceBelow = innerHeight - (barY + barHeight);
  let labelY: number;
  let labelColor: string;
  if (seg.value > 0) {
    labelY = barY - 6;
    labelColor = seg.color;
  } else if (barHeight >= 24) {
    labelY = barY + barHeight / 2 + 4;
    labelColor = SVG_COLORS.foreground;
  } else if (spaceBelow >= 32) {
    labelY = barY + barHeight + 14;
    labelColor = seg.color;
  } else {
    labelY = barY - 6;
    labelColor = seg.color;
  }

  return (
    <Text
      x={barX + barWidth / 2}
      y={labelY}
      textAnchor="middle"
      fontSize={12}
      fontWeight="600"
      fontFamily="var(--font-geist-mono), monospace"
      fill={labelColor}
    >
      {seg.value > 0 ? `+${seg.value}` : seg.value}
    </Text>
  );
}

export interface WaterfallBarProps {
  seg: WaterfallSegment;
  index: number;
  grade: Grade;
  barX: number;
  barWidth: number;
  barY: number;
  barHeight: number;
  innerHeight: number;
  baseScore: number;
  finalScore: number;
  reducedMotion: boolean | null;
  onFindingClick?: (findingId: string) => void;
  onMouseEnter: (e: React.MouseEvent, seg: WaterfallSegment) => void;
  onMouseLeave: () => void;
}

/** A single waterfall bar with impact label and value label. */
export function WaterfallBar({
  seg,
  index,
  grade,
  barX,
  barWidth,
  barY,
  barHeight,
  innerHeight,
  baseScore,
  finalScore,
  reducedMotion,
  onFindingClick,
  onMouseEnter,
  onMouseLeave,
}: WaterfallBarProps) {
  const isClickable = !!seg.findingId;
  const barStyle = getBarStyle(seg, grade);

  return (
    <Group>
      <motion.rect
        x={barX}
        y={barY}
        width={barWidth}
        height={barHeight}
        fill={barStyle.fill}
        fillOpacity={barStyle.fillOpacity}
        rx={3}
        initial={reducedMotion ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{
          delay: index * ANIMATION_DEFAULTS.stagger,
          duration: ANIMATION_DEFAULTS.duration,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
        cursor={isClickable ? "pointer" : "default"}
        tabIndex={isClickable ? 0 : undefined}
        role={isClickable ? "button" : undefined}
        aria-label={isClickable ? `${seg.label}: ${seg.value > 0 ? "+" : ""}${seg.value}` : undefined}
        onClick={() => {
          if (seg.findingId && onFindingClick) onFindingClick(seg.findingId);
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if ((e.key === "Enter" || e.key === " ") && seg.findingId && onFindingClick) {
            e.preventDefault();
            onFindingClick(seg.findingId);
          }
        }}
        onMouseEnter={(e: React.MouseEvent) => onMouseEnter(e, seg)}
        onMouseLeave={onMouseLeave}
        className={isClickable ? "outline-none focus-visible:outline-2 focus-visible:outline-bitcoin" : ""}
      />

      <ImpactLabel
        seg={seg}
        barX={barX}
        barWidth={barWidth}
        barY={barY}
        barHeight={barHeight}
        innerHeight={innerHeight}
      />

      {/* Base and Final value labels */}
      {(seg.key === "base" || seg.key === "final") && (
        <Text
          x={barX + barWidth / 2}
          y={barY - 6}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fontFamily="var(--font-geist-mono), monospace"
          fill={seg.key === "final" ? seg.color : SVG_COLORS.foreground}
        >
          {seg.key === "base" ? baseScore : finalScore}
        </Text>
      )}
    </Group>
  );
}
