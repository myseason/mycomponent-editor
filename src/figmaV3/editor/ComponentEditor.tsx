"use client";
import Canvas from "./centerPanel/Canvas";
import Palette from "./left/Palette";
import Layers from "./left/Layers";
import DataPanel from "./rightPanel/DataPanel";
import {JSX} from "react";

export default function ComponentEditor(): JSX.Element {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 320px", height: "100vh" }}>
            <div style={{ borderRight: "1px solid #e5e7eb", minHeight: 0, overflow: "auto" }}>
                <div style={{ padding: 10, fontWeight: 600 }}>Palette</div>
                <Palette />
                <div style={{ padding: 10, fontWeight: 600, marginTop: 8 }}>Layers</div>
                <Layers />
            </div>

            <div style={{ minHeight: 0 }}>
                <Canvas />
            </div>

            <div style={{ borderLeft: "1px solid #e5e7eb", minHeight: 0, overflow: "auto" }}>
                <div style={{ padding: 10, fontWeight: 600 }}>Data</div>
                <DataPanel />
            </div>
        </div>
    );
}