import { useSyncExternalStore } from "react";
import { getEditorStore } from "@/figmaV3/store/editStore";
import type { EditorStore } from "@/figmaV3/store/editStore";
import { EditorState } from "@/figmaV3/core/types";

export function useEditor(): { state: EditorState; store: EditorStore } {
    const store = getEditorStore();
    const state = useSyncExternalStore(
        (fn) => store.subscribe(fn),
        () => store.getState(),
        () => store.getState() // SSR snapshot
    );
    return { state, store };
}