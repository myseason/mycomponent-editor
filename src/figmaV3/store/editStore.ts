import { nanoid } from "nanoid";
import type {
    EditorState, Node as NodeT, NodeAny, StyleBase,
    ComponentDefinition
} from "@/figmaV3/core/types";
import { getComponent } from "@/figmaV3/core/registry";

/**
 * V3 EditorStore
 * - subscribe / getState / update
 * - select
 * - addByDef / addByDefAt
 * - patchNode
 */
export interface EditorStore {
    subscribe(fn: () => void): () => void;
    getState(): EditorState;
    update(mutator: (draft: EditorState) => void): void;

    select(id: string | null): void;

    addByDef(defId: string, parentId?: string): string;
    addByDefAt(defId: string, parentId: string, index: number): string;

    patchNode<TP extends Record<string, unknown>, TS extends StyleBase>(
        id: string,
        patch: Partial<NodeT<TP, TS>>
    ): void;
}

// ─────────────────────────────────────────────────────────────
// 내부 상태
// ─────────────────────────────────────────────────────────────

// ✅ SSR 안정화를 위해 루트 ID는 고정 값 사용 (서버/클라 동일)
const rootId = "root";

const listeners = new Set<() => void>();

const initialState: EditorState = {
    project: {
        rootId,
        // ↑ 위에서 고정한 rootId를 그대로 사용
        nodes: {
            [rootId]: {
                id: rootId,
                componentId: "box",
                props: { as: "div" },
                styles: { element: { display: "flex", flexDirection: "column", gap: 8 } },
                children: []
            }
        }
    },
    ui: { selectedId: rootId },
    data: {},
    settings: { canvasWidth: 640, enableActions: true, dockRight: false }
};

let state: EditorState = initialState;

function emit() {
    for (const fn of Array.from(listeners)) {
        try { fn(); } catch { /* noop */ }
    }
}

export const editorStore: EditorStore = {
    subscribe(fn) {
        listeners.add(fn);
        return () => { listeners.delete(fn); };
    },
    getState() { return state; },
    update(mutator) {
        // 간단한 구조: 얕은 복제 기반의 불변 업데이트
        const draft: EditorState = JSON.parse(JSON.stringify(state));
        mutator(draft);
        state = draft;
        emit();
    },
    select(id) {
        this.update(s => { s.ui.selectedId = id; });
    },
    // store/editStore.ts 내에 존재하는 스토어 팩토리/메서드들 중 addByDef를 아래로 교체
    addByDef(defId: string, parentId?: string): string {
        const s = this.getState();

        // 1) 컴포넌트 정의
        const def = getComponent(defId);
        if (!def) throw new Error(`Unknown component: ${defId}`);

        // 2) 부모 결정: 명시 parentId > 현재 선택 노드 > 루트 노드
        const pid =
            parentId ??
            s.ui?.selectedId ??
            s.project?.rootId;

        if (!pid) throw new Error("No parent container (rootId/selectedId not set)");

        // 3) 새 노드 생성
        const id = crypto.randomUUID().slice(0, 10);
        const props = { ...(def.defaults?.props ?? {}) } as Record<string, unknown>;
        const styles = { ...(def.defaults?.styles ?? {}) } as StyleBase;

        const node: NodeAny = {
            id,
            componentId: def.id,
            props,
            styles,
            children: [],
        };

        // 4) 단일 업데이트 트랜잭션
        this.update((draft) => {
            // 노드 맵에 신규 노드 추가
            (draft.project.nodes as Record<string, NodeAny>)[id] = node;

            // 부모 자식 배열에 삽입
            const parent = draft.project.nodes[pid] as NodeAny | undefined;
            if (!parent) throw new Error(`Parent not found: ${pid}`);
            if (!Array.isArray(parent.children)) parent.children = [];
            parent.children.push(id);

            // 선택 전환
            if (!draft.ui) draft.ui = { selectedId: null };
            draft.ui.selectedId = id;
        });

        return id;
    },
    addByDefAt(defId, parentId, index) {
        const def = getComponent(defId) as ComponentDefinition<Record<string, unknown>, StyleBase> | undefined;
        if (!def) throw new Error(`Unknown component: ${defId}`);

        const id = nanoid(10);
        const props = { ...(def.defaults.props ?? {}) } as Record<string, unknown>;
        const styles = { ...(def.defaults.styles ?? {}) } as StyleBase;
        const node: NodeT<Record<string, unknown>, StyleBase> = { id, componentId: def.id, props, styles, children: [] };

        this.update(s => {
            (s.project.nodes as Record<string, NodeAny>)[id] = node as unknown as NodeAny;
            const parent = s.project.nodes[parentId] as NodeAny | undefined;
            if (!parent) throw new Error("Parent not found");
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
            const next = { ...cur };

            if (patch.props) next.props = { ...(cur.props ?? {}), ...(patch.props as Record<string, unknown>) };
            if (patch.styles) next.styles = { ...(cur.styles ?? {}), ...(patch.styles as StyleBase) };
            if (patch.children) next.children = (patch.children as string[]) ?? cur.children;

            map[id] = next as NodeAny;
        });
    }
};

export function getEditorStore(): EditorStore { return editorStore; }
export function getState(): EditorState { return editorStore.getState(); }