// src/figmaV3/core/registry.ts
import type { ComponentDefinition, StyleBase } from "./types";

/**
 * 레지스트리에 저장될 컴포넌트 정의의 표준 타입.
 * - 제네릭을 좁혀 두어(Record<string, unknown> / StyleBase) 모든 컴포넌트 정의가 구조적 타이핑으로 수용됩니다.
 * - 개별 컴포넌트는 P, S 제네릭을 더 구체적으로 가져도(예: ButtonProps) 구조가 맞으면 등록 가능합니다.
 */
type AnyDef = ComponentDefinition<Record<string, unknown>, StyleBase>;

/** 내부 저장소 */
const registry = new Map<string, AnyDef>();

/** 단일 등록 */
export function register(def: AnyDef): void {
    registry.set(def.id, def);
}

/** 여러 개 혹은 단일 자동 등록 헬퍼 */
export function autoRegister(defs: AnyDef | AnyDef[]): void {
    const arr = Array.isArray(defs) ? defs : [defs];
    for (const d of arr) registry.set(d.id, d);
}

/** 조회 */
export function getComponent(id: string): AnyDef | undefined {
    return registry.get(id);
}

/** 전체 나열 */
export function listAll(): AnyDef[] {
    return Array.from(registry.values());
}

/** 초기화(테스트/핫리로드용) */
export function clear(): void {
    registry.clear();
}

/* ──────────────────────────────────────────────────────────────
 *  ⛳️ 과거 코드 호환을 위한 별칭들
 *  - 기존 코드에 손대지 않고 동작하도록 alias를 제공합니다.
 *  - 추후 마이그레이션이 끝나면 아래 export를 제거해도 됩니다.
 * ────────────────────────────────────────────────────────────── */

/** 과거: registerComponent → 현재: register */
export const registerComponent = register;

/** 과거: listAllComponents → 현재: listAll */
export const listAllComponents = listAll;