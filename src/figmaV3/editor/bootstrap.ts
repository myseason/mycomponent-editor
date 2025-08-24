"use client";

/**
 * 앱 구동 시 한 번만 기본 컴포넌트를 레지스트리에 등록한다.
 * - 중복 호출 방지(모듈 스코프 가드)
 * - 클라이언트에서만 실행
 */
import { registerBasics } from "@/figmaV3/editor/components/registerBasics";

let __registered = false;
export function ensureComponentsRegistered(): void {
  if (__registered)
    return;

  registerBasics();

  __registered = true;
}

// 모듈 로드 시 즉시 1회 실행
ensureComponentsRegistered();