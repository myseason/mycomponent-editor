import type { ReactElement } from "react";

export type CSSDict = Record<string, string | number | undefined>;

export interface StyleBase {
    element?: CSSDict;
}

export interface BindingScope {
    data?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    props?: Record<string, unknown>;
}

export interface BindingSpec {
    prop: string;
    expr: string;
}

export type ActionStep =
    | { kind: "Alert"; message: string }
    | { kind: "OpenURL"; url: string; target?: "_blank" | "_self" }
    | { kind: "Delay"; ms: number }
    | { kind: "Toast"; message: string };

export interface LogicPack {
    actions?: Record<string, ActionStep[]>;
    bindings?: BindingSpec[];
}

export interface Node<P extends Record<string, unknown> = Record<string, unknown>, S extends StyleBase = StyleBase> {
    id: string;
    componentId: string;
    props: P;
    styles: S;
    children: string[];
    locked?: boolean;
    logic?: LogicPack;
}

export type NodesMap = Record<string, Node<Record<string, unknown>, StyleBase>>;
export type NodeAny = Node<Record<string, unknown>, StyleBase>;

export interface PageState {
    id: string;
    title: string;
    rootId: string;
}

export interface ProjectState {
    pages: PageState[];
    currentPageId: string | null;
    nodes: NodesMap;
}

export interface EditorState {
    project: ProjectState;
    selection: { selectedId: string | null };
    data: Record<string, unknown>;
    settings: Record<string, unknown>;
    enableActions: boolean;
}

export type SupportedEvent = string;
export type FireHandler = (evt: SupportedEvent) => void;

export interface ComponentDefinition<P extends Record<string, unknown>, S extends StyleBase> {
    id: string;
    title: string;
    defaults: { props: P; styles: S };
    propsSchema?: Array<
        | { key: keyof P & string; type: "text"; label?: string; placeholder?: string; default?: unknown }
        | { key: keyof P & string; type: "select"; label?: string; options: Array<{ label: string; value: string }>; default?: string }
    >;
    Render: (args: { node: Node<P, S>; fire?: FireHandler }) => ReactElement | null;
}

export interface RegistryReadonly {
    get(id: string): ComponentDefinition<Record<string, unknown>, StyleBase> | undefined;
    list(): Array<ComponentDefinition<Record<string, unknown>, StyleBase>>;
}