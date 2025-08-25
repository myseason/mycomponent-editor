"use client";

import React from "react";
import type {
    NodeAny,
    ComponentDefinition,
    StyleBase,
    BindingScope,
} from "@/figmaV3/core/types";
import { getComponent } from "@/figmaV3/core/registry";
import { useEditor } from "@/figmaV3/editor/useEditor";
import { getBoundProps } from "@/figmaV3/runtime/binding";

/** cloneElement로 덧씌울 수 있는 최소 인터페이스 */
type StylableClickable = {
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
};

export default function Canvas(): React.ReactElement | null {
    const { state, store } = useEditor();
    const root = state.project.nodes[state.project.rootId] as NodeAny | undefined;
    if (!root) return null;

    return (
        <div
            className="center"
            style={{ display: "flex", justifyContent: "center", height: "100%" }}
            onClick={() => store.select(state.project.rootId)}
        >
            {/* 스테이지(흰 보드) + 루트 살짝 내리기(40px) */}
            <div
                style={{
                    marginTop: 40,
                    background: "#f3f4f6",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    store.select(state.project.rootId);
                }}
            >
                <div
                    style={{
                        width: state.settings?.canvasWidth ?? 640,
                        minHeight: 400,
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
                        position: "relative",
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        store.select(state.project.rootId);
                    }}
                >
                    <NodeView node={root} />
                </div>
            </div>
        </div>
    );

    /** 단일 노드 렌더러 */
    function NodeView({ node }: { node: NodeAny }): React.ReactElement | null {
        const def = getComponent(node.componentId) as
            | ComponentDefinition<Record<string, unknown>, StyleBase>
            | undefined;

        if (!def) {
            return (
                <div
                    style={{
                        padding: 8,
                        margin: 8,
                        border: "1px dashed #ef4444",
                        color: "#ef4444",
                        fontSize: 12,
                    }}
                >
                    Unknown component: {node.componentId}
                </div>
            );
        }

        // 데이터 바인딩 스코프 (※ BindingScope는 rootId가 아니라 root를 받습니다)
        const rootNode = state.project.nodes[state.project.rootId] as NodeAny | undefined ?? null;
        const scope: BindingScope = {
            data: state.data,
            settings: state.settings ?? {},
            node,
            root: rootNode,
        };

        const boundProps = getBoundProps(node.props as Record<string, unknown>, scope);

        // 실제 컴포넌트 렌더
        const rendered = def.Render({
            node: { ...node, props: boundProps } as NodeAny,
            fire: undefined,
        });
        if (!rendered) return null;

        const el = rendered as React.ReactElement<StylableClickable>;
        const isSelected = state.ui.selectedId === node.id;

        const handleSelect: React.MouseEventHandler = (ev) => {
            ev.stopPropagation();
            store.select(node.id);
        };

        const childStyle = (el.props?.style ?? {}) as React.CSSProperties;
        const childPos = String(childStyle.position ?? "");

        // absolute/fixed → 엘리먼트 자체에 outline
        if (childPos === "absolute" || childPos === "fixed") {
            return React.cloneElement(el, {
                onClick: handleSelect,
                style: {
                    ...childStyle,
                    outline: isSelected ? "2px solid #3b82f6" : childStyle.outline,
                    outlineOffset:
                        isSelected && childStyle.outlineOffset == null ? -1 : childStyle.outlineOffset,
                    cursor: "default",
                } as React.CSSProperties,
            });
        }

        // 그 외 → 래퍼 + 오버레이
        const isRoot = node.id === state.project.rootId;
        return (
            <div
                data-node-id={node.id}
                onClick={handleSelect}
                style={{ position: "relative" }}
            >
                {el}
                {isSelected && !isRoot && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            border: "2px solid #3b82f6",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>
        );
    }
}