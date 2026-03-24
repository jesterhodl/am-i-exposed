"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { GraphAnnotation } from "@/lib/graph/saved-graph-types";
import type { ViewTransform } from "./types";

const DRAG_THRESHOLD = 5;
const DEFAULT_NOTE_W = 180;
const DEFAULT_NOTE_H = 100;

interface DrawState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isCircle: boolean;
}

interface AnnotationEditState {
  editingId: string | null;
  editTitle: string;
  editBody: string;
  selectedId: string | null;
}

export interface AnnotationInteraction extends AnnotationEditState {
  drawState: DrawState | null;
  setEditTitle: (v: string) => void;
  setEditBody: (v: string) => void;
  flushEdit: () => void;
  handleCanvasMouseDown: (e: React.MouseEvent<SVGGElement>) => void;
  handleCanvasMouseMove: (e: React.MouseEvent<SVGGElement>) => void;
  handleCanvasMouseUp: () => void;
  handleAnnotationMouseDown: (e: React.MouseEvent, a: GraphAnnotation) => void;
  handleResizeMouseDown: (e: React.MouseEvent, a: GraphAnnotation) => void;
  handleAnnotationDoubleClick: (e: React.MouseEvent, a: GraphAnnotation) => void;
  setSelectedId: (id: string | null) => void;
}

/**
 * Encapsulates all annotation drag, resize, draw, and edit interaction logic.
 */
