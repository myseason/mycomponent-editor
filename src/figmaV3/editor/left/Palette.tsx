import { useEditor } from "../useEditor";
import { getRegistry } from "@/figmaV3/core/registry";
import {JSX} from "react";

export default function Palette(): JSX.Element {
    const { store } = useEditor();
    const defs = getRegistry().list();

    return (
        <div style={{ padding: 10, display: "grid", gap: 8 }}>
            {defs.map((d) => (
                <button
                    key={d.id}
                    type="button"
                    onClick={() => store.addByDef(d.id)}
                    style={{ textAlign: "left", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontSize: 12 }}
                >
                    + {d.title}
                </button>
            ))}
        </div>
    );
}