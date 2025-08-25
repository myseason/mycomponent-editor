"use client";

import React, { useMemo, useCallback } from "react";
import type { NodeAny } from "@/figmaV3/core/types";
import { getComponent } from "@/figmaV3/core/registry";
import { useEditor } from "@/figmaV3/editor/useEditor";

export default function Layers() {
    const { state, store, selectedId } = useEditor();
    const rootId = state.project.rootId;
    const nodes = state.project.nodes;

    const tree = useMemo(() => {
        function build(id: string): { id: string; node: NodeAny; children: string[] } | null {
            const n = nodes[id] as NodeAny | undefined;
            if (!n) return null;
            return { id, node: n, children: n.children ?? [] };
        }
        return build(rootId);
    }, [nodes, rootId]);

    const onSelect = useCallback((id: string) => store.select(id), [store]);

    const onToggleLock = useCallback((id: string) => {
        if (id === rootId) return; // 루트 보호
        const n = nodes[id] as NodeAny | undefined;
        if (!n) return;
        store.patchNode(id, { locked: !n.locked });
    }, [store, nodes, rootId]);

    const onDelete = useCallback((id: string) => {
        if (id === rootId) return; // 루트 보호
        const n = nodes[id] as NodeAny | undefined;
        if (!n || n.locked) return;
        // 간이 삭제(부모에서 끊고, 자기/자손 제거)는 추후 확장
        // 여기서는 부모 탐색 없이 "노드를 orphan" 시키지 않도록 간단 경고만.
        // 필요 시 store에 안전 삭제 API 추가 권장.
        // eslint-disable-next-line no-alert
        alert("삭제는 안전 삭제 API로 추후 추가 예정입니다.");
    }, [nodes, rootId]);

    if (!tree) return null;

    return (
        <div style={{ padding: 8, borderTop: "1px solid #e5e7eb" }}>
            <LayerItem
                nodeId={tree.id}
                depth={0}
                selectedId={selectedId}
                onSelect={onSelect}
                onToggleLock={onToggleLock}
                onDelete={onDelete}
                nodes={nodes}
            />
        </div>
    );
}

function LayerItem(props: {
    nodeId: string;
    depth: number;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onToggleLock: (id: string) => void;
    onDelete: (id: string) => void;
    nodes: Record<string, NodeAny>;
}) {
    const { nodeId, depth, selectedId, onSelect, onToggleLock, onDelete, nodes } = props;
    const node = nodes[nodeId] as NodeAny;
    const def = getComponent(node.componentId);
    const isSelected = selectedId === nodeId;

    return (
        <div style={{ paddingLeft: depth * 12, display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => onSelect(nodeId)} style={{ border: 0, background: "transparent", cursor: "pointer" }}>
        <span style={{ fontWeight: isSelected ? 700 : 400 }}>
          {def?.title ?? node.componentId} ({nodeId})
        </span>
            </button>
            {nodeId !== (Object.values(nodes)[0]?.id ?? "") && (
                <>
                    <button onClick={() => onToggleLock(nodeId)} style={{ marginLeft: "auto" }}>
                        {node.locked ? "🔒" : "🔓"}
                    </button>
                    <button onClick={() => onDelete(nodeId)} disabled={!!node.locked} title={node.locked ? "Lock 해제 후 삭제" : "삭제"}>
                        🗑️
                    </button>
                </>
            )}
            {(node.children ?? []).map((cid) => (
                <LayerItem
                    key={cid}
                    nodeId={cid}
                    depth={depth + 1}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onToggleLock={onToggleLock}
                    onDelete={onDelete}
                    nodes={nodes}
                />
            ))}
        </div>
    );
}