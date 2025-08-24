/**
 * Data binding helpers
 * - evalTemplate("Hello {{data.user}}", scope) -> "Hello Mina"
 * - getBoundProps: 문자열 props에 {{ }} 템플릿 평가
 */
import type { BindingScope } from "@/figmaV3/core/types";

/** {{ ... }} 플레이스홀더 평가 */
export function evalTemplate(input: string, scope: BindingScope): string {
    if (!input) return input;
    return input.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, expr) => {
        try {
            // eslint-disable-next-line no-new-func
            const fn = new Function("data", "settings", "node", "root", `return (${expr});`);
            const v = fn(scope.data, scope.settings ?? {}, scope.node, scope.root);
            return v == null ? "" : String(v);
        } catch {
            return "";
        }
    });
}

/** 문자열 props에 바인딩 적용 */
export function getBoundProps<T extends Record<string, unknown>>(raw: T, scope: BindingScope): T {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw ?? {})) {
        out[k] = typeof v === "string" ? evalTemplate(v, scope) : v;
    }
    return out as T;
}