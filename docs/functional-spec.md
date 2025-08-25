컴포넌트 에디터 V3 – 기능 정의서 (Functional Spec)

본 문서는 V3 기준입니다. V1/V2에서 사용하던 호환 코드는 제거하고, 타입/스토어/런타임 규약을 단일화합니다.
저장소: myseason/mycomponent-editor (src/figmaV3/…)

0. 목표 / 비전
	•	비개발자도 드래그앤드롭과 속성 편집만으로 동작 가능한 웹 UI 제작
	•	개발자는 재사용 가능한 Actionable 컴포넌트를 정의/등록하여 팀 스택에 맞춘 생산성 확보
	•	결과물은 페이지 단위 저장/복원(향후 Export 확장)과 데이터·액션 기반의 인터랙션 제공

---
1. 핵심 개념

1.1 Actionable 컴포넌트
	•	이벤트(onClick 등) → 액션 실행기에 연결
	•	데이터 바인딩(머스태시 {{ }})으로 동적 콘텐츠/스타일
	•	필요 시 내부 애니메이션/상태/핸들러 포함
	•	외부 I/O(HTTP, 라우팅, 상태 변경 등)는 액션 스텝으로 확장

1.2 노드/프로젝트/상태
	•	Node: id, componentId, props, styles, children, locked
	•	Project: rootId, nodes(Map), pages[]
	•	EditorState(UI): selectedId, 도킹/캔버스 폭 등
	•	Settings/Data: 에디터 설정 및 사용자 데이터(바인딩 스코프)

---
2. 디렉토리 & 아키텍처
```plaintext
src/figmaV3/
  core/
    types.ts        # 모든 공용 타입(SSOT)
    registry.ts     # 컴포넌트 등록/조회 API (autoRegister 지원)

  runtime/
    binding.ts      # getBoundProps(props, scope) - {{ }} 평가
    actions.ts      # getSteps(node, evt), runActions(node, evt)

  store/
    editStore.ts    # subscribe/getState/update/select
                    # addByDef/At, patchNode/props/styles, getParentOf 등

  editor/
    bootstrap.ts          # 앱 부팅 시 autoRegister 호출, 초기 프로젝트 로드
    useEditor.ts          # getEditorStore + useSyncExternalStore 훅

    components/
      Box.tsx
      Button.tsx
      Text.tsx
      Image.tsx
      registerBasics.ts   # (필요 시) 수동 등록 훅/유틸

    leftPanel/
      LeftPanelTabs.tsx   # Palette / Layers 탭
      Palette.tsx
      Layers.tsx

    centerPanel/
      Canvas.tsx          # Node 렌더/선택 윤곽/드롭 타깃 하이라이트

    rightPanel/
      RightPanelTabs.tsx  # Inspector / (향후) 기타
      Inspector.tsx
      sections/
        PropsAutoSection.tsx  # propsSchema 기반 자동 UI

    bottomPanel/
      BottomDock.tsx      # ActionsPanel / DataPanel
      panels/
        ActionsPanel.tsx
        DataPanel.tsx

    ComponentEditor.tsx   # 전체 레이아웃 컨테이너
```

---
3. 타입 규약 (요약)

단일 출처(SSOT) = core/types.ts : 모든 모듈은 여기서만 타입을 import 합니다.
```javascript
// 예시 요약(실제 구현은 코드 기준):
export type NodeId = string;

export interface StyleBase {
  element?: CSSDict;   // React.CSSProperties 유사 키-값
}

export interface Node<P extends Record<string, unknown> = Record<string, unknown>, S extends StyleBase = StyleBase> {
  id: NodeId;
  componentId: string;
  props: P;
  styles: S;
  children: NodeId[];
  locked?: boolean;
}
export type NodeAny = Node<Record<string, unknown>, StyleBase>;

export interface Project {
  pages: { id: string; name: string; rootId: NodeId }[];
  nodes: Record<NodeId, NodeAny>;
  rootId: NodeId; // 현재 페이지의 루트
}

export interface EditorUI {
  selectedId: NodeId | null;
  canvasWidth: number;           // 기본 640
  // 도킹 등 설정 …
}

export interface EditorState {
  project: Project;
  ui: EditorUI;
  data: Record<string, unknown>;     // DataPanel
  settings: Record<string, unknown>; // Editor 설정
}

export type SupportedEvent = 'onClick' | 'onChange'; // 점진 확장

export type ActionStep =
  | { kind: 'Alert'; message: string }
  // | { kind: 'Http'; method: 'GET'|'POST'; url: string; … }
  // | { kind: 'Navigate'; to: string }
  ;

export interface ActionSpec {
  steps: ActionStep[];
}

export interface BindingScope {
  root: NodeAny | null;
  node: NodeAny | null;
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
}

// ComponentDefinition: propsSchema가 있으면 Inspector 자동 구성
export interface ComponentDefinition<P extends Record<string, unknown> = Record<string, unknown>, S extends StyleBase = StyleBase> {
  id: string;                        // ex) 'box'
  title: string;                     // 팔레트/레이어 표시명
  defaults: { props: Partial<P>; styles: Partial<S> };
  propsSchema?: Array<
    | { key: keyof P & string; type: 'text'; label?: string; placeholder?: string; default?: unknown; when?: Record<string, unknown> }
    | { key: keyof P & string; type: 'select'; label?: string; options: { label: string; value: unknown }[]; default?: unknown; when?: Record<string, unknown> }
    // 향후: number, toggle, color, image 등 확장
  >;
  Render(args: { node: Node<P, S>; fire?: (evt: SupportedEvent) => void }): React.ReactElement | null;
}
```