export function useAnnotationInteraction(
  annotateMode: boolean,
  viewTransform: ViewTransform | undefined,
  onAdd: (annotation: GraphAnnotation) => void,
  onUpdate: (id: string, patch: Partial<GraphAnnotation>) => void,
): AnnotationInteraction {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const editingIdRef = useRef<string | null>(null);
  const editTitleRef = useRef("");
  const editBodyRef = useRef("");

  useEffect(() => { editingIdRef.current = editingId; }, [editingId]);
  useEffect(() => { editTitleRef.current = editTitle; }, [editTitle]);
  useEffect(() => { editBodyRef.current = editBody; }, [editBody]);

  const dragRef = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const [drawState, setDrawState] = useState<DrawState | null>(null);

  const toGraph = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!viewTransform) return { x: clientX, y: clientY };
    return {
      x: (clientX - viewTransform.x) / viewTransform.scale,
      y: (clientY - viewTransform.y) / viewTransform.scale,
    };
  }, [viewTransform]);

  const flushEdit = useCallback(() => {
    const id = editingIdRef.current;
    if (id) {
      onUpdate(id, { title: editTitleRef.current.slice(0, 20), body: editBodyRef.current.slice(0, 5000) });
      setEditingId(null);
      editingIdRef.current = null;
    }
  }, [onUpdate]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<SVGGElement>) => {
    if (!annotateMode) return;
    if ((e.target as SVGElement).closest("[data-annotation]")) return;
    e.stopPropagation();
    flushEdit();
    const svgRect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
    const pos = toGraph(e.clientX - svgRect.left, e.clientY - svgRect.top);
    setDrawState({
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
      isCircle: e.shiftKey,
    });
    setSelectedId(null);
  }, [annotateMode, toGraph, flushEdit]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGGElement>) => {
    if (!drawState) return;
    const svgRect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
    const pos = toGraph(e.clientX - svgRect.left, e.clientY - svgRect.top);
    setDrawState((prev) => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null);
  }, [drawState, toGraph]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!drawState) return;
    const dx = drawState.currentX - drawState.startX;
    const dy = drawState.currentY - drawState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      const id = crypto.randomUUID();
      onAdd({
        id,
        type: "note",
        x: drawState.startX - DEFAULT_NOTE_W / 2,
        y: drawState.startY - DEFAULT_NOTE_H / 2,
        title: "",
        body: "",
        width: DEFAULT_NOTE_W,
        height: DEFAULT_NOTE_H,
      });
      setEditingId(id);
      setEditTitle("");
      setEditBody("");
      setSelectedId(id);
    } else if (drawState.isCircle) {
      const cx = (drawState.startX + drawState.currentX) / 2;
      const cy = (drawState.startY + drawState.currentY) / 2;
      const radius = dist / 2;
      const id = crypto.randomUUID();
      onAdd({ id, type: "circle", x: cx, y: cy, title: "", body: "", radius });
      setEditingId(id);
      setEditTitle("");
      setEditBody("");
      setSelectedId(id);
    } else {
      const x = Math.min(drawState.startX, drawState.currentX);
      const y = Math.min(drawState.startY, drawState.currentY);
      const w = Math.abs(dx);
      const h = Math.abs(dy);
      const id = crypto.randomUUID();
      onAdd({ id, type: "rect", x, y, title: "", body: "", width: w, height: h });
      setEditingId(id);
      setEditTitle("");
      setEditBody("");
      setSelectedId(id);
    }
    setDrawState(null);
  }, [drawState, onAdd]);

  const handleAnnotationMouseDown = useCallback((e: React.MouseEvent, a: GraphAnnotation) => {
    if (!annotateMode) return;
    e.stopPropagation();
    setSelectedId(a.id);
    if (editingIdRef.current && editingIdRef.current !== a.id) flushEdit();

    const svgRect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
    dragRef.current = {
      id: a.id,
      startMouseX: e.clientX - svgRect.left,
      startMouseY: e.clientY - svgRect.top,
      startX: a.x,
      startY: a.y,
      isDragging: false,
    };

    const handleMove = (me: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const mx = me.clientX - svgRect.left;
      const my = me.clientY - svgRect.top;
      const dp = toGraph(mx, my);
      const sp = toGraph(drag.startMouseX, drag.startMouseY);
      const ddx = dp.x - sp.x;
      const ddy = dp.y - sp.y;
      if (!drag.isDragging && Math.sqrt(ddx * ddx + ddy * ddy) < DRAG_THRESHOLD) return;
      drag.isDragging = true;
      onUpdate(drag.id, { x: drag.startX + ddx, y: drag.startY + ddy });
    };

    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [annotateMode, toGraph, onUpdate, flushEdit]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, a: GraphAnnotation) => {
    e.stopPropagation();
    const svgRect = (e.currentTarget.closest("svg") as SVGSVGElement).getBoundingClientRect();
    resizeRef.current = {
      id: a.id,
      startMouseX: e.clientX - svgRect.left,
      startMouseY: e.clientY - svgRect.top,
      startW: a.width ?? DEFAULT_NOTE_W,
      startH: a.height ?? DEFAULT_NOTE_H,
    };

    const handleMove = (me: MouseEvent) => {
      const rs = resizeRef.current;
      if (!rs) return;
      const mx = me.clientX - svgRect.left;
      const my = me.clientY - svgRect.top;
      const dp = toGraph(mx, my);
      const sp = toGraph(rs.startMouseX, rs.startMouseY);
      const newW = Math.max(80, rs.startW + (dp.x - sp.x));
      const newH = Math.max(40, rs.startH + (dp.y - sp.y));
      onUpdate(rs.id, { width: newW, height: newH });
    };

    const handleUp = () => {
      resizeRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }, [toGraph, onUpdate]);

  const handleAnnotationDoubleClick = useCallback((e: React.MouseEvent, a: GraphAnnotation) => {
    if (!annotateMode) return;
    e.stopPropagation();
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditBody(a.body);
    setSelectedId(a.id);
  }, [annotateMode]);

  return {
    selectedId,
    setSelectedId,
    editingId,
    editTitle,
    editBody,
    setEditTitle,
    setEditBody,
    drawState,
    flushEdit,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleAnnotationMouseDown,
    handleResizeMouseDown,
    handleAnnotationDoubleClick,
  };
}
