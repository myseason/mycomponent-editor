import React, {JSX, useMemo} from "react";
import { useEditor } from "../useEditor";
import { getRegistry } from "@/figmaV3/core/registry";
import type { BindingScope, NodeAny } from "@/figmaV3/core/types";
import { getBoundProps } from "@/figmaV3/runtime/binding";

function NodeView({ node }: { node: NodeAny }): JSX.Element {
    const { state } = useEditor();
    const reg = getRegistry();
    const def = reg.get(node.componentId);

    const scope: BindingScope = useMemo(
        () => ({ data: state.data, settings: state.settings, props: node.props }),
        [state.data, state.settings, node.props]
    );

    const boundProps = useMemo(
        () => getBoundProps(node.props as Record<string, unknown>, scope, node.logic?.bindings),
        [node.props, node.logic?.bindings, scope]
    );

    if (!def) return <div style={{ padding: 8, color: "#999" }}>Unknown: {node.componentId}</div>;

    const merged: NodeAny = { ...node, props: boundProps as Record<string, unknown> };
    return def.Render({ node: merged });
}

export default function Canvas(): JSX.Element {
    const { state } = useEditor();
    const page = state.project.pages.find((p) => p.id === state.project.currentPageId) ?? state.project.pages[0];
    const root = state.project.nodes[page.rootId] as NodeAny | undefined;
    const canvasWidth = (state.settings.canvasWidth as number | undefined) ?? 640;

    if (!root) return <div style={{ padding: 16 }}>Root not found</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: "#f5f6f8", display: "flex", justifyContent: "center" }}>
                <div
                    style={{
                        background: "#fff",
                        width: canvasWidth,
                        minHeight: 480,
                        margin: "16px 0",
                        boxShadow: "0 0 0 1px #e5e7eb",
                        position: "relative",
                        padding: 12
                    }}
                >
                    <NodeView node={root} />
                </div>
            </div>
        </div>
    );
}