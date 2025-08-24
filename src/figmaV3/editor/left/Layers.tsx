import { useEditor } from "../useEditor";
import type { NodeAny } from "@/figmaV3/core/types";
import {JSX} from "react";

export default function Layers(): JSX.Element {
    const { state, store } = useEditor();
    const nodes = state.project.nodes;

    const page = state.project.pages.find((p) => p.id === state.project.currentPageId) ?? state.project.pages[0];
    const root = nodes[page.rootId] as NodeAny;

    const renderTree = (n: NodeAny, depth = 0): JSX.Element => {
        return (
            <div key={n.id} style={{ paddingLeft: depth * 12, display: "flex", gap: 8, alignItems: "center" }}>
                <button
                    type="button"
                    onClick={() => store.select(n.id)}
                    style={{
                        border: "none",
                        background: "transparent",
                        color: state.selection.selectedId === n.id ? "#2563eb" : "#111827",
                        fontSize: 12,
                        padding: "2px 0"
                    }}
                    title={n.id}
                >
                    {n.componentId}
                </button>
                {n.children.map((cid) => renderTree(nodes[cid] as NodeAny, depth + 1))}
            </div>
        );
    };

    return <div style={{ padding: 10 }}>{renderTree(root)}</div>;
}