"use client";

import React, { useCallback, useMemo } from "react";
import type { NodeAny } from "@/figmaV3/core/types";
import { getComponent } from "@/figmaV3/core/registry";
import { useEditor } from "@/figmaV3/editor/useEditor";
import { getBoundProps } from "@/figmaV3/runtime/binding";
import { runActions } from "@/figmaV3/runtime/actions";

export default function Canvas() {
    const { state, store, selectedId } = useEditor();
    const root = state.project.nodes[state.project.rootId] as NodeAny | undefined;

    // 캔버스 배경 & 루트 컨테이너 위치
    const canvasStyle: React.CSSProperties = useMemo(
        () => ({
            flex: 1,
            minHeight: 0,
            background: "#f5f6f8",
            display: "grid",
            placeItems: "start center",
            overflow: "auto",
            paddingTop: 40, // 요청: 40px 내려오기
        }),
        []
    );

    if (!root) {
        return <div style={canvasStyle}>No root node</div>;
    }

    return (
        <div style={canvasStyle}>
            <NodeView nodeId={root.id} />
        </div>
    );
}

function NodeView({ nodeId }: { nodeId: string }) {
    const { state, store, selectedId } = useEditor();

    const node = state.project.nodes[nodeId] as NodeAny | undefined;
    const def = node ? getComponent(node.componentId) : undefined;
    const isSelected = node?.id === selectedId;

    const boundProps = useMemo(() => {
        if (!node) return {};
        return getBoundProps(node.props, {
            data: state.data,
            settings: state.settings,
            node,
            root: state.project.nodes[state.project.rootId] as NodeAny,
        });
    }, [node, state.data, state.settings, state.project.rootId, state.project.nodes]);

    const onSelect = useCallback(
        (ev: React.MouseEvent) => {
            ev.stopPropagation();
            if (node?.id) store.select(node.id);
        },
        [store, node?.id]
    );

    const fire = useCallback(
        (evt: "onClick" | "onChange" | "onLoad") => {
            if (node) runActions(node, evt);
        },
        [node]
    );

    if (!node || !def) return null;

    // 노드에서 스타일/자식 계산
    const style = (node.styles.element ?? {}) as React.CSSProperties;
    const children = node.children ?? [];

    // 실제 컴포넌트 렌더
    const rendered = def.Render({
        node: { ...node, props: boundProps } as NodeAny,
        fire
    });

    // 선택 윤곽선 오버레이 래퍼
    return (
        <div
            data-node-id={node.id}
            onClick={onSelect}
            style={{
                position: "relative",
                outline: isSelected ? "2px solid #3b82f6" : "none",
                outlineOffset: 0,
                ...style,
            }}
        >
            {/* 컴포넌트 내용 */}
            <div>{rendered}</div>

            {/* 자식 재귀 */}
            {children.map((cid) => (
                <NodeView key={cid} nodeId={cid} />
            ))}
        </div>
    );
}