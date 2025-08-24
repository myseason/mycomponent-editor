"use client";

import * as React from "react";
import { getEditorStore } from "@/figmaV3/store/editStore";

/** SSR 안전: server snapshot 인자 추가 */
export function useEditor() {
    const store = getEditorStore();
    const state = React.useSyncExternalStore(
        (fn) => store.subscribe(fn),
        () => store.getState(),
        () => store.getState()
    );
    return { state, store };
}