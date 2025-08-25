import React, {JSX, useMemo} from "react";
import { useEditor } from "@/figmaV3/editor/useEditor";
import { getComponent } from "@/figmaV3/core/registry";
import type { NodeAny, PropField } from "@/figmaV3/core/types";

/** 공통 입력 스타일 (슬림) */
const inputS: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 13,
    width: "100%",
};

export default function PropsAutoSection({ nodeId }: { nodeId: string }): JSX.Element {
    const { state, store } = useEditor();

    const { node, fields } = useMemo(() => {
        const n = state.project.nodes[nodeId] as NodeAny | undefined;
        if (!n) return { node: undefined, fields: [] as PropField[] };
        const def = getComponent(n.componentId);
        const fs = (def?.propsSchema ?? []) as PropField[];
        return { node: n, fields: fs };
    }, [state.project.nodes, nodeId]);

    if (!node) {
        return <div style={{ padding: 8, color: "#9ca3af" }}>구성 요소 정보 없음</div>;
    }

    // ▶️ 레포 기준: editStore 에 patchNode 존재. props 수정은 patchNode 한 경로로만 처리.
    const patchProps = (patch: Record<string, unknown>): void => {
        (store as unknown as {
            patchNode: (id: string, patch: Partial<NodeAny>) => void;
        }).patchNode(nodeId, { props: { ...(node.props ?? {}), ...patch } });
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {fields.map((f) => {
                // 조건부 노출 (when)
                if (f.when && typeof f.when === "object") {
                    let visible = true;
                    for (const [k, v] of Object.entries(f.when)) {
                        if ((node.props as Record<string, unknown>)[k] !== v) {
                            visible = false;
                            break;
                        }
                    }
                    if (!visible) return null;
                }

                const val = (node.props as Record<string, unknown>)[f.key];

                switch (f.type) {
                    case "text":
                    case "url":
                    case "textarea": {
                        if (f.type === "textarea") {
                            return (
                                <div key={f.key} style={{ display: "grid", gap: 4 }}>
                                    {f.label && <label style={{ fontSize: 12, color: "#6b7280" }}>{f.label}</label>}
                                    <textarea
                                        style={{ ...inputS, minHeight: 60, resize: "vertical" }}
                                        placeholder={f.placeholder}
                                        value={String(val ?? "")}
                                        onChange={(e) => patchProps({ [f.key]: e.currentTarget.value })}
                                    />
                                </div>
                            );
                        }
                        return (
                            <div key={f.key} style={{ display: "grid", gap: 4 }}>
                                {f.label && <label style={{ fontSize: 12, color: "#6b7280" }}>{f.label}</label>}
                                <input
                                    type={f.type === "url" ? "url" : "text"}
                                    style={inputS}
                                    placeholder={f.placeholder}
                                    value={String(val ?? "")}
                                    onChange={(e) => patchProps({ [f.key]: e.currentTarget.value })}
                                />
                            </div>
                        );
                    }

                    case "number": {
                        return (
                            <div key={f.key} style={{ display: "grid", gap: 4 }}>
                                {f.label && <label style={{ fontSize: 12, color: "#6b7280" }}>{f.label}</label>}
                                <input
                                    type="number"
                                    style={inputS}
                                    placeholder={f.placeholder}
                                    value={Number.isFinite(val as number) ? String(val) : ""}
                                    onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        patchProps({ [f.key]: v === "" ? undefined : Number(v) });
                                    }}
                                />
                            </div>
                        );
                    }

                    case "boolean": {
                        const checked = Boolean(val);
                        return (
                            <label
                                key={f.key}
                                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => patchProps({ [f.key]: e.currentTarget.checked })}
                                />
                                {f.label ?? f.key}
                            </label>
                        );
                    }

                    case "select": {
                        // readonly 옵션 배열도 안전하게 다루도록 복사
                        const opts = [...f.options] as { label: string; value: string }[];
                        const cur = typeof val === "string" ? val : f.default ?? (opts[0]?.value ?? "");
                        return (
                            <div key={f.key} style={{ display: "grid", gap: 4 }}>
                                {f.label && <label style={{ fontSize: 12, color: "#6b7280" }}>{f.label}</label>}
                                <select
                                    style={inputS}
                                    value={cur}
                                    onChange={(e) => patchProps({ [f.key]: e.currentTarget.value })}
                                >
                                    {opts.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    }

                    default: {
                        // f가 never로 좁혀져도 안전하게 표시
                        type FieldBase = { key?: string; type?: string };
                        const fb = f as FieldBase;
                        return (
                            <div
                                key={String(fb.key ?? `unsupported-${Math.random().toString(36).slice(2)}`)}
                                style={{ color: "#6b7280" }}
                            >
                                지원하지 않는 타입: {String(fb.type ?? "unknown")}
                            </div>
                        );
                    }
                }
            })}
        </div>
    );
}