---
4. 레지스트리
	•	등록: register(def: ComponentDefinition) / 조회: get(id) / 목록: listAll()
	•	자동 등록: 각 컴포넌트 파일 최하단에서 autoRegister(def) 호출, editor/bootstrap.ts에서 import

---
5. 런타임

5.1 바인딩 (runtime/binding.ts)
	•	getBoundProps(props, scope: BindingScope)
	•	{{data.xxx}}, {{settings.xxx}}, {{node.props.xxx}}, {{root.styles.element.width}} 등 해석
	•	정책: props에만 바인딩 적용(스타일은 추후 확장)

5.2 액션 (runtime/actions.ts)
	•	getSteps(node, evt: SupportedEvent): ActionStep[]
	•	검색 우선순위(현행): node.props.__actions?.[evt] → (향후 확장)
	•	runActions(node, evt, opts?)
	•	Alert: window.alert 1회 호출(중복 방지)
	•	(Roadmap) Http, Navigate, SetData, SetProps 등

---
6. 스토어 (store/editStore.ts)
	•	구독: subscribe(listener)
	•	상태: getState()
	•	갱신: update((draft) => { … })  ← 불변 업데이트 원칙
	•	선택: select(id), getParentOf(id)
	•	추가: addByDef(defId: string, parentId?: string), addByDefAt(defId, parentId, index)
	•	패치: patchNode(id, patch), updateNodeProps(id, props), updateNodeStyles(id, styles)
	•	가드: 루트 노드 삭제/락/이동 금지

---
7. 에디터 UI

7.1 레이아웃
	•	Left: LeftPanelTabs → Palette / Layers
	•	Center: Canvas
	•	회색 보드 위에 흰색 스테이지(캔버스 폭: 기본 640)
	•	루트 Box는 위에서 40px 내려서 배치
	•	선택 윤곽/드롭 타깃 하이라이트
	•	Right: RightPanelTabs → Inspector(우선)
	•	Bottom: BottomDock → ActionsPanel / DataPanel

7.2 팔레트/드롭
	•	Palette에서 DnD → Canvas 드롭
	•	컨테이너(상위) 유효성 검사, 하이라이트 표시, 지정 인덱스 삽입(기본 하단)

7.3 레이어
	•	트리 표시, 선택/호버 싱크, 이동(상하), 삭제, 락
	•	루트 보호(삭제/락/이동 금지)

7.4 인스펙터
	•	PropsAutoSection: propsSchema 기반 자동 구성
	•	예) Button:
	•	as: select(button, a, div, span)
	•	content: text
	•	href: text (as === 'a'일 때만 노출)
	•	스타일 섹션(필수 → 고급):
	•	Dimensions(width/height + min/max)
	•	Position(static/relative/absolute/fixed + top/left 등)
	•	Spacing(padding/margin + 상세)
	•	Border(color/width/style)
	•	Background(color/image)
	•	Typography(Text류 전용)
	•	Overflow/Effects 등
	•	정책: display:inline이면 size 비활성, 배지 노출
	•	Custom 스타일: key/value 추가(렌더 직전 병합)

7.5 하단 패널
	•	ActionsPanel: 이벤트별 스텝 CRUD, Run Now 버튼으로 테스트
	•	DataPanel: key/value 편집 → 바인딩 즉시 반영

---
8. 기본 컴포넌트(초기)
	•	Box: 컨테이너, 기본 display:flex; flexDirection:column
	•	Button: as, content, (href when as='a'), onClick 액션
	•	Text: content(바인딩 가능), Typography 지원
	•	Image: src, alt (빈 문자열 경고 → null 처리)

