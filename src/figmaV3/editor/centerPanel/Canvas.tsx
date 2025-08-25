"use client";

import React, { useCallback, useMemo } from "react";
import { useEditor } from "@/figmaV3/editor/useEditor";
import { getComponent } from "@/figmaV3/core/registry";
import type { NodeAny, BindingScope } from "@/figmaV3/core/types";
import { getBoundProps } from "@/figmaV3/runtime/binding";
import { runActions } from "@/figmaV3/runtime/actions";

/** 간단한 캔버스 스타일 (전체 채우기 + 중앙 가이드) */
const canvasStyle: React.CSSProperties = {
    position: "relative",
    height: "100%",
    width: "100%",
    overflow: "auto",
    background: "#f3f4f6", // 연한 회색
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: 40, // 루트 컨테이너/가이드 살짝 아래로
};

/** 중앙의 하얀 가이드 (페이지 컨테이너 느낌) */
const guideStyle: React.CSSProperties = {
    width: "min(100%, 1024px)",
    minHeight: 400,
    background: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    borderRadius: 8,
    position: "absolute",
    top: 40,
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
};

/** 선택 윤곽선 스타일 */
const outlineStyle: React.CSSProperties = {
    position: "absolute",
    border: "1.5px solid #3b82f6",
    pointerEvents: "none",
    boxShadow: "0 0 0 2px rgba(59,130,246,0.25)",
};

function NodeView({ node }: { node: NodeAny }): React.ReactElement {
    const { state, store } = useEditor();
    const selectedId = state.ui?.selectedId ?? null;

    const def = getComponent(node.componentId);
    const Render = def?.Render;

    // 렌더 스코프(데이터 바인딩/액션 평가용)
    const scope: BindingScope = useMemo(
        () => ({
            data: state.data ?? {},
            settings: state.settings,
            node,
            root:
                (state.project?.nodes?.[state.project?.rootId ?? ""] as NodeAny) ??
                null,
        }),
        [state, node]
    );

    // 바인딩 반영한 shallow node (props만 교체)
    const boundNode = useMemo<NodeAny>(() => {
        const boundProps = getBoundProps(
            (node.props ?? {}) as Record<string, unknown>,
            scope
        );
        return { ...node, props: boundProps };
    }, [node, scope]);

    const onClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            if (!node?.id) return;
            // 선택 변경
            if ("select" in store) {
                (store as unknown as { select: (id: string | null) => void }).select(
                    node.id
                );
            } else if ("update" in store) {
                (store as unknown as { update: (fn: (s: typeof state) => void) => void }).update(
                    (s) => {
                        (s as typeof state).ui = { ...(s as typeof state).ui, selectedId: node.id };
                    }
                );
            }
            // 클릭 액션
            void runActions(boundNode, "onClick", scope);
        },
        [node, store, state, boundNode, scope]
    );

    if (!Render) {
        return (
            <div data-node-id={node.id} style={{ padding: 8, color: "#6b7280" }}>
                Unknown component: <b>{node.componentId}</b>
            </div>
        );
    }

    // 실제 노드 렌더
    const content = (
        <div data-node-id={node.id} onClick={onClick} style={{ position: "relative" }}>
            <Render node={boundNode} />
        </div>
    );

    // 선택 윤곽선: 간단 버전(래퍼의 outline)
    const isSelected = selectedId === node.id;

    return (
        <div style={{ position: "relative" }}>
            {content}
            {isSelected && (
                <div
                    // 간단 버전: 래퍼 박스 기준 윤곽(실사용은 getBoundingClientRect로 정밀 계산 가능)
                    style={{ ...outlineStyle, inset: 0 }}
                />
            )}
        </div>
    );
}

export default function Canvas(): React.ReactElement {
    const { state } = useEditor();
    const rootId = state.project?.rootId ?? null;
    const root = (rootId && (state.project.nodes[rootId] as NodeAny)) || null;

    const onClickCanvas = useCallback(() => {
        // 빈 공간 클릭 시 선택 해제
        // 선택 해제는 store API에 맞춰 필요 시 추가하세요.
    }, []);

    return (
        <div style={canvasStyle} onClick={onClickCanvas}>
            {/* 중앙 가이드 */}
            <div style={guideStyle} />
            {/* 루트가 없으면 안내 */}
            {!root ? (
                <div style={{ marginTop: 80, color: "#6b7280" }}>
                    루트 컨테이너가 없습니다. Palette에서 Box를 추가해 주세요.
                </div>
            ) : (
                <NodeView node={root} />
            )}
        </div>
    );
}