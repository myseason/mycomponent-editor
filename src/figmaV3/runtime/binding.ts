import type { BindingScope } from "@/figmaV3/core/types";

/** "{{ path.to.value }}" 템플릿 치환 */
const MUSTACHE = /\{\{\s*([^}]+)\s*\}\}/g;

function getByPath(obj: unknown, path: string): unknown {
    const segs = path.split(".").map(s => s.trim()).filter(Boolean);
    let cur: unknown = obj;
    for (const k of segs) {
        if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
            cur = (cur as Record<string, unknown>)[k];
        } else {
            return undefined;
        }
    }
    return cur;
}

/** 단일 문자열 치환 */
function interpolate(str: string, scope: BindingScope): string {
    return str.replace(MUSTACHE, (_, expr) => {
        const v =
            getByPath({ data: scope.data, settings: scope.settings, node: scope.node, root: scope.root }, expr) ??
            "";
        return String(v);
    });
}

/** props 객체에 바인딩 적용 (깊은 구조 보존) */
export function getBoundProps<P extends Record<string, unknown>>(props: P, scope: BindingScope): P {
    const walk = (v: unknown): unknown => {
        if (typeof v === "string") return interpolate(v, scope);
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === "object") {
            const out: Record<string, unknown> = {};
            for (const [k, vv] of Object.entries(v as Record<string, unknown>)) out[k] = walk(vv);
            return out;
        }
        return v;
    };
    return walk(props) as P;
}