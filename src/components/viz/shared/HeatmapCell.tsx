"use client";

import { motion } from "motion/react";
import { computeCellVisuals } from "./heatmapHelpers";

interface HeatmapCellProps {
  row: number;
  col: number;
  prob: number;
  timedOut: boolean;
  hoveredRow: number | null;
  hoveredCol: number | null;
  entered: boolean;
  totalPorts: number;
  prefersReducedMotion: boolean | null;
  nbCmbn: number;
  count: number;
  onHover: (e: React.MouseEvent, row: number, col: number, prob: number, count: number, total: number) => void;
  onLeave: () => void;
}

export function HeatmapCell({
  row,
  col,
  prob,
  timedOut,
  hoveredRow,
  hoveredCol,
  entered,
  totalPorts,
  prefersReducedMotion,
  nbCmbn,
  count,
  onHover,
  onLeave,
}: HeatmapCellProps) {
  const cell = computeCellVisuals(prob, timedOut);
  const isHovered = hoveredRow === row && hoveredCol === col;
  const hasHover = hoveredRow !== null;
  const inCrosshair = hasHover && (hoveredRow === row || hoveredCol === col);
  const dimmed = hasHover && !inCrosshair;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{
        opacity: dimmed ? 0.5 : 1,
        scale: isHovered ? 1.06 : 1,
      }}
      transition={
        entered || totalPorts > 40
          ? { duration: 0.15 }
          : { duration: 0.25, delay: (row + col) * 0.03 }
      }
      className={`relative flex items-center justify-center rounded-sm cursor-default ${
        cell.isDeterministic ? "ring-2 ring-red-500/70" : ""
      } ${isHovered ? "z-10" : ""}`}
      style={{
        backgroundColor: cell.backgroundColor,
        boxShadow: cell.boxShadow,
      }}
      onMouseEnter={(e) =>
        onHover(e, row, col, cell.isUnreliable ? -1 : prob, count, nbCmbn)
      }
      onMouseLeave={onLeave}
    >
      <span className={`text-xs font-mono tabular-nums ${cell.textClass}`}>
        {cell.label}
      </span>
    </motion.div>
  );
}
