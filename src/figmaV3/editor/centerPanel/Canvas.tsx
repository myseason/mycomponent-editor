"use client";

/* ------------------------------------------------------------
   Canvas.tsx (V3)
   - 훅 규칙 준수: 훅 호출 후 마지막에만 return 분기
   - 데이터 바인딩: def.Render 직전 node.props 바인딩 적용
   - 액션: fire 콜백으로 컴포넌트 내부에서 runActions 트리거
------------------------------------------------------------ */

import React, {JSX, useCallback, useMemo} from "react";

import { getComponent } from "@/figmaV3/core/registry";
import type { EditorState, NodeAny } from "@/figmaV3/core/types";
import { useEditor } from "@/figmaV3/editor/useEditor";
import { runActions, type SupportedEvent } from "@/figmaV3/runtime/actions";
import { getBoundProps, type BindingScope } from "@/figmaV3/runtime/binding";

/** 캔버스 폭 선택(설정 없으면 640) */
function selectCanvasWidth(state: EditorState): number {
  const w = state.settings?.canvasWidth;
  return typeof w === "number" && Number.isFinite(w) ? w : 640;
}

type NodesMap = Record<string, NodeAny>;

/** 단일 노드 렌더러 (훅은 항상 호출, return은 마지막에 한 번만) */
function NodeView(props: {
  id: string;
  nodesMap: NodesMap;
  state: EditorState;
}): JSX.Element | null {
  const { id, nodesMap, state } = props;

  // 입력값 준비(훅 앞에서만 "값 계산"은 자유지만, return은 금지)
  const node: NodeAny | null = nodesMap[id] ?? null;
  const def = node ? getComponent(node.componentId) : null;

  // 데이터 바인딩 스코프(항상 훅 호출)
  const scope: BindingScope = useMemo(
    () => ({
      data: state.data ?? {},
      props: (node?.props ?? {}) as Record<string, unknown>,
      settings: state.settings ?? {},
    }),
    [state.data, state.settings, node?.props]
  );

  // 바운딩된 props(항상 훅 호출)
  const boundProps = useMemo(
    () => getBoundProps((node?.props ?? {}) as Record<string, unknown>, scope),
    [node?.props, scope]
  );

  // 렌더용 노드(항상 훅 호출)
  const nodeForRender: NodeAny | null = useMemo(
    () => (node ? { ...node, props: boundProps } : null),
    [node, boundProps]
  );

  // 액션 실행기(항상 훅 호출)
  const fire = useCallback(
    (evt: SupportedEvent) => {
      if (state.settings?.enableActions === false) return;
      // 원본 노드 기준으로 액션 스캔(스펙 저장 위치: node.props.__actions)
      if (node) runActions(node, evt);
    },
    [node, state.settings?.enableActions]
  );

  // 🔚 최종 분기(훅 뒤에서 한 번만)
  if (!node || !def || typeof def.Render !== "function" || !nodeForRender) {
    return null;
  }

  return def.Render({ node: nodeForRender, fire });
}

/** 캔버스 컨테이너 */
export default function Canvas(): JSX.Element {
  const { state } = useEditor();
  const rootId = state.project.rootId;
  const nodesMap = state.project.nodes as NodesMap;

  const canvasWidth = selectCanvasWidth(state);

  // 루트가 없을 때는 안내 (useEditor 훅은 항상 호출되므로 훅 규칙 위반 아님)
  if (!rootId || !nodesMap[rootId]) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#9ca3af" }}>
        루트 컨테이너가 없습니다.
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflow: "auto",
        background: "#f3f4f6", // 옅은 회색
        display: "grid",
        justifyContent: "center",
        alignContent: "start",
      }}
    >
      <div
        style={{
          width: canvasWidth,
          minHeight: 600,
          background: "#ffffff",
          boxShadow: "0 0 0 1px #e5e7eb inset",
        }}
      >
        <NodeView id={rootId} nodesMap={nodesMap} state={state} />
      </div>
    </div>
  );
}