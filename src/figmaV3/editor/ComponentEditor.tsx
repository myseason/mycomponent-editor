"use client";

import React, { JSX } from "react";

// 컴포넌트 자동 등록(앱 1회 실행)
import "@/figmaV3/editor/bootstrap";

import Canvas from "@/figmaV3/editor/centerPanel/Canvas";
import LeftPanelTabs from "@/figmaV3/editor/leftPanel/LeftPanelTabs";
import RightPanelTabs from "@/figmaV3/editor/rightPanel/RightPanelTabs";

/** 에디터 레이아웃:
 *  좌: LeftPanelTabs(Palette/Layers)
 *  중: Canvas
 *  우: RightPanelTabs(Inspector/Actions/Data)
 */
export default function ComponentEditor(): JSX.Element {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr 360px",
        gridTemplateRows: "1fr",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Left */}
      <div style={{ borderRight: "1px solid #e5e7eb", minHeight: 0 }}>
        <LeftPanelTabs />
      </div>

      {/* Center */}
      <div style={{ minWidth: 0, minHeight: 0 }}>
        <Canvas />
      </div>

      {/* Right */}
      <div style={{ borderLeft: "1px solid #e5e7eb", minHeight: 0 }}>
        <RightPanelTabs />
      </div>
    </div>
  );
}