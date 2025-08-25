import React, {JSX} from "react";

import type { ComponentDefinition, StyleBase, Node as CoreNode, PropField, SupportedEvent } from "@/figmaV3/core/types";

export interface ButtonProps extends Record<string, unknown> {
    as?: "button" | "a" | "div" | "span";
    content?: string;
    href?: string; // as==="a" 일 때 사용
}

type NodeButton = CoreNode<ButtonProps, StyleBase>;

const propsSchema: ReadonlyArray<PropField> = [
    {
        key: "as",
        type: "select",
        label: "As",
        options: [
            { label: "button", value: "button" },
            { label: "a", value: "a" },
            { label: "div", value: "div" },
            { label: "span", value: "span" },
        ] as const,
        default: "button",
    },
    { key: "content", type: "text", label: "Text", placeholder: "Button", default: "Button" },
    { key: "href", type: "url", label: "Href", placeholder: "https://...", when: { as: "a" } },
];

export const ButtonDef: ComponentDefinition<ButtonProps, StyleBase> = {
    id: "button",
    title: "Button",
    defaults: {
        props: { as: "button", content: "Button" },
        styles: {
            element: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 12px",
                borderRadius: 6,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: 14,
                cursor: "pointer",
                userSelect: "none",
            },
        },
    },
    propsSchema,
    capabilities: { isTextual: true },
    Render: ({ node, fire }) => {
        const n = node as NodeButton;
        const Tag = (n.props.as ?? "button") as keyof JSX.IntrinsicElements;
        const style = (n.styles.element ?? {}) as React.CSSProperties;

        const handleClick = (): void => {
            if (typeof fire === "function") fire("onClick" as SupportedEvent);
        };

        if (n.props.as === "a") {
            const href = String(n.props.href ?? "#");
            return (
                <a href={href} style={style} onClick={handleClick}>
                    {String(n.props.content ?? "Button")}
                </a>
            );
        }
        return (
            <Tag style={style} onClick={handleClick}>
                {String(n.props.content ?? "Button")}
            </Tag>
        );
    },
};