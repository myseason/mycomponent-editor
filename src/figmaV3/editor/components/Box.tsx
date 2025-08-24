import React, { JSX } from "react";

import type { ComponentDefinition, StyleBase, Node as CoreNode } from "@/figmaV3/core/types";

export interface BoxProps extends Record<string, unknown> {
  as?: "div" | "section" | "article";
}

type NodeBox = CoreNode<BoxProps, StyleBase>;

export const BoxDef: ComponentDefinition<BoxProps, StyleBase> = {
  id: "box",
  title: "Box",
  defaults: {
    props: { as: "div" },
    styles: { element: { display: "flex", flexDirection: "column", gap: 8 } },
  },

  propsSchema: [
    { key: "as", type: "select", label: "As", options: [
        { label: "div", value: "div" },
        { label: "section", value: "section" },
        { label: "article", value: "article" },
      ], default: "div" },
  ] as const,

  Render: ({ node }) => {
    const n = node as NodeBox;
    const Tag = (n.props.as ?? "div") as keyof JSX.IntrinsicElements;
    const style = (n.styles.element ?? {}) as React.CSSProperties;
    return <Tag style={style} />;
  },
};