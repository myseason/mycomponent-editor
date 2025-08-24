/*
   ------------------------------------------------------------
   액션 실행기 (V3)
   - 규약: 노드의 props.__actions[eventName] = Step[]
   - 현재 지원 Step: Alert
   - 의존성: 없음 (런타임 단독 동작)
   ------------------------------------------------------------ */

export type SupportedEvent = "onClick" | "onChange" | "onSubmit";

/** Alert 스텝 정의 */
export interface ActionStepAlert {
  kind: "Alert";
  /** 알림 메시지 */
  message: string;
}

/** 스텝 유니온 (향후 Navigate/HTTP 등 추가 예정) */
export type ActionStep = ActionStepAlert;

/** 일괄 실행용 스펙 */
export interface ActionSpec {
  steps: ActionStep[];
}

/** 실행에 필요한 노드 최소 형태(렌더러/스토어 의존 제거) */
export interface NodeLight {
  id: string;
  componentId: string;
  props?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  children?: string[];
}

/** 내부: 알 수 없는 객체가 Alert 스텝인지 검사 */
function asAlertStep(x: unknown): ActionStepAlert | null {
  if (!x || typeof x !== "object")
    return null;

  const k = (x as { kind?: unknown }).kind;
  if (k !== "Alert")
    return null;

  const msg = (x as { message?: unknown }).message;
  return { kind: "Alert", message: String(msg ?? "") };
}

/** 노드에서 eventName에 해당하는 Step[] 추출
 *  - props.__actions[event]만 사용 (레거시 경로 제거)
 */
export function getSteps(node: NodeLight, eventName: SupportedEvent): ActionStep[] {
  const acts = (node.props?.__actions as Record<string, unknown> | undefined) ?? undefined;
  const raw = (acts?.[eventName] as unknown) ?? undefined;

  if (!Array.isArray(raw))
    return [];

  const out: ActionStep[] = [];
  for (const item of raw) {
    const a = asAlertStep(item);
    if (a)
      out.push(a);
  }
  return out;
}

/** 단일 스텝 실행기 */
function execStep(step: ActionStep): void {
  switch (step.kind) {
    case "Alert": {
      const msg = String(step.message ?? "");
      // eslint-disable-next-line no-alert
      window.alert(msg);
      break;
    }
    default: {
      // eslint-disable-next-line no-console
      console.warn("[actions] unsupported step:", step);
    }
  }
}

/** 액션 실행: 노드 + 이벤트명
 *  - 예: runActions(node, "onClick")
 */
export function runActions(node: NodeLight, eventName: SupportedEvent): void {
  const steps = getSteps(node, eventName);
  if (!steps.length)
    return;

  for (const s of steps) {
    try {
      execStep(s);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[actions] step error:", err, s);
      // V3 기본 정책: 에러 발생 시 이후 스텝도 계속 진행 (필요 시 정책 옵션화)
    }
  }
}

/** (옵션) 외부에서 미리 묶은 스펙 실행 */
export function runActionSpec(spec: ActionSpec): void {
  for (const s of spec.steps) {
    try {
      execStep(s);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[actions] step error:", err, s);
    }
  }
}

/* ------------------------------------------------------------------
   Debug helpers (선택): 콘솔에서 확인용
   - window.__actionsDebug.get(node, evt)
   - window.__actionsDebug.run(node, evt)
   빌드에 영향을 주지 않으며, 타입/규약은 동일합니다.
------------------------------------------------------------------- */
declare global {
  interface Window {
    __actionsDebug?: {
      get: (node: NodeLight, evt: SupportedEvent) => ActionStep[];
      run: (node: NodeLight, evt: SupportedEvent) => void;
    };
  }
}

(() => {
  if (typeof window === "undefined") return;
  if (window.__actionsDebug) return;
  window.__actionsDebug = {
    get: (node, evt) => getSteps(node, evt),
    run: (node, evt) => runActions(node, evt),
  };
})();