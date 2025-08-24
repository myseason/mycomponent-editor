import React, { JSX } from "react";

import type { ComponentDefinition, StyleBase, Node as CoreNode, SupportedEvent } from "@/figmaV3/core/types";

export interface ButtonProps extends Record<string, unknown> {
  as?: "button" | "a" | "div" | "span";
  content?: string;
  href?: string; // as === 'a' 일 때 사용
}

type NodeButton = CoreNode<ButtonProps, StyleBase>;

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
        borderRadius: 8,
        backgroundColor: "#3b82f6",
        color: "#fff",
        cursor: "pointer",
        userSelect: "none",
      },
    },
  },
  propsSchema: [
    {
      key: "as",
      type: "select",
      label: "As",
      options: [
        { label: "button", value: "button" },
        { label: "a", value: "a" },
        { label: "div", value: "div" },
        { label: "span", value: "span" },
      ],
      default: "button",
    },
    { key: "content", type: "text", label: "Text", placeholder: "Button", default: "Button" },
    { key: "href", type: "url", label: "Href", placeholder: "https://", when: { as: "a" } },
  ] as const,

  Render: ({ node, fire }) => {
    const n = node as NodeButton;
    const tag = (n.props.as ?? "button");

    const style = (n.styles.element ?? {}) as React.CSSProperties;
    const text = String(n.props.content ?? "Button");

    const onClick = (): void => { fire?.("onClick" as SupportedEvent); };

    if (tag === "a") {
      const href = n.props.href ? String(n.props.href) : "#";
      return (
        <a href={href} style={style} onClick={onClick}>
          {text}
        </a>
      );
    }

    const Tag = tag as keyof JSX.IntrinsicElements;
    return (
      <Tag style={style} onClick={onClick}>
        {text}
      </Tag>
    );
  },
};