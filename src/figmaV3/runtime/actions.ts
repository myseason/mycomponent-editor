import type { ActionSpec, ActionStep, NodeAny } from "@/figmaV3/core/types";

/** ActionSpec 실행 */
export async function runActions(_node: NodeAny, spec: ActionSpec): Promise<void> {
    for (const step of spec.steps) {
        try {
            await execStep(step);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[actions] step failed:", step, err);
            break;
        }
    }
}

async function execStep(step: ActionStep): Promise<void> {
    switch (step.kind) {
        case "Alert":
            window.alert(step.message);
            return;

        case "OpenUrl":
            window.open(step.url, step.target ?? "_self");
            return;

        case "SetData": {
            const g = (window as unknown as { __editorData?: Record<string, unknown> });
            if (!g.__editorData) g.__editorData = {};
            setAtPath(g.__editorData, step.path, step.value);
            window.dispatchEvent(new CustomEvent("editor:data-changed"));
            return;
        }

        default:
            // eslint-disable-next-line no-console
            console.warn("[actions] unknown step", step);
            return;
    }
}

function setAtPath(obj: Record<string, unknown>, p: string, value: unknown) {
    const parts = p.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
    let cur: Record<string, unknown> | unknown[] = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i]!;
        const next = (cur as Record<string, unknown>)[k];
        if (typeof next === "object" && next != null) {
            cur = next as Record<string, unknown>;
        } else {
            const created: Record<string, unknown> = {};
            (cur as Record<string, unknown>)[k] = created;
            cur = created;
        }
    }
    (cur as Record<string, unknown>)[parts[parts.length - 1]!] = value as unknown;
}

/** 콘솔 디버그용 */
export const __actionsDebug = {
    run(node: NodeAny, spec: ActionSpec) {
        return runActions(node, spec);
    }
};