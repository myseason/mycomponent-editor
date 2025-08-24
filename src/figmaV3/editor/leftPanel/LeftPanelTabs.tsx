"use client";

import React, { JSX, useCallback, useMemo, useState } from "react";

import Layers from "@/figmaV3/editor/leftPanel/Layers";
import Palette from "@/figmaV3/editor/leftPanel/Palette";

/** 좌측 패널: Palette / Layers 탭 컨테이너 */
type TabKey = "palette" | "layers";

const TAB_LABEL: Record<TabKey, string> = {
  palette: "Palette",
  layers: "Layers",
};

const TAB_ORDER: TabKey[] = ["palette", "layers"];

export default function LeftPanelTabs(): JSX.Element {
  const [active, setActive] = useState<TabKey>("palette");
  const onSelectTab = useCallback((t: TabKey) => setActive(t), []);
  const tabs = useMemo(() => TAB_ORDER, []);

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%", minHeight: 0 }}>
      {/* 탭 헤더 */}
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
                border: `1px solid ${isActive ? "#10b981" : "#e5e7eb"}`,
                background: isActive ? "#ecfdf5" : "#fff",
                color: isActive ? "#065f46" : "#374151",
                cursor: "pointer",
              }}
            >
              {TAB_LABEL[t]}
            </button>
          );
        })}
      </div>

      {/* 탭 바디 */}
      <div style={{ overflowY: "auto", minHeight: 0 }}>
        {active === "palette" && <Palette />}
        {active === "layers" && <Layers />}
      </div>
    </div>
  );
}