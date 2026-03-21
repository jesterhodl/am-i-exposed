import { useState, useCallback } from "react";

interface UseLabelEditorParams {
  nodeLabels?: Map<string, string>;
  edgeLabels?: Map<string, string>;
  onSetNodeLabel?: (txid: string, label: string) => void;
  onSetEdgeLabel?: (key: string, label: string) => void;
}

interface EditingNodeLabel {
  type: "node";
  txid: string;
}

interface EditingEdgeLabel {
  type: "edge";
  key: string;
}

export type EditingLabel = EditingNodeLabel | EditingEdgeLabel;

interface UseLabelEditorReturn {
  editingLabel: EditingLabel | null;
  editLabelText: string;
  setEditLabelText: (text: string) => void;
  startEditNodeLabel: (txid: string) => void;
  startEditEdgeLabel: (key: string) => void;
  commitLabel: () => void;
}

export function useLabelEditor({
  nodeLabels,
  edgeLabels,
  onSetNodeLabel,
  onSetEdgeLabel,
}: UseLabelEditorParams): UseLabelEditorReturn {
  const [editingLabel, setEditingLabel] = useState<EditingLabel | null>(null);
  const [editLabelText, setEditLabelText] = useState("");

  const startEditNodeLabel = useCallback((txid: string) => {
    setEditingLabel({ type: "node", txid });
    setEditLabelText(nodeLabels?.get(txid) ?? "");
  }, [nodeLabels]);

  const startEditEdgeLabel = useCallback((key: string) => {
    setEditingLabel({ type: "edge", key });
    setEditLabelText(edgeLabels?.get(key) ?? "");
  }, [edgeLabels]);

  const commitLabel = useCallback(() => {
    if (!editingLabel) return;
    if (editingLabel.type === "node") {
      onSetNodeLabel?.(editingLabel.txid, editLabelText.trim());
    } else {
      onSetEdgeLabel?.(editingLabel.key, editLabelText.trim());
    }
    setEditingLabel(null);
  }, [editingLabel, editLabelText, onSetNodeLabel, onSetEdgeLabel]);

  return {
    editingLabel,
    editLabelText,
    setEditLabelText,
    startEditNodeLabel,
    startEditEdgeLabel,
    commitLabel,
  };
}
