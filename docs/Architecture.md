컴포넌트 에디터 V3 – 개발 목표 & 기능 정의 (요약)

1) 비전 / 타깃
	•	비개발자도 드래그앤드롭 + 속성 편집만으로 동작 가능한 웹 UI를 만든다.
	•	개발자는 재사용 가능한 Actionable 컴포넌트를 정의해 레지스트리에 등록한다.
	•	결과물은 페이지 단위로 저장/복원 가능하고, 추후 내보내기(export)까지 확장.

2) 핵심 개념

동작 가능한 컴포넌트 (Actionable Component)
	•	이벤트(onClick, onChange, …) → 액션 실행기에 연결.
	•	데이터 바인딩 지원: {{data.user}}, {{settings.theme}}, {{props.value}} 등 스코프 해석.
	•	필요 시 자체 애니메이션/상태/내장 핸들러 보유.
	•	외부 I/O(HTTP, 라우팅, 상태 변경 등) 액션 스텝으로 구성.

노드 / 프로젝트 모델
	•	Node: id, componentId, props, styles, children, locked
	•	Project: rootId, nodes(Map), pages[]
	•	UI 상태: selectedId, 도킹/캔버스 폭 등 에디터 설정
	•	Settings/Data: 에디터 설정/사용자 데이터(바인딩 소스)

3) 아키텍처 (V3)
```plaintext
src/figmaV3/
  core/        # 타입/레지스트리
  runtime/     # actions 실행기, binding(머스태시) 평가
  store/       # editStore(트리/선택/패치/추가/이동)
  editor/      
    components/       # Box/Button/Text/Image (+ autoRegister)
    leftPanel/        # Palette, Layers (탭)
    centerPanel/      # Canvas (렌더/선택 윤곽/드롭)
    rightPanel/       # Inspector (Props 자동 UI + 스타일 섹션)
    bottomPanel/      # Dock (Actions, Data)  ← 공간 많은 패널
    useEditor.ts      # getStore + useSyncExternalStore
    bootstrap.ts      # 컴포넌트 자동 등록, 초기 프로젝트 로드
```

	•	core/types.ts: ComponentDefinition, NodeAny, ActionStep, SupportedEvent, BindingScope(root 포함) 등 단일 출처(SSOT) 타입.
	•	core/registry.ts: register/get/list – autoRegister로 앱 부팅 시 자동 등록.
	•	runtime/binding.ts: getBoundProps(props, scope) – {{ }} 템플릿 평가. BindingScope = { data, settings, node, root }.
	•	runtime/actions.ts: getSteps(node, evt), runActions(node, evt) – 스텝 시퀀스 실행(알럿, HTTP, 네비게이트 등 점진 확장).
	•	store/editStore.ts: subscribe/getState/update, select, addByDef/At, patchNode/props/styles, getParentOf, 불변성 유지.
	•	editor/:
	•	Left: Palette(검색/드래그), Layers(선택, 이동, 잠금/삭제 with 보호)
	•	Center: Canvas(루트 Box를 흰 스테이지 위에 렌더, 선택 윤곽/절대배치 처리)
	•	Right: Inspector(Props Auto + Layout/Dimensions/Position/Spacing/Border/Background/Typography/Overflow/Effects, Custom 스타일)
	•	Bottom Dock: ActionsPanel(이벤트별 스텝 CRUD, 테스트 실행), DataPanel(key/value, JSON 편집)

4) 에디터 UX (현재 기준)
	•	Left: LeftPanelTabs — Palette / Layers 탭
	•	Center: Canvas — 중앙 흰 보드(캔버스 폭: 기본 640), 루트 Box는 위에서 40px 내린 위치
	•	Right: Inspector — 공통/컴포넌트 전용 속성, 2~4열 반응형 배치(스크롤 O)
	•	Bottom: BottomDock — Actions / Data 탭 (토글 표시, 넓은 작업 공간)

5) 주요 기능
	1.	컴포넌트 등록: autoRegister로 앱 시작 시 기본 컴포넌트(Box/Button/Text/Image) 자동 등록.
	2.	팔레트 & 드래그-드롭: Palette에서 드래그 → Canvas 드롭(드롭 대상 하이라이트, 올바른 부모에 삽입).
	3.	레이어 트리: 노드 선택/이동/삭제/락(루트 보호), 호버/선택 싱크.
	4.	인스펙터
	•	Props 자동화: propsSchema에 따라 입력 UI 자동 생성(선택지/조건 표시 포함)
	•	스타일 섹션: Dimensions/Position/Spacing/Border/Background/… (표준 가드: 예 display:inline → size 비활성)
	•	Custom 스타일: 키/값 추가(머지 정책: 렌더 직전 병합)
	5.	액션
	•	이벤트별 스텝(예: Alert) CRUD, Run Now로 즉시 테스트
	•	Canvas의 실제 컴포넌트 이벤트에서 runActions 실행(실사용 시 window.alert 등)
	6.	데이터 바인딩
	•	DataPanel에서 키/값 편집 → 즉시 바인딩 반영(content="Hello {{data.user}}")
	•	스코프: data, settings, node, root
	7.	저장/복원(다음 단계)
	•	exportProject()/importProject() JSON 스냅샷
	•	컴포넌트 프리셋/복합 컴포넌트는 이후 단계에서 확장

6) 설계 원칙
	•	타입 우선(SSOT): 타입은 core/types.ts에서만 수출, 각 모듈은 여기서만 import.
	•	훅 규율: 훅은 조건 없이 최상위에서만 호출. 분기는 콜백/메모 내부 처리.
	•	불변 업데이트: store.update 콜백에서 얕은 복사로 노드/맵 갱신.
	•	표준 패치 API: patchNode, updateNodeProps/styles 등 일관된 시그니처.
	•	가드/검증: 레이아웃/디스플레이 상호 제약(예: inline 크기), 루트 보호(삭제/락/이동 금지).
	•	확장성: 컴포넌트 추가는 정의+autoRegister만으로. 액션/바인딩은 스텝·토큰 단위로 확장.

7) 수용 기준(샘플)
	•	팔레트에서 Text를 DnD → 선택된 Box(또는 루트) 자식으로 추가, 드롭 영역 하이라이트 보임.
	•	Inspector Dimensions에서 width/height 변경 → Canvas 실시간 반영.
	•	Button Props에서 as="a", href 세팅 → Canvas에서 링크 동작.
	•	ActionsPanel에서 Button onClick = Alert(“Hello”) 등록 → Canvas 버튼 클릭 시 window.alert 1회 표시.
	•	DataPanel에 { user: "Mina" } 추가, Text content="Hello {{data.user}}" → Canvas에 Hello Mina 표시.
	•	Layers에서 Lock된 노드는 삭제/이동 불가, 토스트 경고 및 아이콘 노출.

8) 다음 단계(로드맵 단축)
	1.	안정화: 타입/임포트 통일(core/types), 훅 경고 제거, Canvas/Actions/Data 동작 점검
	2.	DnD 정밀화: 인덱스 삽입, 가시 피드백, 잘못된 부모 방지
	3.	Inspector 폴리시: 더 촘촘한 비활성/경고 배지, 입력 단위 정책(전역)
	4.	액션 스텝 확장: Navigate, SetData/SetProps, HTTP 등
	5.	저장/복원: 프로젝트 스냅샷, 불러오기
	6.	복합 컴포넌트: 파츠(슬롯) 편집, 프리셋
	7.	테스트/디버그: 런타임 로그/토글, SSR 하이드레이션 점검