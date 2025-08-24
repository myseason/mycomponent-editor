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
            onClick={() => store.select(state.project.rootId)}
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
                    e.stopPropagation();
                    store.select(state.project.rootId);
                }}
            >
                <NodeView node={root} />
            </div>
        </div>
    );

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

        return (
            <div
                data-node-id={node.id}
                onClick={handleSelect}
                suppressHydrationWarning
                style={{ position: "relative" }}
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