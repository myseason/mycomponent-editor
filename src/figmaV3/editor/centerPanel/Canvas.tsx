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

/** cloneElement로 덧씌울 수 있는 최소 스타일/클릭 인터페이스 */
type StylableClickable = {
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
};

export default function Canvas() {
    const { state, store } = useEditor();
    const root = state.project.nodes[state.project.rootId] as NodeAny | undefined;

    if (!root) {
        // 루트가 없다면 빈 캔버스
        return <div style={{ flex: 1, background: "#f3f4f6" }} />;
    }

    return (
        // 중앙 패널(.center)은 이미 100vh 그리드의 1fr을 차지. 여기선 스테이지만 그리면 됨.
        <div
            style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                overflow: "auto",
            }}
            onClick={() => store.select(state.project.rootId)}
        >
            {/* 스테이지(흰색 캔버스 보드): 너비는 설정 값, 높이는 중앙 패널의 높이를 가득 쓰도록 */}
            <div
                style={{
                    width: state.settings!.canvasWidth,
                    minHeight: "100%",            // ← 중앙 패널 높이를 그대로 채움
                    background: "white",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.02) inset",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    store.select(state.project.rootId);
                }}
            >
                <NodeView node={root} />
            </div>
        </div>
    );

    /** 단일 노드 렌더러 */
    function NodeView({ node }: { node: NodeAny }) {
        const def = getComponent(node.componentId) as
            | ComponentDefinition<Record<string, unknown>, StyleBase>
            | undefined;

        if (!def) {
            return (
                <div
                    style={{
                        padding: 8,
                        border: "1px dashed #ef4444",
                        color: "#ef4444",
                        margin: 4,
                    }}
                >
                    Unknown component: {node.componentId}
                </div>
            );
        }

        // 데이터 바인딩 스코프
        const rootNode = state.project.nodes[state.project.rootId] as NodeAny;
        const scope: BindingScope = {
            data: state.data,
            settings: state.settings,
            node,
            root: rootNode,
        };

        const boundProps = getBoundProps(
            node.props as Record<string, unknown>,
            scope
        );

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

        // 그 외 → 래퍼+오버레이
        const isRoot = node.id === state.project.rootId;

        return (
            <div
                data-node-id={node.id}
                suppressHydrationWarning
                onClick={handleSelect}
                style={{
                    position: "relative",
                    // ✅ 루트 박스가 비어있어도 보이도록 최소 높이 부여
                    minHeight: isRoot ? 200 : undefined,
                }}
            >
                {el}
                {isSelected && (
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            outline: "2px solid #3b82f6",
                            outlineOffset: -1,
                            borderRadius:
                                typeof childStyle.borderRadius === "number" ||
                                typeof childStyle.borderRadius === "string"
                                    ? childStyle.borderRadius
                                    : undefined,
                        }}
                    />
                )}
            </div>
        );
    }
}