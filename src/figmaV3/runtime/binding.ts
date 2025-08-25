// src/figmaV3/runtime/binding.ts
import type { BindingScope } from "@/figmaV3/core/types";

/**
 * 간단한 머스태치 {{ path }} 치환기
 * - data/settings/node/root 를 스코프 루트로 하여 점 표기 경로를 찾아 문자열로 치환합니다.
 * - 존재하지 않으면 빈 문자열로 치환 (필요 시 정책 변경 가능)
 */
const MUSTACHE = /\{\{\s*([^}]+?)\s*\}\}/g;

function readPath(scope: BindingScope, path: string): unknown {
    // 허용 루트 키워드: data / settings / node / root
    // "data.user.name" → scope.data?.user?.name
    const [head, ...rest] = path.split(".");
    const root = (scope as unknown as Record<string, unknown>)[head] as unknown;
    if (root == null) return undefined;

    let cur: unknown = root;
    for (const seg of rest) {
        if (cur == null || typeof cur !== "object") return undefined;
        cur = (cur as Record<string, unknown>)[seg];
    }
    return cur;
}

function interpolate(input: string, scope: BindingScope): string {
    return input.replace(MUSTACHE, (_m, expr) => {
        const v = readPath(scope, String(expr).trim());
        // undefined/null 은 빈 문자열, 나머지는 문자열화
        return v == null ? "" : String(v);
    });
}

/**
 * ✅ 호환용: 과거 코드들이 쓰던 단일 문자열 템플릿 평가 API
 * - 예: evalTemplate("Hello {{data.user}}", scope) → "Hello Mina"
 */
export function evalTemplate(str: string, scope: BindingScope): string {
    return interpolate(str, scope);
}

/**
 * ✅ 객체 props 전체에 대해 템플릿 치환을 적용
 * - 문자열은 머스태치 치환, 배열/객체는 재귀 순회, 그 외는 그대로 유지
 * - 반환 타입은 제네릭 P를 유지하여 사용처 타입 안정성 보장
 */
export function getBoundProps<P extends Record<string, unknown>>(
    props: P,
    scope: BindingScope
): P {
    const walk = (val: unknown): unknown => {
        if (typeof val === "string") return interpolate(val, scope);
        if (Array.isArray(val)) return val.map(walk);
        if (val && typeof val === "object") {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
                out[k] = walk(v);
            }
            return out;
        }
        return val;
    };
    // 깊은 복사 + 변환
    const result = walk(props) as P;
    return result;
}