---
9. 동작/수용 기준 (샘플 테스트 시나리오)
	1.	DnD: Palette → Canvas 드롭 → 드롭 타깃 하이라이트, 올바른 부모/인덱스에 삽입
	2.	Inspector-Props: Button as='a' + href 설정 → Canvas에서 링크 동작
	3.	Inspector-Styles: Dimensions에서 width/height 변경 시 즉시 반영
	4.	Actions: ActionsPanel에서 Button onClick = Alert("Hello") → Canvas 버튼 클릭 시 window.alert 1회
	5.	DataBinding: DataPanel에 { user: "Mina" }, Text content="Hello {{data.user}}" → Canvas에 Hello Mina
	6.	Layers-Guard: 루트 노드는 삭제/락/이동 불가, 해당 시 토스트/경고 표시

---
10. 개발 원칙
	•	타입 우선(SSOT): 모든 타입은 core/types.ts에서만 정의/수출
	•	훅 규율: React 훅은 조건 없이 최상위에서만 호출(경고 제거)
	•	불변 업데이트: 스토어 update()는 얕은 복사로 갱신
	•	표준 패치 시그니처: patchNode/updateNodeProps/updateNodeStyles 통일
	•	레이아웃 가드: display/position 제약에 따른 비활성/배지
	•	SSR 주의: 하이드레이션 미스매치 방지(랜덤 값/시간 의존 분리, 훅 위치 고정)

---
11. 로드맵(요약)
	1.	안정화: 타입/임포트 통일, 훅 경고 제거, 캔버스/액션/데이터 동작 점검
	2.	DnD 정밀화: 인덱스 삽입/피드백/불가 부모 차단
	3.	스타일 폴리시 강화: 비활성/배지/전역 단위 정책
	4.	액션 확장: Navigate, SetData, SetProps, Http
	5.	저장/복원: 프로젝트 스냅샷 JSON, 불러오기
	6.	복합 컴포넌트: 파츠(슬롯) 편집, 프리셋
	7.	테스트/디버그: 런타임 로그 토글, DevOverlay

---
12. 부록 – 예시 스키마

12.1 Button propsSchema 예시
```javascript
export const ButtonDef: ComponentDefinition<ButtonProps> = {
  id: 'button',
  title: 'Button',
  defaults: {
    props: { as: 'button', content: 'Button' },
    styles: { element: { padding: '8px 12px' } }
  },
  propsSchema: [
    { key: 'as', type: 'select', label: 'As', default: 'button',
      options: [
        { label: 'button', value: 'button' },
        { label: 'a',      value: 'a' },
        { label: 'div',    value: 'div' },
        { label: 'span',   value: 'span' }
      ]
    },
    { key: 'content', type: 'text', label: 'Text', placeholder: 'Button', default: 'Button' },
    { key: 'href', type: 'text', label: 'Href', placeholder: 'https://', when: { as: 'a' } },
  ],
  Render({ node, fire }) {
    const p = node.props as ButtonProps;
    const s = (node.styles.element ?? {}) as React.CSSProperties;
    const Tag = (p.as ?? 'button') as keyof JSX.IntrinsicElements;
    const onClick = fire ? () => fire('onClick') : undefined;
    return <Tag style={s} onClick={onClick} href={p.as === 'a' ? String(p.href ?? '') : undefined}>{String(p.content ?? '')}</Tag>;
  }
};
```
---
13. 용어
	•	SSOT: Single Source of Truth(단일 출처)
	•	ActionStep/ActionSpec: 액션 실행을 구성하는 단위/목록
	•	BindingScope: 바인딩 평가 시 참조 스코프(root/node/data/settings)
	•	Props Schema: 컴포넌트별 props를 Inspector UI로 자동 생성하기 위한 선언

---
14. 변경 기록
	•	2025-08-24: V3 기능 정의서 초판. 캔버스 폭 기본값 640/루트 오프셋 40px 명시, BottomDock 도입, PropsAutoSection 규약 명문화.

---
확인 & 합의 포인트
	•	캔버스 기본 폭(640)·루트 오프셋(40px) 고정으로 진행
	•	PropsAutoSection은 propsSchema만 참조(기존 하드코딩 제거)
	•	액션 소스는 node.props.__actions[evt] 단일 경로(레거시 탐색 제거)
	•	DataPanel 변경 즉시 반영(바인딩 라이브 업데이트 유지)
	•	루트 보호 규칙(삭제/락/이동 금지) 준수


