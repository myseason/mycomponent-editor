import type { ComponentDefinition } from "./types";

const registry = new Map<string, ComponentDefinition>();

export function register(def: ComponentDefinition): void {
    registry.set(def.id, def);
}

export function getComponent(id: string): ComponentDefinition | undefined {
    return registry.get(id);
}

export function listAll(): ComponentDefinition[] {
    return Array.from(registry.values());
}

/** 선택: 자동 등록 헬퍼 (컴포넌트 파일에서 호출) */
export function autoRegister(defs: ComponentDefinition | ComponentDefinition[]): void {
    const arr = Array.isArray(defs) ? defs : [defs];
    arr.forEach(register);
}