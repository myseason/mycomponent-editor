/* V3 Core Types — SSOT
   - Node / Project / EditorState
   - ComponentDefinition (propsSchema 포함)
   - Actions (SupportedEvent / ActionStep / ActionSpec)
   - BindingScope
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

/** 헬퍼: any 노드 */
export type NodeAny = Node<Record<string, unknown>, StyleBase>;

/** 프로젝트(페이지 단일: V3) */
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
    data: Record<string, unknown>;
    settings: {
        canvasWidth: number;
        enableActions: boolean;
        dockRight: boolean;
    };
}

/** 액션 이벤트 종류 */
export type SupportedEvent = "onClick" | "onChange" | "onLoad" | "onSubmit";

/** 액션 스텝 베이스 */
export interface ActionStepBase {
    /** 에러 발생 시 다음 스텝 계속 여부 */
    continueOnError?: boolean;
    /** 스텝 타임아웃(ms) */
    timeoutMs?: number;
}

/** 액션 스텝 정의 */
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

/** propsSchema 항목 정의 */
export type PropSchemaItem =
    | {
    key: string;
    type: "text" | "number";
    label?: string;
    placeholder?: string;
    default?: unknown;
}
    | {
    key: string;
    type: "select";
    label?: string;
    options: Array<{ label: string; value: string }>;
    default?: string;
}
    | {
    key: string;
    type: "toggle";
    label?: string;
    default?: boolean;
};

/** 컴포넌트 정의 */
export interface ComponentDefinition<P extends Record<string, unknown> = Record<string, unknown>, S extends StyleBase = StyleBase> {
    id: string;
    title: string;
    defaults: {
        props: Partial<P>;
        styles: Partial<S>;
    };
    /** Inspector 자동화를 위한 스키마(선택) */
    propsSchema?: ReadonlyArray<PropSchemaItem>;
    /** 렌더러 */
    Render: (args: { node: Node<P, S>; fire?: (evt: SupportedEvent) => void }) => React.ReactElement | null;
    /** Capability 힌트(선택) */
    capabilities?: {
        isContainer?: boolean;
        isTextual?: boolean;
    };
}