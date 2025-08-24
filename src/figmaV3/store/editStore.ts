import { nanoid } from "nanoid";
import { getRegistry } from "../core/registry";
import type { EditorState, NodeAny, NodesMap, StyleBase, ComponentDefinition } from "../core/types";

type Listener = () => void;

function deepClone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}
function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split(".");
    let cur: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i += 1) {
        const p = parts[i];
        const next = cur[p];
        if (!next || typeof next !== "object") cur[p] = (cur = {});
        else cur = next as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = value as unknown;
}

class EditorStore {
    private state: EditorState;
    private listeners = new Set<Listener>();

    constructor() {
        const rootId = nanoid(10);
        const root: NodeAny = {
            id: rootId,
            componentId: "box",
            props: {},
            styles: { element: { display: "flex", flexDirection: "column", width: 640, minHeight: 480 } },
            children: [],
        };
        this.state = {
            project: {
                pages: [{ id: "page-1", title: "Page 1", rootId }],
                currentPageId: "page-1",
                nodes: { [rootId]: root },
            },
            selection: { selectedId: rootId },
            data: {},
            settings: { canvasWidth: 640, dockRight: false },
            enableActions: true,
        };
    }

    subscribe(fn: Listener): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    getState(): EditorState {
        return this.state;
    }
    update(mutator: (draft: EditorState) => void): void {
        const draft = deepClone(this.state);
        mutator(draft);
        this.state = draft;
        for (const l of this.listeners) l();
    }

    select(id: string | null): void {
        this.update((s) => {
            s.selection.selectedId = id;
        });
    }

    patchProps(id: string, path: string, value: unknown): void {
        this.update((s) => {
            const n = s.project.nodes[id];
            if (!n) return;
            const next = deepClone(n.props) as Record<string, unknown>;
            setByPath(next, path, value);
            n.props = next;
        });
    }
    patchStyles(id: string, path: string, value: unknown): void {
        this.update((s) => {
            const n = s.project.nodes[id];
            if (!n) return;
            const base = (n.styles?.element ?? {}) as Record<string, unknown>;
            if (path.startsWith("element.")) {
                const key = path.slice("element.".length);
                setByPath(base, key, value);
            } else if (path === "element") {
                n.styles.element = value as Record<string, string | number | undefined>;
                return;
            }
            n.styles.element = base as Record<string, string | number | undefined>;
        });
    }

    addByDef(defId: string, parentId?: string): string {
        const reg = getRegistry();
        const def = reg.get(defId) as ComponentDefinition<Record<string, unknown>, StyleBase> | undefined;
        if (!def) throw new Error(`Unknown component: ${defId}`);

        const id = nanoid(10);
        const props = deepClone(def.defaults.props ?? {}) as Record<string, unknown>;
        const styles = deepClone(def.defaults.styles ?? {}) as StyleBase;

        this.update((s) => {
            const page = s.project.pages.find((p) => p.id === s.project.currentPageId) ?? s.project.pages[0];
            const pid = parentId ?? page.rootId;
            const map = s.project.nodes as NodesMap;
            map[id] = { id, componentId: def.id, props, styles, children: [] };
            map[pid].children = [...map[pid].children, id];
            s.selection.selectedId = id;
        });
        return id;
    }

    getParentOf(id: string): NodeAny | undefined {
        const nodes = this.state.project.nodes;
        for (const n of Object.values(nodes)) if (n.children.includes(id)) return n;
        return undefined;
    }
}

let _store: EditorStore | null = null;
export function getEditorStore(): EditorStore {
    if (!_store) _store = new EditorStore();
    return _store;
}
export type { EditorStore };