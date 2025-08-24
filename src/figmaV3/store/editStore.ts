"use client";

import { nanoid } from "nanoid";

import { getComponent } from "@/figmaV3/core/registry";
import type { EditorState, NodeAny, Project } from "@/figmaV3/core/types";

/** 외부구독 콜백 타입 */
type Listener = () => void;

/** 내부 유틸 */
function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** 최소 초기 프로젝트(루트 컨테이너 포함) */
function createInitialProject(): Project {
  const rootId = "root_" + nanoid(6);
  const pageId = "page_" + nanoid(6);
  const project: Project = {
    pages: [{ id: pageId, name: "Page 1", rootId }],
    nodes: {
      [rootId]: {
        id: rootId,
        componentId: "box",
        props: {},
        styles: { element: { display: "flex", flexDirection: "column", width: 640, minHeight: 600, backgroundColor: "#fff" } },
        children: [],
      },
    },
    settings: { canvasWidth: 640 },
  };
  return project;
}

/** 표준 Store 인터페이스 (확장/교체 가능하도록 노출) */
export interface EditorStore {
  /** 상태 접근/구독 */
  getState(): EditorState;
  subscribe(fn: Listener): () => void;

  /** 공통 갱신 */
  update(mutator: (s: EditorState) => void): void;

  /** 조회 */
  getRootId(): string | null;
  getParentOf(id: string): NodeAny | undefined;

  /** 선택 */
  select(id: string | null): void;

  /** 노드 추가/패치 */
  addByDef(defId: string, parentId?: string): string;
  patchNode(id: string, patch: Partial<NodeAny>): void;
  updateNodeProps(id: string, patch: Record<string, unknown>): void;

  /** 프로젝트 직렬화 */
  exportProject(): string;
  importProject(json: string): void;
}

/** 구현체 */
class EditorStoreImpl implements EditorStore {
  private state: EditorState;
  private listeners = new Set<Listener>();

  constructor() {
    const project = createInitialProject();
    this.state = {
      project,
      currentPageId: project.pages[0]?.id ?? null,
      selectedId: project.pages[0]?.rootId ?? null,
      ui: { selectedId: project.pages[0]?.rootId },
    };
  }

  getState(): EditorState { return this.state; }
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(): void { this.listeners.forEach((l) => l()); }

  update(mutator: (s: EditorState) => void): void { mutator(this.state); this.emit(); }

  select(id: string | null): void {
    this.update((s) => {
      s.selectedId = id;
      if (!s.ui) s.ui = {};
      s.ui.selectedId = id ?? undefined;
    });
  }

  getRootId(): string | null {
    const { project, currentPageId } = this.state;
    const page = currentPageId
      ? project.pages.find((p) => p.id === currentPageId)
      : project.pages[0];
    return page?.rootId ?? null;
  }

  getParentOf(id: string): NodeAny | undefined {
    const map = this.state.project.nodes;
    for (const n of Object.values(map)) {
      if (n.children?.includes(id)) return n;
    }
    return undefined;
  }

  addByDef(defId: string, parentId?: string): string {
    const def = getComponent(defId);
    if (!def) throw new Error(`Unknown component: ${defId}`);

    const id = nanoid(10);
    const props = deepClone(def.defaults.props ?? {});
    const styles = deepClone(def.defaults.styles ?? {});
    const node: NodeAny = { id, componentId: def.id, props, styles, children: [] };

    this.update((s) => {
      const pid = parentId ?? (this.getRootId() ?? "");
      const parent = s.project.nodes[pid];
      if (!parent) throw new Error("Parent not found");
      s.project.nodes[id] = node;
      parent.children.push(id);
      s.selectedId = id;
      if (!s.ui) s.ui = {};
      s.ui.selectedId = id;
    });
    return id;
  }

  patchNode(id: string, patch: Partial<NodeAny>): void {
    this.update((s) => {
      const n = s.project.nodes[id];
      if (!n) return;
      s.project.nodes[id] = { ...n, ...patch, styles: { ...n.styles, ...(patch.styles ?? {}) } };
    });
  }

  updateNodeProps(id: string, patch: Record<string, unknown>): void {
    this.update((s) => {
      const n = s.project.nodes[id];
      if (!n) return;
      n.props = { ...(n.props ?? {}), ...patch };
    });
  }

  exportProject(): string {
    return JSON.stringify({ project: this.state.project, currentPageId: this.state.currentPageId }, null, 2);
    // TODO: 스냅샷/히스토리 전략(undo/redo)은 별도 모듈에서
  }

  importProject(json: string): void {
    const parsed = JSON.parse(json) as { project: Project; currentPageId: string | null };
    this.update((s) => {
      s.project = parsed.project;
      s.currentPageId = parsed.currentPageId;
      s.selectedId = parsed.project.pages[0]?.rootId ?? null;
      s.ui = { selectedId: s.selectedId ?? undefined };
    });
  }
}

/** 싱글톤 팩토리 */
let _store: EditorStore | null = null;
export function getEditorStore(): EditorStore {
  if (!_store)
    _store = new EditorStoreImpl();
  return _store;
}