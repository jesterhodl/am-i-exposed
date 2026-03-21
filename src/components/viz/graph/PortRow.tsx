"use client";

import { Text } from "@visx/text";
import { useTranslation } from "react-i18next";
import { SVG_COLORS } from "../shared/svgConstants";
import { formatSats } from "@/lib/format";
import { truncateId } from "@/lib/constants";
import { PORT_H, PORT_COL_W } from "./constants";
import { getScriptTypeColor } from "./scriptStyles";
import type { PortLayout } from "./types";

interface PortRowProps {
  port: PortLayout;
  side: "input" | "output";
  x: number;
  nodeWidth: number;
  hoveredPort: string | null;
  portKey: string;
  onHover: (key: string | null) => void;
  onClick: () => void;
  canExpand: boolean;
}

export function PortRow({
  port,
  side,
  x,
  nodeWidth,
  hoveredPort,
  portKey,
  onHover,
  onClick,
  canExpand,
}: PortRowProps) {
  const { t } = useTranslation();
  const portX = side === "input" ? x + 2 : x + nodeWidth - PORT_COL_W - 2;
  const portY = port.y - PORT_H / 2;
  const typeColor = getScriptTypeColor(port.scriptType);
  const isHovered = hoveredPort === portKey;
  const addr = port.address === "coinbase" ? t("graph.coinbase", { defaultValue: "coinbase" }) : truncateId(port.address, 4);
  const isUnspent = side === "output" && port.spent === false;
  const isOpReturn = port.scriptType === "op_return";

  return (
    <g
      style={{ cursor: canExpand ? "pointer" : "default" }}
      onMouseEnter={() => onHover(portKey)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        if (canExpand) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      {/* Port background */}
      <rect
        x={portX}
        y={portY}
        width={PORT_COL_W}
        height={PORT_H}
        rx={3}
        fill={isHovered ? "var(--subtle-border)" : "var(--subtle-hover)"}
        stroke={isHovered ? typeColor : "var(--subtle-border)"}
        strokeWidth={isHovered ? 1 : 0.5}
      />

      {/* Script type color strip */}
      <rect
        x={side === "input" ? portX : portX + PORT_COL_W - 3}
        y={portY}
        width={3}
        height={PORT_H}
        rx={side === "input" ? 3 : 0}
        fill={typeColor}
        fillOpacity={0.7}
      />

      {/* Address */}
      <Text
        x={portX + (side === "input" ? 8 : 6)}
        y={port.y - 6}
        fontSize={9}
        fill={isOpReturn ? SVG_COLORS.medium : SVG_COLORS.muted}
        fontFamily="monospace"
      >
        {addr}
      </Text>

      {/* Value */}
      <Text
        x={portX + (side === "input" ? 8 : 6)}
        y={port.y + 11}
        fontSize={9}
        fill={SVG_COLORS.bitcoin}
        fillOpacity={isOpReturn ? 0.4 : 0.8}
      >
        {formatSats(port.value)}
      </Text>

      {/* Unspent diamond (outputs only) */}
      {isUnspent && (
        <g transform={`translate(${portX + PORT_COL_W - 10}, ${port.y})`}>
          <polygon
            points="0,-4 4,0 0,4 -4,0"
            fill="none"
            stroke={typeColor}
            strokeWidth={1}
            strokeOpacity={0.8}
          />
        </g>
      )}

      {/* Expand indicator dot */}
      {canExpand && (
        <circle
          cx={side === "input" ? portX - 5 : portX + PORT_COL_W + 5}
          cy={port.y}
          r={4}
          fill={isHovered ? typeColor : SVG_COLORS.surfaceElevated}
          stroke={typeColor}
          strokeWidth={1}
          strokeOpacity={isHovered ? 1 : 0.5}
        />
      )}

      {/* Already-expanded indicator (small check) */}
      {port.isExpanded && (
        <circle
          cx={side === "input" ? portX - 5 : portX + PORT_COL_W + 5}
          cy={port.y}
          r={3}
          fill={typeColor}
          fillOpacity={0.4}
        />
      )}
    </g>
  );
}
