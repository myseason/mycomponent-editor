import type { ComponentDefinition, EditorState, NodeAny, StyleBase } from "@/figmaV3/core/types";
import { getComponent } from "@/figmaV3/core/registry";

export interface EditorStore {
    subscribe(fn: () => void): () => void;
    getState(): EditorState;
    update(mutator: (draft: EditorState) => void): void;
    select(id: string | null): void;
    addByDef(defId: string, parentId?: string): string;
    addByDefAt(defId: string, parentId: string, index: number): string;
    patchNode(id: string, patch: Partial<NodeAny>): void;
}

const listeners = new Set<() => void>();
const rootId = "root";

const initialState: EditorState = {
    project: {
        rootId,
        nodes: {
            [rootId]: {
                id: rootId,
                componentId: "box",
                props: { as: "div" },
                styles: { element: { display: "flex", flexDirection: "column", gap: 8 } },
                children: [],
            },
        },
    },
    ui: { selectedId: rootId },
    data: {},
    settings: { canvasWidth: 640, enableActions: true, dockRight: false },
};

let state: EditorState = initialState;

function emit(): void {
    Array.from(listeners).forEach(fn => {
        try { fn(); } catch { /* noop */ }
    });
}

export const editorStore: EditorStore = {
    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
    getState() { return state; },
    update(mutator) {
        // 간단한 불변 업데이트(깊은 복제)
        const draft: EditorState = JSON.parse(JSON.stringify(state));
        mutator(draft);
        state = draft;
        emit();
    },
    select(id) {
        this.update(s => { s.ui.selectedId = id; });
    },
    addByDef(defId, parentId) {
        const def = getComponent(defId) as ComponentDefinition | undefined;
        if (!def) throw new Error(`Unknown component: ${defId}`);

        const pid = parentId ?? state.ui.selectedId ?? state.project.rootId;
        if (!pid) throw new Error("No parent container");

        const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
            ? crypto.randomUUID().slice(0, 10)
            : Math.random().toString(36).slice(2, 12);

        const props = { ...(def.defaults.props ?? {}) } as Record<string, unknown>;
        const styles = { ...(def.defaults.styles ?? {}) } as StyleBase;

        const node: NodeAny = { id, componentId: def.id, props, styles, children: [] };

        this.update(s => {
            (s.project.nodes as Record<string, NodeAny>)[id] = node;
            const parent = s.project.nodes[pid];
            if (!parent) throw new Error(`Parent not found: ${pid}`);
            parent.children = parent.children ?? [];
            parent.children.push(id);
            s.ui.selectedId = id;
        });

        return id;
    },
    addByDefAt(defId, parentId, index) {
        const def = getComponent(defId) as ComponentDefinition | undefined;
        if (!def) throw new Error(`Unknown component: ${defId}`);

        const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
            ? crypto.randomUUID().slice(0, 10)
            : Math.random().toString(36).slice(2, 12);

        const props = { ...(def.defaults.props ?? {}) } as Record<string, unknown>;
        const styles = { ...(def.defaults.styles ?? {}) } as StyleBase;

        const node: NodeAny = { id, componentId: def.id, props, styles, children: [] };

        this.update(s => {
            (s.project.nodes as Record<string, NodeAny>)[id] = node;
            const parent = s.project.nodes[parentId];
            if (!parent) throw new Error(`Parent not found: ${parentId}`);
            const arr = parent.children ?? (parent.children = []);
            const i = Math.max(0, Math.min(index, arr.length));
            arr.splice(i, 0, id);
            s.ui.selectedId = id;
        });

        return id;
    },
    patchNode(id, patch) {
        this.update(s => {
            const map = s.project.nodes as Record<string, NodeAny>;
            const cur = map[id];
            if (!cur) return;

            const next: NodeAny = {
                ...cur,
                props: patch.props ? { ...(cur.props ?? {}), ...(patch.props as Record<string, unknown>) } : cur.props,
                styles: patch.styles ? { ...(cur.styles ?? {}), ...(patch.styles as StyleBase) } : cur.styles,
                children: patch.children ? (patch.children as string[]) : cur.children,
                locked: typeof patch.locked === "boolean" ? patch.locked : cur.locked,
            };
            map[id] = next;
        });
    },
};

export function getEditorStore(): EditorStore { return editorStore; }
export function getState(): EditorState { return editorStore.getState(); }