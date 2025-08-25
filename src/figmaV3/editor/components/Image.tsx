import React from "react";

import type { ComponentDefinition, StyleBase, Node as CoreNode, PropField } from "@/figmaV3/core/types";

export interface ImageProps extends Record<string, unknown> {
    src?: string;
    alt?: string;
    objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

type NodeImage = CoreNode<ImageProps, StyleBase>;

const propsSchema: ReadonlyArray<PropField> = [
    { key: "src", type: "url", label: "Source", placeholder: "https://..." },
    { key: "alt", type: "text", label: "Alt", placeholder: "description" },
    {
        key: "objectFit",
        type: "select",
        label: "Object Fit",
        options: [
            { label: "cover", value: "cover" },
            { label: "contain", value: "contain" },
            { label: "fill", value: "fill" },
            { label: "none", value: "none" },
            { label: "scale-down", value: "scale-down" },
        ] as const,
        default: "cover",
    },
];

export const ImageDef: ComponentDefinition<ImageProps, StyleBase> = {
    id: "image",
    title: "Image",
    defaults: {
        props: { src: "", alt: "" },
        styles: {
            element: {
                display: "inline-block",
                width: 120,
                height: 80,
                backgroundColor: "#e5e7eb",
                objectFit: "cover",
            },
        },
    },
    propsSchema,
    Render: ({ node }) => {
        const n = node as NodeImage;
        const style = (n.styles.element ?? {}) as React.CSSProperties;

        // props의 objectFit이 있으면 style 우선 반영
        if (n.props.objectFit) style.objectFit = n.props.objectFit;

        // ⚠️ 빈 문자열 src는 브라우저 경고 → undefined로 회피
        const src = n.props.src ? String(n.props.src) : undefined;
        const alt = String(n.props.alt ?? "");

        return <img src={src} alt={alt} style={style} />;
    },
};