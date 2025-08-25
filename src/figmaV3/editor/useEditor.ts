"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { EditorState } from "@/figmaV3/core/types";
import { getEditorStore } from "@/figmaV3/store/editStore";

export function useEditor() {
    const store = getEditorStore();

    // SSR 안전: serverSnapshot 제공(초기 상태)
    const state: EditorState = useSyncExternalStore(
        store.subscribe,
        store.getState,
        store.getState
    );

    const selectedId = useMemo(() => state.ui?.selectedId ?? null, [state.ui?.selectedId]);

    return { state, store, selectedId };
}