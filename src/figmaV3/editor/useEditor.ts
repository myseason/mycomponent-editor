"use client";

import { useSyncExternalStore, useMemo } from "react";
import type { EditorState } from "@/figmaV3/core/types";
import { getEditorStore } from "@/figmaV3/store/editStore";

/**
 * V3 표준 훅:
 * - SSR 안전: getServerSnapshot 제공
 * - 셀렉터 패턴: 파생 값은 useMemo로 파생
 */
export function useEditor() {
    const store = getEditorStore();

    const state = useSyncExternalStore<EditorState>(
        store.subscribe,
        store.getState,
        // 서버 스냅샷: 초기 상태와 동일하게
        store.getState
    );

    // 선택 ID(없을 수도 있음) 안전 파생
    const selectedId = useMemo(
        () => (state.ui?.selectedId ?? null),
        [state.ui?.selectedId]
    );

    return { state, store, selectedId };
}