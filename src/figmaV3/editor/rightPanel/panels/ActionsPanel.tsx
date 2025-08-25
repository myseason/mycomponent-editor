"use client";

import React, { useMemo } from "react";
import { useEditor } from "@/figmaV3/editor/useEditor";
import { getSteps, runActions } from "@/figmaV3/runtime/actions";
import type { SupportedEvent, ActionStep } from "@/figmaV3/core/types";

export default function ActionsPanel() {
    const { state } = useEditor();
    const selectedId = state.ui.selectedId;
    const node = selectedId ? state.project.nodes[selectedId] : undefined;

    const steps: ActionStep[] = useMemo(() => {
        if (!node) return [];
        return getSteps(node, "onClick");
    }, [node]);

    return (
        <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Actions</div>
            {node ? (
                <>
                    <div style={{ marginBottom: 8 }}>Selected: {node.componentId} ({node.id})</div>
                    <button
                        onClick={() => runActions(node, "onClick")}
                        style={{ border: "1px solid #e5e7eb", padding: "6px 10px", borderRadius: 6 }}
                    >
                        Test onClick
                    </button>
                    <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                        {steps.length ? `${steps.length} step(s)` : "No steps"}
                    </div>
                </>
            ) : (
                <div style={{ color: "#9ca3af" }}>노드를 선택하세요</div>
            )}
        </div>
    );
}