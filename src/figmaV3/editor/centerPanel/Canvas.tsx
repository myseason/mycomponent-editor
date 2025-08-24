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

/**
 * 중앙 캔버스
 * - 루트 노드부터 재귀 렌더
 * - 선택 처리
 * - 데이터 바인딩(템플릿) 적용
 * - absolute/fixed는 cloneElement로 직접 outline/클릭 부여
 * - 그 외는 래퍼+오버레이 방법으로 선택 표시
 */
export default function Canvas() {
    const { state, store } = useEditor();
    const root = state.project.nodes[state.project.rootId] as NodeAny | undefined;

    if (!root) {
        // 루트가 없으면 빈 캔버스만
        return <div style={{ flex: 1, background: "#f3f4f6" }} />;
    }

    return (
        <div
            style={{
                flex: 1,
                background: "#f3f4f6",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                overflow: "auto",
            }}
            onClick={() => store.select(state.project.rootId)} // 빈 영역 클릭 시 루트 선택
        >
            <div
                style={{
                    width: state.settings!.canvasWidth,
                    minHeight: 480,
                    background: "white",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.02) inset",
                }}
                onClick={(e) => {
                    // 캔버스 박스 자체 클릭 시 루트 선택
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

        // 데이터 바인딩 스코프(노드/루트 포함)
        const rootNode = state.project.nodes[state.project.rootId] as NodeAny;
        const scope: BindingScope = {
            data: state.data,
            settings: state.settings,
            node,
            root: rootNode,
        };

        // props에 {{ }} 템플릿 적용
        const boundProps = getBoundProps(
            node.props as Record<string, unknown>,
            scope
        );

        // 실제 컴포넌트 렌더
        const rendered = def.Render({
            node: { ...node, props: boundProps } as NodeAny,
            fire: undefined,
        });

        // Render가 null을 반환하는 경우 방어
        if (!rendered) return null;

        // 여기서부터는 타입 안정화를 위해 any로 명시
        const el = rendered as React.ReactElement<any>;
        const isSelected = state.ui.selectedId === node.id;

        const handleSelect: React.MouseEventHandler = (ev) => {
            ev.stopPropagation();
            store.select(node.id);
        };

        // 자식 엘리먼트의 position을 파악(absolute/fixed면 래퍼가 0×0이 될 수 있음)
        const childStyle = (el.props?.style ?? {}) as React.CSSProperties;
        const childPos = String(childStyle.position ?? "");

        if (childPos === "absolute" || childPos === "fixed") {
            // ✅ absolute/fixed: 엘리먼트 자체에 outline과 onClick을 부여 (cloneElement)
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

        // ✅ 그 외: 래퍼 + 오버레이로 선택 윤곽선 표시
        return (
            <div
                data-node-id={node.id}
                onClick={handleSelect}
                style={{
                    position: "relative",
                    // 래퍼 영향 최소화: block 컨테이너에서 기본 흐름 유지
                    // 필요 시 display: "contents"를 고려할 수 있으나, 오버레이가 불가능해져 사용하지 않음
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