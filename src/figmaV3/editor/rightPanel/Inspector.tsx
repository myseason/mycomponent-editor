import React, {JSX, useMemo} from "react";

import { useEditor } from "@/figmaV3/editor/useEditor";
import type { NodeAny } from "@/figmaV3/core/types";
import RightPanelTabs from "@/figmaV3/editor/rightPanel/RightPanelTabs";
import PropsAutoSection from "@/figmaV3/editor/rightPanel/sections/PropsAutoSection";

export default function Inspector(): JSX.Element {
    const { state } = useEditor();

    // ✅ V3 타입: selectedId는 state.ui.selectedId
    const selectedId = state.ui.selectedId ?? null;
    const node: NodeAny | null = useMemo(() => {
        if (!selectedId) return null;
        return (state.project.nodes[selectedId] as NodeAny) ?? null;
    }, [selectedId, state.project.nodes]);

    if (!node) {
        return (
            <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>
                아무 컴포넌트도 선택되지 않았습니다.
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            {/* 상단 탭 (Props/Actions/Data) */}
            <RightPanelTabs />

            {/* 기본 속성 자동 렌더링 */}
            <div style={{ overflowY: "auto", padding: 12 }}>
                <PropsAutoSection nodeId={node.id} />
            </div>
        </div>
    );
}