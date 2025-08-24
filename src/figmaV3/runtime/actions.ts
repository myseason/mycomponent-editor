import type { ActionStep } from "../core/types";

export async function runActions(steps: ActionStep[]): Promise<void> {
    for (const s of steps) {
        switch (s.kind) {
            case "Alert":
                // SSR 대비: window 존재할 때만
                if (typeof window !== "undefined") window.alert(s.message);
                break;
            case "OpenURL":
                if (typeof window !== "undefined") window.open(s.url, s.target ?? "_blank");
                break;
            case "Delay":
                await new Promise((r) => setTimeout(r, s.ms));
                break;
            case "Toast":
                // 실제 토스트 UI는 추후 도입
                if (typeof window !== "undefined") console.log("[toast]", s.message);
                break;
            default:
                // never
                break;
        }
    }
}