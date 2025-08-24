import React from "react";

/** ──────────────────────────────────────────────────────────────────────────
 *  CSS / 스타일
 *  - CSSDict는 element 스타일에 사용하는 key-value 딕셔너리
 *  - 값은 string | number | undefined (px 등 단위는 호출부에서 일관되게)
 *  ───────────────────────────────────────────────────────────────────────── */
export type CSSValue = string | number | undefined;
export type CSSDict = Record<string, CSSValue>;

export interface StyleBase {
  /** 실제 DOM 엘리먼트에 바로 바인딩되는 스타일 */
  element?: CSSDict;
}

/** ──────────────────────────────────────────────────────────────────────────
 *  Node / Project / EditorState
 *  ───────────────────────────────────────────────────────────────────────── */
export interface Node<P extends Record<string, unknown>, S = StyleBase> {
  id: string;
  componentId: string;
  props: P;
  styles: S;
  children: string[];
  flags?: { locked?: boolean };
}
export type NodeAny = Node<Record<string, unknown>, StyleBase>;

export interface Page {
  id: string;
  name: string;
  rootId: string;
}

export interface Project {
  pages: Page[];
  nodes: Record<string, NodeAny>;
  settings?: {
    canvasWidth?: number; // 에디터 캔버스 너비
  } & Record<string, unknown>;
}

/** 에디터 화면(프로젝트) 상태 */
export interface ProjectState {
  project: Project;
  currentPageId: string | null;
}

// ─────────────────────────────────────────────────────────────
// EditorState: 전역 에디터 상태 (V3 공식)
// - project: 루트/노드 맵
// - ui: 선택 상태 등(필요 시 확장)
// - data: 전역 데이터 바인딩 저장소 ({{data.x}})
// - settings: 캔버스/실행 토글 등 에디터 설정
// ─────────────────────────────────────────────────────────────
export interface EditorState {
  project: {
    /** 현재 페이지(또는 루트 컨테이너)의 루트 노드 ID */
    rootId: string;
    /** 모든 노드 맵 (id -> node) */
    nodes: Record<string, NodeAny>;
  };
  ui: {
    /** 현재 선택된 노드 ID (없으면 null) */
    selectedId: string | null;
    // 필요 시: hoverId, outlineVisible 등 확장 필드 추가
  };
  /** 전역 데이터 바인딩 저장소 */
  data: Record<string, unknown>;

  /** 에디터 설정(선택사항) */
  settings?: {
    /** 캔버스 폭(px). 없으면 640으로 렌더에서 기본 적용 */
    canvasWidth?: number;
    /** 액션 실행 허용 여부 */
    enableActions?: boolean;
    /** 레이아웃 도킹 등 향후 확장용 */
    dockRight?: boolean;
  };
}

/** ──────────────────────────────────────────────────────────────────────────
 *  컴포넌트 정의(표준)
 *  ───────────────────────────────────────────────────────────────────────── */
export type SupportedEvent = "onClick" | "onChange" | "onSubmit";

/** Props 자동 렌더링을 위한 스키마(Inspector용) */
export type PropFieldType = "text" | "textarea" | "select" | "number" | "boolean" | "url";

export interface PropOption {
  label: string;
  value: string;
}

export interface PropField {
  key: string;
  type: PropFieldType;
  label?: string;
  placeholder?: string;
  options?: PropOption[];
  default?: unknown;
  /** 특정 props 상태일 때만 노출하고 싶을 때 */
  when?: Record<string, unknown>;
}
/* 컴포넌트 타입별 설정 가능 속성 정의 */
export type PropsSchema = readonly PropField[];

/* 컴포넌트 정의 */
export interface ComponentDefinitionBase {
  id: string;           // registry key
  title: string;        // Palette/Layers 노출명
  defaults: {
    props?: Record<string, unknown>;
    styles?: StyleBase;
  };
  /** Inspector 자동 생성용(있으면 PropsAutoSection에서 사용) */
  propsSchema?: PropsSchema;

  Render(args: {
    node: NodeAny;
    fire?: (e: SupportedEvent) => void;
  }): React.ReactElement | null;
}

export interface ComponentDefinition<P extends Record<string, unknown>, S = StyleBase>
  extends ComponentDefinitionBase {
  Render(args: {
    node: Node<P, S> | NodeAny;
    fire?: (e: SupportedEvent) => void;
  }): React.ReactElement | null;
}

/** ──────────────────────────────────────────────────────────────────────────
 *  Actions (런타임 표준)
 *  ───────────────────────────────────────────────────────────────────────── */
export type ActionStep =
  | { kind: "Alert";   message: string }
  | { kind: "OpenUrl"; url: string; target?: "_blank" | "_self" }
  | { kind: "SetData"; path: string; value: unknown };

export interface ActionSpec { steps: ActionStep[]; }

/** ──────────────────────────────────────────────────────────────────────────
 *  Data Binding
 *  ───────────────────────────────────────────────────────────────────────── */
export interface BindingScope {
  /** 전역/페이지/컴포넌트 데이터 */
  data: Record<string, unknown>;
  /** 프로젝트 설정 등 */
  settings?: Record<string, unknown>;
  /** 평가 대상 노드 자신 */
  node: NodeAny;
  /** 루트 노드 (없을 수도 있음) */
  root: NodeAny | null;
}