"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useEditor } from "@/figmaV3/editor/useEditor";
import {ActionStep, SupportedEvent, NodeAny, BindingScope} from "@/figmaV3/core/types";
import { getSteps, runActions } from "@/figmaV3/runtime/actions";

const EVENTS: SupportedEvent[] = ["onClick", "onChange", "onSubmit"];

function useActionsAccess(node: NodeAny | null) {
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
                if ("updateNodeProps" in store) {
                    (store as unknown as {
                        updateNodeProps: (id: string, patch: Record<string, unknown>) => void;
                    }).updateNodeProps(nodeId, propsPatch);
                } else if ("patchNode" in store) {
                    (store as unknown as {
                        patchNode: (id: string, patch: Partial<NodeAny>) => void;
                    }).patchNode(nodeId, {
                        props: { ...(node.props ?? {}), ...propsPatch } as Record<string, unknown>,
                    });
                } else if ("update" in store) {
                    (store as unknown as { update: (fn: (s: unknown) => void) => void }).update(
                        (s) => {
                            const typed = s as {
                                project: { nodes: Record<string, NodeAny> };
                            };
                            const target = typed.project.nodes[nodeId];
                            const nextProps = {
                                ...(target.props ?? {}),
                                ...propsPatch,
                            } as Record<string, unknown>;
                            typed.project.nodes[nodeId] = { ...target, props: nextProps };
                        }
                    );
                } else {
                    // eslint-disable-next-line no-console
                    console.error("[ActionsPanel] No mutation API on store");
                }
            };

            const curActs =
                ((node.props?.__actions as Record<string, unknown>) ?? {}) as Record<
                    string,
                    unknown
                >;
            const nextActs = { ...curActs, [evt]: steps };
            patchProps({ __actions: nextActs });
        },
        [node, store]
    );

    return { readSteps, writeSteps };
}

export default function ActionsPanel(): React.ReactElement {
    const { state } = useEditor();
    const selectedId = state.ui?.selectedId ?? null;

    const node: NodeAny | null = useMemo(() => {
        if (!selectedId) return null;
        const map = state.project?.nodes ?? {};
        return (map[selectedId] as NodeAny) ?? null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, state.project?.nodes]);

    const [eventKey, setEventKey] = useState<SupportedEvent>("onClick");
    const { readSteps, writeSteps } = useActionsAccess(node);

    const [alertMsg, setAlertMsg] = useState("Hello!");

    const steps = useMemo(() => readSteps(eventKey), [readSteps, eventKey]);

    const onAddAlert = useCallback(() => {
        const next: ActionStep[] = [...steps, { kind: "alert", message: alertMsg }];
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
        const scope = {
            data: state.data ?? {},
            settings: state.settings,
            node,
            //root: (state.project.nodes[state.project.rootId] as NodeAny | undefined) ?? null,
            root: state.project.nodes[state.project.rootId] as NodeAny,
        } as const;
        void runActions(node, eventKey, scope);
    }, [node, eventKey, state]);

    if (!node) {
        // 훅 순서 유지: return은 컴포넌트 최하단만
        return (
            <div style={{ padding: 12, color: "#6b7280" }}>선택된 컴포넌트가 없습니다.</div>
        );
    }

    return (
        <div style={{ display: "grid", gap: 12 }}>
            {/* 이벤트 선택 */}
            <div>
                <label style={{ fontSize: 12, color: "#374151" }}>Event</label>
                <select
                    value={eventKey}
                    onChange={(e) => setEventKey(e.currentTarget.value as SupportedEvent)}
                    style={{
                        width: "100%",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        padding: "6px 8px",
                    }}
                >
                    {EVENTS.map((ev) => (
                        <option key={ev} value={ev}>
                            {ev}
                        </option>
                    ))}
                </select>
            </div>

            {/* Alert 추가 */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                    value={alertMsg}
                    onChange={(e) => setAlertMsg(e.currentTarget.value)}
                    placeholder="message"
                    style={{
                        flex: 1,
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        padding: "6px 8px",
                    }}
                />
                <button
                    onClick={onAddAlert}
                    style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        padding: "6px 10px",
                        background: "#fff",
                        cursor: "pointer",
                    }}
                >
                    Add
                </button>
            </div>

            {/* 현재 스텝 목록 */}
            <div>
                <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
                    Steps
                </div>
                {steps.length === 0 ? (
                    <div style={{ color: "#6b7280" }}>등록된 스텝이 없습니다.</div>
                ) : (
                    <ul style={{ display: "grid", gap: 6, padding: 0, margin: 0 }}>
                        {steps.map((s, i) => (
                            <li
                                key={`${i}-${String((s as ActionStep).kind)}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 6,
                                    padding: "6px 8px",
                                    background: "#fff",
                                }}
                            >
                                <span style={{ fontFamily: "monospace" }}>{String(s.kind)}</span>
                                {String(s.kind).toLowerCase() === "alert" && (
                                    <span style={{ color: "#6b7280" }}>“{(s as any).message}”</span>
                                )}
                                <button
                                    onClick={() => onRemove(i)}
                                    style={{
                                        marginLeft: "auto",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 6,
                                        padding: "4px 8px",
                                        background: "#fff",
                                        cursor: "pointer",
                                    }}
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
                    onClick={onRun}
                    style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        padding: "6px 10px",
                        background: "#fff",
                        cursor: "pointer",
                    }}
                >
                    Run Now
                </button>
            </div>
        </div>
    );
}