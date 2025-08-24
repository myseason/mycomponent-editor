"use client";

import React, { JSX, useCallback, useMemo, useState } from "react";

import { useEditor } from "@/figmaV3/editor/useEditor";

type DataMap = Record<string, unknown>;
type EditorStateWithData = { data?: DataMap };

/** 문자열을 적절히 파싱(숫자/불리언/JSON) */
function smartParse(input: string): unknown {
  const s = input.trim();
  if (s === "")
    return "";

  if (s === "true")
    return true;

  if (s === "false")
    return false;

  if (!Number.isNaN(Number(s)) && /^-?\d+(\.\d+)?$/.test(s))
    return Number(s);
  // JSON 객체/배열 시도
  if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
    try { return JSON.parse(s); } catch { /* fallthrough */ }
  }
  return s; // 기본: 문자열
}

export default function DataPanel(): JSX.Element {
  const { state, store } = useEditor();

  // 전역 data 맵
  const dataMap: DataMap = useMemo(() => {
    const slice = (state as unknown as EditorStateWithData).data ?? {};
    return slice;
  }, [state]);

  // 신규 추가 폼 상태
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  // 편집 중 값(키: 문자열 값)
  const [edits, setEdits] = useState<Record<string, string>>({});

  const onAdd = useCallback(() => {
    const k = newKey.trim();
    if (!k) return;
    const v = smartParse(newVal);

    // store.update 로 전역 data 갱신
    if ("update" in store) {
      (store as unknown as { update: (fn: (s: EditorStateWithData & Record<string, unknown>) => void) => void })
        .update((s) => {
          const next = { ...(s.data ?? {}) };
          next[k] = v;
          s.data = next;
        });
    } else {
      // eslint-disable-next-line no-console
      console.error("[DataPanel] store.update API가 필요합니다.");
    }

    setNewKey("");
    setNewVal("");
  }, [newKey, newVal, store]);

  const onRemove = useCallback((k: string) => {
    if ("update" in store) {
      (store as unknown as { update: (fn: (s: EditorStateWithData & Record<string, unknown>) => void) => void })
        .update((s) => {
          const cur = s.data ?? {};
          const next: DataMap = {};
          for (const [kk, vv] of Object.entries(cur)) {
            if (kk !== k) next[kk] = vv;
          }
          s.data = next;
        });
    } else {
      // eslint-disable-next-line no-console
      console.error("[DataPanel] store.update API가 필요합니다.");
    }
    setEdits((prev) => {
      const cp = { ...prev }; delete cp[k]; return cp;
    });
  }, [store]);

  const onChangeEdit = useCallback((k: string, text: string) => {
    setEdits((prev) => ({ ...prev, [k]: text }));
  }, []);

  const onPatch = useCallback((k: string) => {
    const text = edits[k] ?? "";
    const v = smartParse(text);
    if ("update" in store) {
      (store as unknown as { update: (fn: (s: EditorStateWithData & Record<string, unknown>) => void) => void })
        .update((s) => {
          const next = { ...(s.data ?? {}) };
          next[k] = v;
          s.data = next;
        });
    } else {
      // eslint-disable-next-line no-console
      console.error("[DataPanel] store.update API가 필요합니다.");
    }
  }, [edits, store]);

  // 키 목록(안정적 표기)
  const entries = useMemo(() => Object.entries(dataMap), [dataMap]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h3 style={{ fontSize: 12, color: "#374151", margin: 0 }}>Global Data</h3>

      {/* 추가 폼 */}
      <div style={{ display: "grid", gap: 6, padding: 8, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: "#374151" }}>Add</div>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 8 }}>
          <input
            type="text"
            placeholder="key (e.g. user)"
            value={newKey}
            onChange={(e) => setNewKey(e.currentTarget.value)}
            style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}
          />
          <input
            type="text"
            placeholder='value (e.g. "Mina")'
            value={newVal}
            onChange={(e) => setNewVal(e.currentTarget.value)}
            style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}
          />
          <button
            type="button"
            onClick={onAdd}
            style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", background: "#fff", cursor: "pointer" }}
          >
            Add
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
          값은 숫자/불리언/JSON도 자동 파싱됩니다. 예) <code>true</code>, <code>123</code>, <code>{"{ \"age\": 20 }"}</code>
        </p>
      </div>

      {/* 목록 */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 12, color: "#374151" }}>Entries</div>
        {entries.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>등록된 데이터가 없습니다.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {entries.map(([k, v]) => {
              const text = k in edits ? edits[k] : JSON.stringify(v);
              return (
                <li key={k} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto auto", gap: 8, alignItems: "center" }}>
                  <div title={k} style={{ fontSize: 12, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {k}
                  </div>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => onChangeEdit(k, e.currentTarget.value)}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 8px" }}
                  />
                  <button
                    type="button"
                    onClick={() => onPatch(k)}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", background: "#fff", cursor: "pointer" }}
                  >
                    Patch
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(k)}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", background: "#fff", cursor: "pointer" }}
                  >
                    삭제
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 도움말 */}
      <div style={{ fontSize: 11, color: "#6b7280" }}>
        Text 컴포넌트의 content에 <code>{"Hello {{data.user}}"}</code> 처럼 작성하면 전역 데이터로 치환됩니다.
      </div>
    </div>
  );
}