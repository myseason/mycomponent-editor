"use client";

import React from "react";

import { listAllComponents } from "@/figmaV3/core/registry";
import { useEditor } from "@/figmaV3/editor/useEditor";

const Palette: React.FC = () => {
  const { store } = useEditor();
  const items = listAllComponents();

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Palette</div>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((def) => (
          <button
            key={def.id}
            type="button"
            style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", textAlign: "left" }}
            onClick={() => store.addByDef(def.id)}
          >
            {def.title}
          </button>
        ))}
      </div>
    </div>
  );
};
export default Palette;