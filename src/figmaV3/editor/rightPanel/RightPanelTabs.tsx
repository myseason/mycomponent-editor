"use client";

import React, { JSX, useCallback, useMemo, useState } from "react";

import Inspector from "@/figmaV3/editor/rightPanel/Inspector";
import ActionsPanel from "@/figmaV3/editor/rightPanel/panels/ActionsPanel";
import DataPanel from "@/figmaV3/editor/rightPanel/panels/DataPanel";
import { useEditor } from "@/figmaV3/editor/useEditor";

type TabKey = "props" | "actions" | "data";
const TAB_LABEL: Record<TabKey, string> = { props: "Inspector", actions: "Actions", data: "Data" };
const TAB_ORDER: TabKey[] = ["props", "actions", "data"];

export default function RightPanelTabs(): JSX.Element {
  const { state } = useEditor();
  const selectedId =
    ((state as unknown as { ui?: { selectedId?: string | null } }).ui?.selectedId ?? null);

  const [active, setActive] = useState<TabKey>("props");
  const onSelectTab = useCallback((t: TabKey) => setActive(t), []);
  const tabs = useMemo(() => TAB_ORDER, []);

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 6, padding: "8px 8px 6px 8px", borderBottom: "1px solid #e5e7eb" }}>
        {tabs.map((t) => {
          const isActive = active === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelectTab(t)}
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 6,
                border: `1px solid ${isActive ? "#3b82f6" : "#e5e7eb"}`,
                background: isActive ? "#eff6ff" : "#fff",
                color: isActive ? "#1d4ed8" : "#374151",
                cursor: "pointer",
              }}
            >
              {TAB_LABEL[t]}
            </button>
          );
        })}
      </div>

      <div style={{ overflowY: "auto", minHeight: 0, padding: 10 }}>
        {active === "props" && <Inspector />}
        {active === "actions" && (selectedId ? <ActionsPanel /> : <p style={{ fontSize: 12, color: "#9ca3af" }}>선택된 컴포넌트가 없습니다.</p>)}
        {active === "data" && <DataPanel />}
      </div>
    </div>
  );
}