import type { BindingScope } from "../core/types";

/** 간단 템플릿/표현식 평가: "Hello {{data.user}}" 또는 "data.user" */
export function evaluate(expr: string, scope: BindingScope): unknown {
    // 단순 dot-path 접근
    const getPath = (path: string): unknown => {
        const parts = path.split(".");
        let cur: unknown = scope as unknown;
        for (const p of parts) {
            if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
                cur = (cur as Record<string, unknown>)[p];
            } else return undefined;
        }
        return cur;
    };

    if (expr.includes("{{")) {
        // 템플릿
        return expr.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, g1: string) => String(getPath(g1.trim()) ?? ""));
    }
    return getPath(expr);
}

export function getBoundProps(
    props: Record<string, unknown>,
    scope: BindingScope,
    bindings?: Array<{ prop: string; expr: string }>
): Record<string, unknown> {
    if (!bindings || bindings.length === 0) return props;
    const out: Record<string, unknown> = { ...props };
    for (const b of bindings) {
        out[b.prop] = evaluate(b.expr, scope);
    }
    return out;
}