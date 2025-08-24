import type { ComponentDefinitionBase } from "./types";

/**
 * 컴포넌트 레지스트리(런타임 전역)
 * - 등록/조회/목록
 */
const REGISTRY = new Map<string, ComponentDefinitionBase>();

export function registerComponent(def: ComponentDefinitionBase): void {
  REGISTRY.set(def.id, def);
}

export function getComponent(id: string): ComponentDefinitionBase | undefined {
  return REGISTRY.get(id);
}

export function listAllComponents(): ComponentDefinitionBase[] {
  return Array.from(REGISTRY.values());
}

export function clearRegistry(): void {
  REGISTRY.clear();
}