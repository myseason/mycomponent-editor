/* ------------------------------------------------------------
   템플릿 인터폴레이션 + props 바인딩 유틸
   - "{{data.user}}", "{{props.title}}", "{{settings.theme}}"
   - 객체/배열/원시 전부 깊은 순회 바인딩
------------------------------------------------------------ */

export interface BindingScope {
  data: Record<string, unknown>;
  props?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

/** 안전한 경로 접근: getByPath(obj, "a.b.c") */
function getByPath(root: Record<string, unknown>, path: string): unknown {
  const segs = path.split(".").map((s) => s.trim()).filter(Boolean);
  let cur: unknown = root;
  for (const k of segs) {
    if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return cur;
}

const MUSTACHE = /\{\{\s*([^}]+?)\s*\}\}/g;

/** "{{...}}" -> 값 치환 (문자열 전용) */
export function interpolate(str: string, scope: BindingScope): string {
  return str.replace(MUSTACHE, (_m, expr: string) => {
    const key = String(expr).trim();
    let base: Record<string, unknown> | undefined;
    let path = key;

    if (key.startsWith("data.")) {
      base = scope.data;
      path = key.slice("data.".length);
    } else if (key.startsWith("props.")) {
      base = scope.props ?? {};
      path = key.slice("props.".length);
    } else if (key.startsWith("settings.")) {
      base = scope.settings ?? {};
      path = key.slice("settings.".length);
    } else {
      // 접두사 없으면 data로 가정
      base = scope.data;
    }

    const v = getByPath(base, path);
    return v == null ? "" : String(v);
  });
}

/** 값 바인딩(원시/배열/객체 모두 처리) */
export function bindValue(val: unknown, scope: BindingScope): unknown {
  if (val == null) return val;
  if (typeof val === "string") return interpolate(val, scope);
  if (Array.isArray(val)) return val.map((x) => bindValue(x, scope));
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = bindValue(v, scope);
    return out;
  }
  return val;
}

/** props 전체 바인딩 */
export function getBoundProps(
  props: Record<string, unknown>,
  scope: BindingScope
): Record<string, unknown> {
  return bindValue(props, scope) as Record<string, unknown>;
}