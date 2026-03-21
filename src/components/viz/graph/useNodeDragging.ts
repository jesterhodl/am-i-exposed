import { useRef, useState, useCallback, useEffect } from "react";
import type { LayoutNode, ViewTransform } from "./types";

interface UseNodeDraggingParams {
  onNodePositionChange?: (txid: string, x: number, y: number) => void;
  viewTransform?: ViewTransform;
  annotateMode?: boolean;
}

interface UseNodeDraggingReturn {
  draggingTxid: string | null;
  handleNodeMouseDown: (e: React.MouseEvent, node: LayoutNode) => void;
  justDraggedRef: React.RefObject<boolean>;
}

export function useNodeDragging({
  onNodePositionChange,
  viewTransform,
  annotateMode,
}: UseNodeDraggingParams): UseNodeDraggingReturn {
  const nodeDragRef = useRef<{
    txid: string;
    startMouseX: number;
    startMouseY: number;
    startNodeX: number;
    startNodeY: number;
    isDragging: boolean;
  } | null>(null);
  const [draggingTxid, setDraggingTxid] = useState<string | null>(null);
  const justDraggedRef = useRef(false);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, node: LayoutNode) => {
    if (!onNodePositionChange || !viewTransform || annotateMode) return;
    if (e.button !== 0) return; // left click only
    e.stopPropagation();
    nodeDragRef.current = {
      txid: node.txid,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
      isDragging: false,
    };
  }, [onNodePositionChange, viewTransform, annotateMode]);

  useEffect(() => {
    if (!onNodePositionChange || !viewTransform) return;
    const scale = viewTransform.scale;

    const handleMouseMove = (e: MouseEvent) => {
      const drag = nodeDragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startMouseX;
      const dy = e.clientY - drag.startMouseY;
      if (!drag.isDragging && Math.sqrt(dx * dx + dy * dy) < 5) return;
      drag.isDragging = true;
      setDraggingTxid(drag.txid);
      const newX = drag.startNodeX + dx / scale;
      const newY = drag.startNodeY + dy / scale;
      onNodePositionChange(drag.txid, newX, newY);
    };

    const handleMouseUp = () => {
      const drag = nodeDragRef.current;
      if (!drag) return;
      if (drag.isDragging) {
        // Suppress the click that fires right after mouseup
        justDraggedRef.current = true;
        requestAnimationFrame(() => { justDraggedRef.current = false; });
      }
      nodeDragRef.current = null;
      setDraggingTxid(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onNodePositionChange, viewTransform]);

  return { draggingTxid, handleNodeMouseDown, justDraggedRef };
}
