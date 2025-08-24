import React, { JSX } from "react";

import type { ComponentDefinition, StyleBase, Node as CoreNode } from "@/figmaV3/core/types";

export interface TextProps extends Record<string, unknown> {
  as?: "span" | "p" | "div";
  content?: string;
}

type NodeText = CoreNode<TextProps, StyleBase>;

export const TextDef: ComponentDefinition<TextProps, StyleBase> = {
  id: "text",
  title: "Text",
  defaults: {
    props: { as: "span", content: "Text" },
    styles: { element: { display: "inline", color: "#111827", fontSize: 14 } },
  },
  propsSchema: [
    {
      key: "as",
      type: "select",
      label: "As",
      options: [
        { label: "span", value: "span" },
        { label: "p", value: "p" },
        { label: "div", value: "div" },
      ],
      default: "span",
    },
    { key: "content", type: "text", label: "Text", placeholder: "Text", default: "Text" },
  ] as const,

  Render: ({ node }) => {
    const n = node as NodeText;
    const Tag = (n.props.as ?? "span") as keyof JSX.IntrinsicElements;
    const style = (n.styles.element ?? {}) as React.CSSProperties;
    const text = String(n.props.content ?? "Text");
    return <Tag style={style}>{text}</Tag>;
  },
};