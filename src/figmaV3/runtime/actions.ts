// src/figmaV3/runtime/actions.ts
"use client";

import type {
    NodeAny,
    SupportedEvent,
    ActionStep,
    ActionSpec,
    BindingScope,
} from "@/figmaV3/core/types";
import { evalTemplate } from "@/figmaV3/runtime/binding";

/** __actions 스텝 스캔: node.props.__actions[evt] | node.props.actions[evt] | node.actions[evt] */
export function getSteps(node: NodeAny, evt: SupportedEvent): ActionStep[] {
    if (!node) return [];
    const props = (node.props ?? {}) as Record<string, unknown>;
    const a1 = (props.__actions as Record<string, unknown> | undefined)?.[evt] as unknown;
    const a2 = (props.actions as Record<string, unknown> | undefined)?.[evt] as unknown;
    const a3 = (node as unknown as { actions?: Record<string, unknown> }).actions?.[evt] as unknown;

    const candidate = a1 ?? a2 ?? a3;
    if (!candidate)
        return [];

    if (Array.isArray(candidate))
        return candidate as ActionStep[];

    if (
        typeof candidate === "object" &&
        candidate !== null &&
        Array.isArray((candidate as ActionSpec).steps)
    ) {
        return (candidate as ActionSpec).steps;
    }
    return [];
}

/** 내부 유틸: kind 정규화(대/소문자 혼용 방어) */
function norm(kind: string): string {
    return kind.trim().toLowerCase();
}

/** HTTP 실행 */
async function execHttpLike(
    kind: "http" | "https",
    step: Extract<ActionStep, { kind: "http" | "https" }>,
    scope: BindingScope
): Promise<void> {
    const url = evalTemplate(step.url, scope);
    const method = (step.method ?? "GET").toUpperCase();
    const headers =
        (step.headers as Record<string, string> | undefined) ?? undefined;

    const init: RequestInit = { method, headers };

    if (method !== "GET" && step.body != null) {
        init.body =
            typeof step.body === "string"
                ? evalTemplate(step.body, scope)
                : JSON.stringify(step.body);
    }

    // kind가 https 라면 그냥 URL이 https인지 확인만 (실제 fetch는 동일)
    if (kind === "https" && !/^https:\/\//i.test(url)) {
        // eslint-disable-next-line no-console
        console.warn("[actions] Https step has non-https url:", url);
    }
    await fetch(url, init);
}

/** URL 오픈 */
function execOpenUrl(
    step: Extract<ActionStep, { kind: "openurl" | "navigate" }>,
    scope: BindingScope
): void {
    const href = evalTemplate(step.href, scope);
    const target = step.target ?? "_self";
    window.open(href, target);
}

/** 알림 */
function execAlert(
    step: Extract<ActionStep, { kind: "alert" }>,
    scope: BindingScope
): void {
    const msg = evalTemplate(step.message, scope);
    window.alert(msg);
}

/** 액션 실행 메인 */
export async function runActions(
    node: NodeAny,
    evt: SupportedEvent,
    scope: BindingScope
): Promise<void> {
    const steps = getSteps(node, evt);
    // eslint-disable-next-line no-console
    // console.debug("[actions] runActions evt=", evt, "node.id=", node?.id, "steps=", steps);

    for (const raw of steps) {
        const k = norm(String((raw as ActionStep).kind ?? ""));
        try {
            if (k === "alert") {
                execAlert(raw as Extract<ActionStep, { kind: "alert" }>, scope);
            } else if (k === "openurl" || k === "navigate") {
                execOpenUrl(
                    raw as Extract<ActionStep, { kind: "openurl" | "navigate" }>,
                    scope
                );
            } else if (k === "http" || k === "https") {
                await execHttpLike(
                    k as "http" | "https",
                    raw as Extract<ActionStep, { kind: "http" | "https" }>,
                    scope
                );
            } else {
                // eslint-disable-next-line no-console
                console.warn("[actions] Unknown step kind:", (raw as ActionStep).kind);
            }
        } catch (err) {
            // 개별 스텝 오류 허용 여부(있으면 진행, 없으면 중단). 사양에 따라 확장 가능.
            const continueOnError = Boolean(
                (raw as unknown as { continueOnError?: boolean }).continueOnError
            );
            if (!continueOnError) break;
        }
    }
}