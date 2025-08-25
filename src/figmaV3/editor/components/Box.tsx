import React, {JSX} from "react";
import type { ComponentDefinition, StyleBase, Node as CoreNode, PropField } from "@/figmaV3/core/types";

/** Box 컴포넌트 Props */
export interface BoxProps extends Record<string, unknown> {
    as?: "div" | "section" | "article";
}

type NodeBox = CoreNode<BoxProps, StyleBase>;

/** propsSchema — as select */
const propsSchema: ReadonlyArray<PropField> = [
    {
        key: "as",
        type: "select",
        label: "As",
        options: [
            { label: "div", value: "div" },
            { label: "section", value: "section" },
            { label: "article", value: "article" },
        ] as const,
        default: "div",
    },
];

export const BoxDef: ComponentDefinition<BoxProps, StyleBase> = {
    id: "box",
    title: "Box",
    defaults: {
        props: { as: "div" },
        styles: {
            element: {
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 100,
                padding: 12,
                backgroundColor: "#ffffff",
            },
        },
    },
    propsSchema,
    capabilities: { isContainer: true },
    Render: ({ node }) => {
        const n = node as NodeBox;
        const Tag = (n.props.as ?? "div") as keyof JSX.IntrinsicElements;
        const style = (n.styles.element ?? {}) as React.CSSProperties;
        return <Tag style={style} />;
    },
};