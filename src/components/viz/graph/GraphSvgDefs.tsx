"use client";

import { SVG_COLORS } from "../shared/svgConstants";

/**
 * Static SVG definitions (patterns, markers, filters, keyframe styles) shared
 * across the graph canvas. Extracted to keep the main canvas file focused on
 * layout and interaction logic.
 */
export function GraphSvgDefs() {
  return (
    <>
      <defs>
        {/* Ambient dot grid pattern */}
        <pattern id="grid-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.5" fill={SVG_COLORS.foreground} fillOpacity={0.04} />
        </pattern>
        <marker id="arrow-graph" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L12,4 L0,8" fill={SVG_COLORS.muted} fillOpacity={0.7} />
        </marker>
        <marker id="arrow-graph-start" markerWidth="12" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M0,0 L12,4 L0,8" fill={SVG_COLORS.muted} fillOpacity={0.7} />
        </marker>
        <marker id="arrow-graph-consolidation" markerWidth="12" markerHeight="8" refX="11" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L12,4 L0,8" fill={SVG_COLORS.critical} fillOpacity={0.7} />
        </marker>
        <marker id="arrow-graph-consolidation-start" markerWidth="12" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M0,0 L12,4 L0,8" fill={SVG_COLORS.critical} fillOpacity={0.7} />
        </marker>
        {/* Contextual glow auras */}
        <filter id="aura-root" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3">
            <animate attributeName="stdDeviation" values="2;4;2" dur="3s" repeatCount="indefinite" />
          </feGaussianBlur>
        </filter>
        <filter id="aura-coinjoin" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3">
            <animate attributeName="stdDeviation" values="2;3.5;2" dur="2.5s" repeatCount="indefinite" />
          </feGaussianBlur>
        </filter>
        <filter id="aura-ofac" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3">
            <animate attributeName="stdDeviation" values="1.5;4;1.5" dur="1.2s" repeatCount="indefinite" />
          </feGaussianBlur>
        </filter>
      </defs>
      <style>{`
        .graph-btn circle { transition: fill-opacity 0.15s, stroke-width 0.15s, filter 0.15s; }
        .graph-btn:hover circle { fill-opacity: 1; stroke-width: 2.5; filter: brightness(1.4); }
        @keyframes flow-particle {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes entropy-pulse {
          0%, 100% { stroke-opacity: var(--ep-min); }
          50% { stroke-opacity: var(--ep-max); }
        }
        .graph-btn:hover text { fill-opacity: 1; }
      `}</style>
    </>
  );
}
