// runtime/actions.ts (전체 교체)
import type { ActionStep, ActionSpec, NodeAny, SupportedEvent } from "@/figmaV3/core/types";

export function getSteps(node: NodeAny, evt: SupportedEvent): ActionStep[] {
    try {
        const props = (node?.props ?? {}) as Record<string, unknown>;
        const direct = (props as any).__actions?.[evt] ?? (props as any).actions?.[evt];

        if (!direct) return [];

        // 배열 형태: steps 배열 자체를 저장해둔 경우
        if (Array.isArray(direct)) {
            return direct as ActionStep[];
        }

        // 객체 형태: { steps: [...] }
        if (typeof direct === "object" && Array.isArray((direct as ActionSpec).steps)) {
            return (direct as ActionSpec).steps;
        }

        return [];
    } catch {
        return [];
    }
}

export function runActions(node: NodeAny, evt: SupportedEvent): void {
    const steps = getSteps(node, evt);
    if (!Array.isArray(steps) || steps.length === 0) return;

    for (const step of steps) {
        switch (step.kind) {
            case "Alert":
                // eslint-disable-next-line no-alert
                window.alert(String(step.message ?? ""));
                break;
            case "OpenUrl":
                window.open(String(step.url ?? ""), step.target ?? "_blank");
                break;
            case "SetData": {
                const path = String(step.path ?? "");
                if (!path) break;
                const root = (window as any).__editorData ?? ((window as any).__editorData = {});
                setByPath(root, path, step.value);
                break;
            }
            default:
                // 알 수 없는 액션은 무시
                break;
        }
    }
}

// dot-path 세터 (예: "user.name")
function setByPath(obj: Record<string, unknown>, path: string, value: unknown) {
    const segs = path.split(".");
    let cur: any = obj;
    for (let i = 0; i < segs.length - 1; i++) {
        const k = segs[i];
        if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
        cur = cur[k];
    }
    cur[segs[segs.length - 1]] = value;
}