"use client";

import { SVG_COLORS } from "../shared/svgConstants";

const NODE_RADIUS = 16;

interface TaintNodeShapeProps {
  cx: number;
  cy: number;
  color: string;
  shape: string;
  taintPct: number;
}

/** Renders taint ring + shape (circle / square / diamond) for a taint graph node. */
export function TaintNodeShape({ cx, cy, color, shape, taintPct }: TaintNodeShapeProps) {
  const circumference = 2 * Math.PI * (NODE_RADIUS + 4);
  return (
    <>
      {/* Taint ring */}
      {taintPct > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={NODE_RADIUS + 4}
          fill="none"
          stroke={SVG_COLORS.critical}
          strokeWidth={2}
          strokeOpacity={taintPct / 200}
          strokeDasharray={`${(taintPct / 100) * circumference} ${circumference}`}
        />
      )}

      {/* Node shape */}
      {shape === "circle" && (
        <circle cx={cx} cy={cy} r={NODE_RADIUS} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} />
      )}
      {shape === "square" && (
        <rect
          x={cx - NODE_RADIUS}
          y={cy - NODE_RADIUS}
          width={NODE_RADIUS * 2}
          height={NODE_RADIUS * 2}
          rx={4}
          fill={color}
          fillOpacity={0.15}
          stroke={color}
          strokeWidth={2}
        />
      )}
      {shape === "diamond" && (
        <polygon
          points={`${cx},${cy - NODE_RADIUS} ${cx + NODE_RADIUS},${cy} ${cx},${cy + NODE_RADIUS} ${cx - NODE_RADIUS},${cy}`}
          fill={color}
          fillOpacity={0.15}
          stroke={color}
          strokeWidth={2}
        />
      )}
    </>
  );
}
