import type { ComponentDefinition, Node } from "@/figmaV3/core/types";

export interface TextProps {
    content: string;
}

export const Text: ComponentDefinition<TextProps, { element?: Record<string, string | number | undefined> }> = {
    id: "text",
    title: "Text",
    defaults: {
        props: { content: "Hello" },
        styles: { element: { fontSize: 14 } }
    },
    propsSchema: [
        { key: "content", type: "text", label: "Text", placeholder: "Text...", default: "Hello" }
    ],
    Render: ({ node }: { node: Node<TextProps> }) => {
        const style = node.styles.element as React.CSSProperties;
        return <span style={style}>{node.props.content}</span>;
    }
};