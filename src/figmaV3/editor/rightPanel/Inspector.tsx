"use client";

import React from "react";

import { getComponent } from "@/figmaV3/core/registry";
import { useEditor } from "@/figmaV3/editor/useEditor";

import PropsAutoSection from "./sections/PropsAutoSection";

const Inspector: React.FC = () => {
  const { state } = useEditor();
  const id = state.selectedId ?? state.ui?.selectedId ?? null;
  if (!id) return <div style={{ padding: 12 }}>선택된 노드가 없습니다.</div>;

  const node = state.project.nodes[id];
  if (!node) return <div style={{ padding: 12 }}>노드를 찾을 수 없습니다.</div>;
  const def = getComponent(node.componentId);
  if (!def) return <div style={{ padding: 12 }}>컴포넌트 정의를 찾을 수 없습니다.</div>;

  return (
    <div style={{ padding: 12, display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 600 }}>Inspector</div>

      {/* 1) Component Props 자동 섹션(있을 때만) */}
      {def.propsSchema && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Component</div>
          <PropsAutoSection nodeId={id} />
        </div>
      )}

      {/* 2) 공통 스타일 섹션(Dimensions/Spacing 등) → 이후 단계에서 추가 */}
    </div>
  );
};

export default Inspector;