"use client";

import React from "react";
import { useEditor } from "@/figmaV3/editor/useEditor";
import type { NodeAny } from "@/figmaV3/core/types";

export default function Layers() {
    const { state, store } = useEditor();

    // V3: pages 있을 수도/없을 수도 있음 → 항상 rootId 기준
    const rootId = state.project?.rootId;
    const nodes = state.project?.nodes ?? {};
    const root = rootId ? (nodes[rootId] as NodeAny | undefined) : undefined;

    if (!root) {
        return (
            <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
                No root container.
            </div>
        );
    }

    const renderItem = (id: string, depth = 0): React.ReactNode => {
        const n = nodes[id] as NodeAny | undefined;
        if (!n) return null;

        const isSelected = state.ui?.selectedId === id;

        const onSelect = (ev: React.MouseEvent) => {
            ev.stopPropagation();
            store.select(id);
        };

        const onToggleLock = (ev: React.MouseEvent) => {
            ev.stopPropagation();
            // patchNode 있으면 사용, 없으면 update로 flags 갱신
            if ("patchNode" in store) {
                (store as unknown as { patchNode: (nid: string, patch: Partial<NodeAny>) => void })
                    .patchNode(id, { flags: { ...(n.flags ?? {}), locked: !n.flags?.locked } });
            } else if ("update" in store) {
                (store as unknown as { update: (fn: (s: typeof state) => void) => void }).update((draft) => {
                    const map = draft.project.nodes as Record<string, NodeAny>;
                    const cur = map[id];
                    cur.flags = { ...(cur.flags ?? {}), locked: !cur.flags?.locked };
                });
            }
        };

        const onDelete = (ev: React.MouseEvent) => {
            ev.stopPropagation();
            if (n.flags?.locked) {
                // 잠금 안내 (1~2초 사라지는 토스트는 구현 환경에 맞춰 적용)
                // eslint-disable-next-line no-alert
                alert("잠금 해제 후 삭제할 수 있습니다.");
                return;
            }
            if ("remove" in store) {
                (store as unknown as { remove: (nid: string) => void }).remove(id);
            } else if ("update" in store) {
                (store as unknown as { update: (fn: (s: typeof state) => void) => void }).update((draft) => {
                    const map = draft.project.nodes as Record<string, NodeAny>;
                    // 부모에서 분리
                    const parent = Object.values(map).find((nn) => nn.children?.includes(id));
                    if (parent) parent.children = parent.children.filter((cid) => cid !== id);
                    // 자신 삭제
                    delete map[id];
                    if (draft.ui?.selectedId === id) draft.ui.selectedId = null;
                });
            }
        };

        return (
            <div key={id} style={{ paddingLeft: 8 + depth * 12 }}>
                <div
                    onClick={onSelect}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 6px",
                        borderRadius: 6,
                        background: isSelected ? "#e5f0ff" : "transparent",
                        cursor: "pointer",
                    }}
                >
                    {/* 아이콘/라벨 */}
                    <span style={{ fontSize: 12, color: "#374151" }}>{n.componentId}</span>
                    <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {/* lock 상태 텍스트 표시 */}
                        {n.flags?.locked ? (
                            <span title="locked" style={{ fontSize: 11, color: "#9ca3af" }}>
                locked
              </span>
                        ) : null}
                        {/* lock 토글 */}
                        <button type="button" onClick={onToggleLock} title="Lock/Unlock" style={{ fontSize: 11 }}>
              {n.flags?.locked ? "Unlock" : "Lock"}
            </button>
                        {/* 삭제 */}
                        <button type="button" onClick={onDelete} title="Delete" style={{ fontSize: 11 }}>
              Del
            </button>
          </span>
                </div>

                {/* 자식 */}
                {(n.children ?? []).map((cid) => renderItem(cid, depth + 1))}
            </div>
        );
    };

    return (
        <div style={{ padding: 8 }}>
            <div style={{ fontSize: 12, color: "#6b7280", margin: "4px 6px 8px" }}>Layers</div>
            {renderItem(rootId)}
        </div>
    );
}