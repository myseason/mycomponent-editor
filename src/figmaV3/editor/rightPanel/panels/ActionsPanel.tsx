"use client";

import React, { JSX, useCallback, useMemo, useState } from "react";

import { useEditor } from "@/figmaV3/editor/useEditor";
import type { ActionStep, SupportedEvent, NodeLight } from "@/figmaV3/runtime/actions";
import { getSteps, runActions } from "@/figmaV3/runtime/actions";

/** 지원 이벤트 (필요 시 확장) */
const EVENTS: SupportedEvent[] = ["onClick", "onChange", "onSubmit"];

/** 선택 노드의 __actions[event]에 접근/갱신하는 헬퍼 */
function useActionsAccess(node: NodeLight | null) {
  const { store } = useEditor();

  const readSteps = useCallback(
    (evt: SupportedEvent): ActionStep[] => {
      if (!node) return [];
      return getSteps(node, evt);
    },
    [node]
  );

  const writeSteps = useCallback(
    (evt: SupportedEvent, steps: ActionStep[]) => {
      if (!node) return;
      const nodeId = node.id;

      const patchProps = (propsPatch: Record<string, unknown>): void => {
        // 우선순위: updateNodeProps → patchNode → update
        if ("updateNodeProps" in store) {
          (store as unknown as { updateNodeProps: (id: string, patch: Record<string, unknown>) => void })
            .updateNodeProps(nodeId, propsPatch);
        } else if ("patchNode" in store) {
          (store as unknown as { patchNode: (id: string, patch: Partial<NodeLight>) => void })
            .patchNode(nodeId, { props: { ...(node.props ?? {}), ...propsPatch } });
        } else if ("update" in store) {
          (store as unknown as { update: (fn: (s: unknown) => void) => void }).update((s) => {
            const typed = s as {
              project: { nodes: Record<string, NodeLight> };
            };
            const target = typed.project.nodes[nodeId];
            const nextProps = { ...(target.props ?? {}), ...propsPatch };
            typed.project.nodes[nodeId] = { ...target, props: nextProps };
          });
        } else {

          console.error("[ActionsPanel] No mutation API on store");
        }
      };

      const curActs = (node.props?.__actions as Record<string, unknown> | undefined) ?? {};
      const nextActs = { ...curActs, [evt]: steps };
      patchProps({ __actions: nextActs });
    },
    [node, store]
  );

  return { readSteps, writeSteps };
}

export default function ActionsPanel(): JSX.Element {
  const { state } = useEditor();

  const selectedId =
    ((state as unknown as { ui?: { selectedId?: string | null } }).ui?.selectedId ?? null);

  const node: NodeLight | null = useMemo(() => {
    if (!selectedId) return null;
    const map = (state as unknown as { project: { nodes: Record<string, NodeLight> } }).project?.nodes ?? {};
    const found = map[selectedId];
    if (!found) return null;
    return found;
  }, [selectedId, state]);

  const [eventKey, setEventKey] = useState<SupportedEvent>("onClick");
  const { readSteps, writeSteps } = useActionsAccess(node);

  // UI 상태: Alert 폼 (간단)
  const [alertMsg, setAlertMsg] = useState<string>("Hello!");

  const steps = useMemo<ActionStep[]>(() => readSteps(eventKey), [readSteps, eventKey]);

  const onAddAlert = useCallback(() => {
    const next: ActionStep[] = [...steps, { kind: "Alert", message: alertMsg }];
    writeSteps(eventKey, next);
  }, [alertMsg, steps, writeSteps, eventKey]);

  const onRemove = useCallback(
    (idx: number) => {
      const next = steps.filter((_, i) => i !== idx);
      writeSteps(eventKey, next);
    },
    [steps, writeSteps, eventKey]
  );

  const onRun = useCallback(() => {
    if (!node) return;
    runActions(node, eventKey);
  }, [node, eventKey]);

  if (!node) {
    return <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>선택된 컴포넌트가 없습니다.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* 이벤트 선택 */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#374151" }}>Event</span>
        <select
          value={eventKey}
          onChange={(e) => setEventKey(e.currentTarget.value as SupportedEvent)}
          style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}
        >
          {EVENTS.map((ev) => (
            <option key={ev} value={ev}>{ev}</option>
          ))}
        </select>
      </label>

      {/* 추가 영역: Alert */}
      <div style={{ display: "grid", gap: 6, padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: "#374151" }}>Add Step</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6b7280", width: 56 }}>Alert</span>
          <input
            type="text"
            value={alertMsg}
            onChange={(e) => setAlertMsg(e.currentTarget.value)}
            placeholder="message"
            style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}
          />
          <button
            type="button"
            onClick={onAddAlert}
            style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", background: "#fff", cursor: "pointer" }}
          >
            Add
          </button>
        </div>
      </div>

      {/* 현재 스텝 목록 */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 12, color: "#374151" }}>Steps</div>
        {steps.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>등록된 스텝이 없습니다.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {steps.map((s, i) => (
              <li key={`${s.kind}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#111827", minWidth: 56 }}>{s.kind}</span>
                {s.kind === "Alert" && (
                  <span style={{ fontSize: 12, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    “{s.message}”
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 8px", background: "#fff", cursor: "pointer" }}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 테스트 실행 */}
      <div>
        <button
          type="button"
          onClick={onRun}
          style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", background: "#fff", cursor: "pointer" }}
        >
          Run Now
        </button>
      </div>
    </div>
  );
}