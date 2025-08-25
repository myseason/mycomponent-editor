/* V3 Core Types — SSOT
 * - Node / Project / EditorState
 * - ComponentDefinition (propsSchema 포함)
 * - Actions (SupportedEvent / ActionStep / ActionSpec)
 * - BindingScope
 */
import type React from "react";

/** CSS 스타일 딕셔너리 */
export type CSSDict = Record<string, string | number | undefined>;

/** 모든 컴포넌트가 공유하는 스타일 베이스 */
export interface StyleBase {
    element?: CSSDict;
}

/** 노드(트리의 단위) */
export interface Node<P extends Record<string, unknown> = Record<string, unknown>, S extends StyleBase = StyleBase> {
    id: string;
    componentId: string;
    props: P;
    styles: S;
    children?: string[];
    locked?: boolean;
}

/** any 노드 헬퍼 */
export type NodeAny = Node<Record<string, unknown>, StyleBase>;

/** 프로젝트(단일 페이지) */
export interface Project {
    rootId: string;
    nodes: Record<string, NodeAny>;
}

/** UI 상태 */
export interface UIState {
    selectedId: string | null;
}

/** 에디터 전역 상태 */
export interface EditorState {
    project: Project;
    ui: UIState;
    /** 전역 데이터 바인딩용 */
    data: Record<string, unknown>;
    /** 에디터 설정 */
    settings: {
        canvasWidth: number;
        enableActions: boolean;
        dockRight: boolean;
    };
}

/* ───────────────────────── Actions ───────────────────────── */

export type SupportedEvent = "onClick" | "onChange" | "onLoad" | "onSubmit";

export interface ActionStepBase {
    /** 에러 발생 시 다음 스텝 계속 여부 */
    continueOnError?: boolean;
    /** 스텝 타임아웃(ms) */
    timeoutMs?: number;
}

export type ActionStep =
    | (ActionStepBase & { kind: "alert"; message: string })
    | (ActionStepBase & {
    kind: "http" | "https";
    method: "GET" | "POST" | "PUT" | "DELETE";
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
})
    | (ActionStepBase & { kind: "navigate" | "openurl"; href: string; target?: "_self" | "_blank" });

/** 액션 사양(이벤트별 스텝 집합) */
export interface ActionSpec {
    steps: ActionStep[];
}

/** 데이터 바인딩 스코프 */
export interface BindingScope {
    data: Record<string, unknown>;
    settings: EditorState["settings"];
    node?: NodeAny;
    root: NodeAny;
}

/* ────────────────────── propsSchema(Inspector 자동화) ────────────────────── */

export type PropField =
    | {
    key: string;
    type: "text" | "textarea" | "url";
    label?: string;
    placeholder?: string;
    default?: string;
    /** 조건부 노출: props의 특정 값들과 일치해야 보임 */
    when?: Record<string, unknown>;
}
    | {
    key: string;
    type: "number";
    label?: string;
    placeholder?: string;
    default?: number;
    when?: Record<string, unknown>;
}
    | {
    key: string;
    type: "boolean";
    label?: string;
    default?: boolean;
    when?: Record<string, unknown>;
}
    | {
    key: string;
    type: "select";
    label?: string;
    /** ✅ ReadonlyArray 를 허용해 as const 와의 호환 보장 */
    options: ReadonlyArray<{ label: string; value: string }>;
    default?: string;
    when?: Record<string, unknown>;
};

/* ───────────────────────── Component Definition ───────────────────────── */

export interface ComponentDefinition<P extends Record<string, unknown> = Record<string, unknown>, S extends StyleBase = StyleBase> {
    id: string;
    title: string;

    defaults: {
        /** 초기 props (일부만 설정 가능) */
        props: Partial<P>;
        /** 초기 styles (일부만 설정 가능) */
        styles: Partial<S>;
    };

    /** Inspector 자동화를 위한 스키마(선택) */
    propsSchema?: ReadonlyArray<PropField>;

    /** 실제 렌더러 */
    Render: (args: { node: Node<P, S>; fire?: (evt: SupportedEvent) => void }) => React.ReactElement | null;

    /** Capability 힌트(선택) */
    capabilities?: {
        isContainer?: boolean;
        isTextual?: boolean;
    };
}