import React, {JSX, useCallback, useMemo, useState} from "react";
import { useEditor } from "../useEditor";

export default function DataPanel(): JSX.Element {
    const { state, store } = useEditor();
    const [k, setK] = useState("");
    const [v, setV] = useState("");

    const entries = useMemo(() => Object.entries(state.data ?? {}), [state.data]);

    const onAdd = useCallback(() => {
        if (!k) return;
        store.update((s) => {
            const next = { ...(s.data ?? {}) };
            next[k] = v;
            s.data = next;
        });
        setK(""); setV("");
    }, [k, v, store]);

    const onRemove = useCallback((key: string) => {
        store.update((s) => {
            const next = { ...(s.data ?? {}) };
            delete next[key];
            s.data = next;
        });
    }, [store]);

    return (
        <div style={{ padding: 12, display: "grid", gap: 8, fontSize: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6 }}>
                <input value={k} onChange={(e) => setK(e.currentTarget.value)} placeholder="key" style={{ border: "1px solid #ddd", borderRadius: 6, padding: "6px 8px" }} />
                <input value={v} onChange={(e) => setV(e.currentTarget.value)} placeholder="value" style={{ border: "1px solid #ddd", borderRadius: 6, padding: "6px 8px" }} />
                <button type="button" onClick={onAdd} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "6px 8px", background: "#fafafa" }}>Add</button>
            </div>

            {entries.length === 0 ? <div style={{ color: "#888" }}>No data</div> : entries.map(([key, val]) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, alignItems: "center" }}>
                    <div title={key} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</div>
                    <div title={String(val)} style={{ color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(val)}</div>
                    <button type="button" onClick={() => onRemove(key)} style={{ border: "1px solid #eee", borderRadius: 6, padding: "4px 8px", background: "#fff" }}>Delete</button>
                </div>
            ))}
        </div>
    );
}