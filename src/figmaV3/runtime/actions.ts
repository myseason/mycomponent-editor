import type { ActionStep, ActionSpec, SupportedEvent, NodeAny } from "@/figmaV3/core/types";

/** 노드에서 이벤트별 스텝 읽기 (우선순위: node.props.__actions > node.props.actions) */
export function getSteps(node: NodeAny, evt: SupportedEvent): ActionStep[] {
    const fromExplicit = (node as unknown as { actions?: Record<string, ActionSpec> }).actions?.[evt]?.steps ?? [];
    const fromProps = (node.props as unknown as { __actions?: Record<string, ActionStep[]> }).__actions?.[evt] ?? [];

    // 필요한가 ?
    const legacy = (node.props as unknown as { actions?: Record<string, ActionStep[]> }).actions?.[evt] ?? [];

    return (fromExplicit.length ? fromExplicit : (fromProps.length ? fromProps : legacy)) ?? [];
}

/** 액션 실행기 */
export async function runActions(node: NodeAny, evt: SupportedEvent): Promise<void> {
    const steps = getSteps(node, evt);
    for (const step of steps) {
        try {
            if (step.kind === "alert") {
                window.alert(step.message);
            } else if (step.kind === "navigate") {
                const target = step.target ?? "_self";
                if (target === "_blank") window.open(step.href, "_blank");
                else window.location.href = step.href;
            } else if (step.kind === "http" || step.kind === "https") {
                await fetch(step.url, {
                    method: step.method,
                    headers: step.headers,
                    body: step.body ? JSON.stringify(step.body) : undefined,
                });
            }
            // timeout/continueOnError은 필요 시 확장
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[actions] step error", step, err);
            if (!step.continueOnError) break;
        }
    }
}

export type { ActionStep, ActionSpec, SupportedEvent };