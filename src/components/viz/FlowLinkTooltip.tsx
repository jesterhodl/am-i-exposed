"use client";

import { useEffect, useRef } from "react";
import { probColor } from "./shared/linkabilityColors";

/**
 * Refs for the imperative (non-React-state) link hover tooltip.
 * Using direct DOM manipulation avoids React re-renders that
 * destabilize scroll containers during mousemove on SVG links.
 */
export interface LinkTooltipRefs {
  overlayGlowRef: React.RefObject<SVGPathElement | null>;
  overlayPathRef: React.RefObject<SVGPathElement | null>;
  linkTooltipRef: React.RefObject<HTMLDivElement | null>;
  ttDotRef: React.RefObject<HTMLSpanElement | null>;
  ttProbRef: React.RefObject<HTMLSpanElement | null>;
  ttRouteRef: React.RefObject<HTMLParagraphElement | null>;
}

/** Create and manage the imperative link tooltip DOM element. */
export function useLinkTooltip(): LinkTooltipRefs {
  const overlayGlowRef = useRef<SVGPathElement>(null);
  const overlayPathRef = useRef<SVGPathElement>(null);
  const linkTooltipRef = useRef<HTMLDivElement>(null);
  const ttDotRef = useRef<HTMLSpanElement>(null);
  const ttProbRef = useRef<HTMLSpanElement>(null);
  const ttRouteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const div = document.createElement("div");
    Object.assign(div.style, {
      position: "fixed", display: "none", pointerEvents: "none", zIndex: "9999",
      backgroundColor: "var(--overlay-bg)", border: "1px solid var(--overlay-border)",
      borderRadius: "8px", padding: "8px 12px", fontSize: "13px",
      color: "var(--foreground)", boxShadow: "var(--overlay-shadow)",
      backdropFilter: "blur(16px)", whiteSpace: "nowrap", transform: "translate(-50%, -100%)",
    });
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:6px";
    const dot = document.createElement("span");
    Object.assign(dot.style, { width: "8px", height: "8px", borderRadius: "50%", display: "inline-block", flexShrink: "0" });
    const prob = document.createElement("span");
    Object.assign(prob.style, { fontSize: "12px", fontWeight: "500", color: "var(--foreground)" });
    const route = document.createElement("p");
    Object.assign(route.style, { fontSize: "12px", marginTop: "2px", color: "var(--muted)" });
    row.appendChild(dot);
    row.appendChild(prob);
    div.appendChild(row);
    div.appendChild(route);
    document.body.appendChild(div);
    linkTooltipRef.current = div;
    ttDotRef.current = dot;
    ttProbRef.current = prob;
    ttRouteRef.current = route;
    return () => { document.body.removeChild(div); };
  }, []);

  return { overlayGlowRef, overlayPathRef, linkTooltipRef, ttDotRef, ttProbRef, ttRouteRef };
}

/** Show the imperative link tooltip at the cursor position. */
export function showLinkTooltip(
  refs: LinkTooltipRefs,
  e: React.MouseEvent,
  pathD: string,
  fillUrl: string,
  linkProb: number,
  linkFromLabel: string,
  linkToLabel: string,
): void {
  if (refs.overlayGlowRef.current) {
    refs.overlayGlowRef.current.setAttribute("d", pathD);
    refs.overlayGlowRef.current.setAttribute("fill", fillUrl);
    refs.overlayGlowRef.current.removeAttribute("display");
  }
  if (refs.overlayPathRef.current) {
    refs.overlayPathRef.current.setAttribute("d", pathD);
    refs.overlayPathRef.current.setAttribute("fill", fillUrl);
    refs.overlayPathRef.current.removeAttribute("display");
  }
  if (refs.linkTooltipRef.current) {
    refs.linkTooltipRef.current.style.display = "block";
    refs.linkTooltipRef.current.style.left = `${e.clientX}px`;
    refs.linkTooltipRef.current.style.top = `${e.clientY - 16}px`;
  }
  if (refs.ttDotRef.current) refs.ttDotRef.current.style.backgroundColor = probColor(linkProb);
  if (refs.ttProbRef.current) refs.ttProbRef.current.textContent = `${Math.round(linkProb * 100)}% linkability`;
  if (refs.ttRouteRef.current) refs.ttRouteRef.current.textContent = `${linkFromLabel} \u2192 ${linkToLabel}`;
}

/** Hide the imperative link tooltip and overlay paths. */
export function hideLinkTooltip(refs: LinkTooltipRefs): void {
  if (refs.overlayGlowRef.current) refs.overlayGlowRef.current.setAttribute("display", "none");
  if (refs.overlayPathRef.current) refs.overlayPathRef.current.setAttribute("display", "none");
  if (refs.linkTooltipRef.current) refs.linkTooltipRef.current.style.display = "none";
}
