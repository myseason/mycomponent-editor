"use client";

import { useSyncExternalStore } from "react";

import type { EditorState } from "@/figmaV3/core/types";
import { getEditorStore } from "@/figmaV3/store/editStore";
import type { EditorStore } from "@/figmaV3/store/editStore";

/** 표준 훅: 항상 동일 시그니처로 제공 */
export function useEditor(): { state: EditorState; store: EditorStore } {
  const store = getEditorStore();
  const state = useSyncExternalStore(
    (fn) => store.subscribe(fn),
    () => store.getState(),
    () => store.getState()
  );
  return { state, store };
}