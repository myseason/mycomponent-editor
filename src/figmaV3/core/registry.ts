import type { ComponentDefinition, StyleBase } from "./types";

class Registry {
    private map = new Map<string, ComponentDefinition<Record<string, unknown>, StyleBase>>();

    register<P extends Record<string, unknown>, S extends StyleBase>(
        def: ComponentDefinition<P, S>
    ): void {
        this.map.set(def.id, def as unknown as ComponentDefinition<Record<string, unknown>, StyleBase>);
    }

    get(id: string) {
        return this.map.get(id);
    }

    list() {
        return Array.from(this.map.values());
    }
}

let _reg: Registry | null = null;
export function getRegistry() {
    if (!_reg) _reg = new Registry();
    return _reg;
}
export type { Registry };