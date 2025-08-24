import {JSX} from "react";

export default function BottomDock(): JSX.Element {
    return (
        <div style={{ height: 160, borderTop: "1px solid #e5e7eb", padding: 8 }}>
            {/* TODO: Actions / Console / Network / State 탭 */}
            <div style={{ fontSize: 12, color: "#888" }}>Bottom Dock (TODO)</div>
        </div>
    );
}