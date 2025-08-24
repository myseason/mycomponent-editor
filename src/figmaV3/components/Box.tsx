import type { ComponentDefinition, Node } from "@/figmaV3/core/types";

export interface BoxProps {
    as?: "div" | "section" | "main";
}

export const Box: ComponentDefinition<BoxProps, { element?: Record<string, string | number | undefined> }> = {
    id: "box",
    title: "Box",
    defaults: {
        props: { as: "div" },
        styles: { element: { display: "flex", flexDirection: "column", gap: 8 } }
    },
    propsSchema: [
        { key: "as", type: "select", label: "As", options: [
                { label: "div", value: "div" },
                { label: "section", value: "section" },
                { label: "main", value: "main" }
            ], default: "div" }
    ],
    Render: ({ node }: { node: Node<BoxProps> }) => {
        const Tag = (node.props.as ?? "div") as keyof JSX.IntrinsicElements;
        const style = node.styles.element as React.CSSProperties;
        return <Tag style={style}>{/* children은 추후 재귀 렌더에서 */}</Tag>;
    }
};