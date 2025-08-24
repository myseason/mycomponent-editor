"use client";

import React, { useMemo } from "react";

import { getComponent } from "@/figmaV3/core/registry";
import type { PropField } from "@/figmaV3/core/types";
import { useEditor } from "@/figmaV3/editor/useEditor";

/** propsSchema → 간단 자동 폼(기본형). 조건부 노출 when 지원 */
const PropsAutoSection: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const { state, store } = useEditor();
  const node = state.project.nodes[nodeId];
  const def = getComponent(node.componentId);

  const fields = useMemo<PropField[]>(() => {
    return (def?.propsSchema ?? []) as PropField[];
  }, [def]);

  const get = (key: string): unknown => node.props?.[key];
  const set = (key: string, value: unknown): void => store.updateNodeProps(nodeId, { [key]: value });

  /** when: {key: value, ...} 조건과 현재 props가 모두 일치할 때만 노출 */
  const visibleFields = useMemo(() => {
    return fields.filter((f) => {
      if (!f.when) return true;
      const entries = Object.entries(f.when);
      for (const [k, val] of entries) {
        if (node.props?.[k] !== val) return false;
      }
      return true;
    });
  }, [fields, node.props]);

  if (visibleFields.length === 0) return <div style={{ color: "#6b7280" }}>정의된 속성이 없습니다.</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {visibleFields.map((f) => {
        const v = get(f.key);
        const label = f.label ?? f.key;

        switch (f.type) {
          case "text":
          case "url":
            return (
              <label key={f.key} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
                <input
                  type="text"
                  value={String(v ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.currentTarget.value)}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}
                />
              </label>
            );
          case "number":
            return (
              <label key={f.key} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
                <input
                  type="number"
                  value={Number(v ?? 0)}
                  onChange={(e) => set(f.key, Number(e.currentTarget.value))}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}
                />
              </label>
            );
          case "boolean":
            return (
              <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={Boolean(v)}
                  onChange={(e) => set(f.key, e.currentTarget.checked)}
                />
                <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
              </label>
            );
          case "select":
            return (
              <label key={f.key} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
                <select
                  value={String(v ?? (f.options?.[0]?.value ?? ""))}
                  onChange={(e) => set(f.key, e.currentTarget.value)}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}
                >
                  {(f.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            );
          case "textarea":
            return (
              <label key={f.key} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
                <textarea
                  value={String(v ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.currentTarget.value)}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px", minHeight: 72 }}
                />
              </label>
            );
          default:
            return (
              <div key={f.key} style={{ color: "#6b7280" }}>
                지원하지 않는 타입: {f.type}
              </div>
            );
        }
      })}
    </div>
  );
};

export default PropsAutoSection;