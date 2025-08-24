"use client";

import React from "react";
import styles from "@/figmaV3/editor/css/editorLayout.module.css";
import LeftPanelTabs from "@/figmaV3/editor/leftPanel/LeftPanelTabs";
import RightPanelTabs from "@/figmaV3/editor/rightPanel/RightPanelTabs";
import Canvas from "@/figmaV3/editor/centerPanel/Canvas";

/**
 * 전체 에디터 레이아웃:
 *  - 좌: Palette/Layers 탭
 *  - 중: Canvas
 *  - 우: Inspector 탭
 * 그리드가 100vh를 꽉 채우며, 각 패널은 개별 스크롤을 가짐.
 */
export default function ComponentEditor() {
    return (
        <div className={styles.root}>
            <div className={styles.left}>
                <LeftPanelTabs />
            </div>

            <div className={styles.center}>
                <Canvas />
            </div>

            <div className={styles.right}>
                <RightPanelTabs />
            </div>
        </div>
    );
}