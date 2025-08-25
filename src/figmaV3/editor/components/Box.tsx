"use client";

import React, {JSX} from 'react';
import { NodeAny } from '@/figmaV3/core/types';
import { getComponent } from '@/figmaV3/core/registry';

export const BoxDef = {
    id: 'box',
    title: 'Box',
    defaults: {
        props: { as: 'div' },
        styles: { element: { display: 'flex', flexDirection: 'column', gap: 12, minHeight: 100, padding: 12 } }
    },
    propsSchema: [
        { key: 'as', type: 'select', label: 'As', default: 'div', options: [
                { label: 'div', value: 'div' },
                { label: 'section', value: 'section' },
                { label: 'article', value: 'article' },
            ]},
    ],
    Render({ node }: { node: NodeAny }) {
        const Tag = (node.props.as as keyof JSX.IntrinsicElements) ?? 'div';
        const style = (node.styles.element ?? {}) as React.CSSProperties;
        const nodes = (window as unknown as { __editorNodes?: Record<string, NodeAny> }).__editorNodes ?? {};

        return (
            <Tag style={style}>
                {/* 자식순회: 반드시 여기서 그려줍니다 */}
                {node.children.map((cid) => {
                    const child = nodes[cid];
                    if (!child)
                        return null;

                    const def = getComponent(child.componentId);
                    if (!def)
                        return null;

                    return <React.Fragment key={cid}>{def.Render({ node: child })}</React.Fragment>;
                })}
            </Tag>
        );
    },
} as const;