"use client";

import React, { JSX } from "react";

import type { NodeAny } from "@/figmaV3/core/types";
import { useEditor } from "@/figmaV3/editor/useEditor";

const Row: React.FC<{ node: NodeAny; depth: number; selectedId: string | null; onSelect: (id: string) => void }> = ({ node, depth, selectedId, onSelect }) => {
  const selected = node.id === selectedId;
  return (
    <div
      style={{
        padding: "4px 8px",
        paddingLeft: 8 + depth * 12,
        background: selected ? "#e0e7ff" : "transparent",
        cursor: "pointer",
      }}
      onClick={() => onSelect(node.id)}
    >
      {node.componentId} <span style={{ color: "#6b7280" }}>({node.id})</span>
    </div>
  );
};

const Layers: React.FC = () => {
  const { state, store } = useEditor();
  const page = state.currentPageId
    ? state.project.pages.find((p) => p.id === state.currentPageId)
    : state.project.pages[0];
  const rootId = page?.rootId ?? null;

  const nodes = state.project.nodes;
  const selectedId = state.selectedId ?? state.ui?.selectedId ?? null;

  const traverse = (id: string, depth: number, acc: JSX.Element[]): void => {
    const n = nodes[id];
    if (!n) return;
    acc.push(<Row key={id} node={n} depth={depth} selectedId={selectedId} onSelect={(x) => store.select(x)} />);
    for (const cid of n.children ?? []) traverse(cid, depth + 1, acc);
  };

  const rows: JSX.Element[] = [];
  if (rootId) traverse(rootId, 0, rows);

  return (
    <div style={{ padding: 12, borderTop: "1px solid #e5e7eb" }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Layers</div>
      <div>{rows}</div>
    </div>
  );
};
export default Layers;