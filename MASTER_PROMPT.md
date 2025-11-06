# 모바일 출석체크 시스템 - 마스터 프롬프트

> **작성일**: 2025-11-03  
> **버전**: 7.0  
> **프로젝트**: 모바일 출석체크 앱 (Mobile Attendance Tracking System)  
> **환경**: React + Express.js + JSON 데이터 저장  

---

## 📋 프로젝트 개요

### 목적
학교 자습시간(1차/2차) 학생 출석을 **모바일에 최적화된 터치 인터페이스**로 체크하고, **좌석배치도 시각화** 및 **통계 분석**을 제공하는 웹 애플리케이션

### 핵심 기능
1. ✅ **터치 기반 출결 체크**: 학생 카드/좌석 터치로 출석/지각/결석 상태 토글
2. ✅ **좌석배치도 시각화**: 20개 교실의 실제 좌석 배치를 그대로 구현
3. ✅ **줌/팬 제스처**: 단일 손가락 드래그(팬), 두 손가락 핀치(줌)
4. ✅ **공결(사전 결석) 관리**: Excel 업로드/수동 등록으로 자동 반영
5. ✅ **통계 및 이력**: 일별/학급별 출석 통계 및 Excel 다운로드
6. ✅ **반응형 디자인**: 모바일/PC 모두 큰 폰트로 가시성 확보

### 기술 스택
- **Frontend**: React 18.3.1, Axios, date-fns
- **Backend**: Express.js, XLSX, CSV-Parser
- **Storage**: JSON 파일 (attendance.json, pre_absence.json, students.json)
- **Build**: Vite
- **Git**: genspark_ai_developer 브랜치

---

## 🗂️ 시스템 아키텍처

### 디렉토리 구조
```
/home/user/webapp/
├── backend/
│   ├── server.js                  # Express API 서버 (750줄)
│   ├── seating_charts.json        # 20개 교실 좌석 배치 데이터
│   ├── floor_plans.json           # 층별 평면도 이미지 경로
│   └── data/
│       ├── attendance.json        # 출석 기록
│       └── pre_absence.json       # 공결 등록 데이터
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # 메인 React 컴포넌트 (1900줄)
│   │   └── App.css                # 모든 스타일 (1400줄)
│   └── public/
│       └── 공결등록_샘플.xlsx       # Excel 샘플 파일
├── students.json                  # 전체 학생 명단
└── EXPERT_IMPROVEMENTS.md         # 개선안 문서
```

### API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/grades` | 학년 목록 (1, 2, 3학년) |
| GET | `/api/rooms/:grade` | 학년별 교실 목록 |
| GET | `/api/students/:roomName` | 교실별 학생 목록 |
| GET | `/api/seating/:roomName` | 좌석배치도 데이터 |
| GET | `/api/floor-plan/:roomName` | 평면도 이미지 경로 |
| GET | `/api/attendance` | 특정 날짜/교실/세션 출석 조회 |
| POST | `/api/attendance` | 출석 저장 |
| GET | `/api/statistics` | 통계 데이터 |
| POST | `/api/pre-register` | 공결 등록 (날짜 범위, 학생 ID, 사유) |
| POST | `/api/pre-register/excel` | Excel 파일 업로드 공결 등록 |
| GET | `/api/pre-absence` | 특정 날짜 공결 목록 |
| GET | `/api/download/pre-absence-sample` | Excel 샘플 다운로드 (RFC 5987 인코딩) |

---

## 🔄 전체 개발 이력 (Phase 1-7)

### Phase 1: 초기 5대 개선 (완료)

#### 요구사항
> "5가지 중요한 개선 사항이 있습니다..."

1. **공결 등록 시 세션 선택 제거**
   - 문제: 공결은 하루 전체 (1차+2차) 적용인데 세션 선택 UI 존재
   - 해결: `/api/pre-register` 엔드포인트에서 자동으로 세션 1, 2 모두 등록
   - 코드: `['1', '2'].forEach(session => { ... })`
   - 파일: `backend/server.js` (lines 230-283)

2. **형설관 4층 좌석배치 수정**
   - 문제: 18명 학생인데 배치가 실제와 다름
   - 해결: 
     - Row 1: 10명 (빈자리 포함, "Bezhan" 제외)
     - Row 3: 8명 (앞쪽 3자리 비움)
   - 파일: `backend/seating_charts.json` - "형설관 4층" 섹션

3. **창조관 8층 면학실 B 정렬**
   - 문제: Row 13이 5칸 밀려야 하는데 2칸만 밀림
   - 해결: 앞에 null 5개로 수정
   - 코드: `"seats": [null, null, null, null, null, {...}, {...}]`
   - 파일: `backend/seating_charts.json`

4. **본관 3층 도서관 우측 별실 통로 표시**
   - 문제: Column 3과 4 사이에 통로가 있어야 함
   - 해결: CSS gap 추가
   - 코드: 
     ```css
     .seat-grid[data-room="본관 3층 도서관 우측 별실"] {
       display: grid;
       grid-template-columns: repeat(3, 1fr) 8px repeat(3, 1fr);
       gap: 8px;
     }
     ```
   - 파일: `frontend/src/App.css`

5. **Excel 샘플 다운로드 파일명 한글 깨짐**
   - 문제: 브라우저에서 파일명이 "_____.xlsx"로 표시
   - 해결: RFC 5987 인코딩 적용
   - 코드:
     ```javascript
     const filename = encodeURIComponent('공결등록_샘플.xlsx');
     res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
     ```
   - 파일: `backend/server.js` (lines 637-642)

#### Git 커밋
```bash
git commit -m "feat: 5가지 핵심 개선사항 구현

- 공결 등록 시 1차/2차 자동 등록 (세션 선택 제거)
- 형설관 4층 좌석배치 실제 배치로 수정 (18명)
- 창조관 8층 면학실 B Row 13 정렬 (5칸 밀림)
- 본관 3층 도서관 우측 별실 통로 시각화
- Excel 샘플 다운로드 한글 파일명 인코딩 (RFC 5987)"
```

---

### Phase 2: 형설관 학생 업데이트 & 줌 컨트롤 (완료)

#### 요구사항
> "형설관 4층 Row 3 첫 번째 학생을 변경하고 줌 컨트롤을 개선해주세요."

1. **학생 정보 변경**
   - 변경 전: `"23-066 신주혁"`
   - 변경 후: `"23-088 이재헌"`
   - 위치: Row 3, 첫 번째 자리
   - 파일: `backend/seating_charts.json`

2. **줌 컨트롤 개선**
   - 줌 레벨 범위: 0.5 ~ 3배
   - 줌 인/아웃 버튼 추가
   - 리셋 버튼 추가
   - 현재 줌 레벨 표시

#### Git 커밋
```bash
git commit -m "feat: 형설관 4층 학생 정보 업데이트 및 줌 컨트롤 개선

- 형설관 4층 Row 3 첫 번째: 신주혁 → 이재헌 변경
- 줌 인/아웃 버튼 추가 (0.5x ~ 3x)
- 줌 리셋 버튼 추가
- 줌 레벨 실시간 표시"
```

---

### Phase 3: 모바일 UX 4대 개선 (완료)

#### 요구사항
> "모바일 UX를 개선하기 위한 4가지 작업을 해주세요."

1. **포토뷰어 스타일 터치 제스처**
   - 단일 손가락 드래그: 팬(이동)
   - 두 손가락 핀치: 줌
   - 기존 줌 버튼 제거 (제스처로 통합)
   - 구현: `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`
   - 파일: `frontend/src/App.jsx` (lines 1014-1147)

2. **"1차 체크, 2차 체크" 텍스트 말줄임 수정**
   - 문제: `grid-template-columns: 1fr 100px` 때문에 "1차 체..."로 잘림
   - 해결: `auto`로 변경하여 텍스트 길이에 맞춤
   - 코드: `grid-template-columns: 1fr auto;`
   - 파일: `frontend/src/App.css` (line 696)

3. **출석체크 페이지에 공결 표시**
   - 위치: 세션/날짜 선택 아래
   - 표시: "🔔 오늘 공결 등록: 홍길동(23-001), 김철수(23-002)"
   - 공결 없을 시: 표시 안 함
   - 파일: `frontend/src/App.jsx` (JSX 조건부 렌더링)

4. **메인 페이지 세로 간격 축소**
   - 목표: 스크롤 없이 한 화면에 모든 내용 표시
   - 변경:
     - grade-selection padding: 60px → 32px
     - grade-card min-height: 140px → 110px
     - header padding: 24px → 16px
   - 파일: `frontend/src/App.css`

#### Git 커밋
```bash
git commit -m "feat: 모바일 UX 4대 개선

- 포토뷰어 스타일 터치 제스처 (드래그, 핀치줌)
- '1차 체크' 텍스트 말줄임 문제 해결 (auto width)
- 출석체크 페이지에 오늘 공결 표시 추가
- 메인 페이지 간격 축소로 스크롤 제거"
```

---

### Phase 4: 터치 제스처 안정화 (완료)

#### 요구사항
> "모바일에서 터치 제스처가 불안정합니다. 드래그 시 떨리고 핀치줌 시 위치가 튀어요."

#### 문제 원인
- 여러 `useState` 사용으로 상태 업데이트 충돌
- 각 터치 이벤트마다 재렌더링 발생
- 핀치줌 시 누적 오차로 위치 drift

#### 해결책
1. **useState → useRef 전환**
   - 터치 상태를 `touchStateRef.current` 객체로 통합
   - 재렌더링 없이 상태 업데이트
   - 코드:
     ```javascript
     const touchStateRef = useRef({
       isDragging: false,
       isPinching: false,
       startPos: null,
       startPan: null,
       startDistance: null,
       startZoom: null,
       lastTouchCount: 0,
       hasMoved: false
     });
     ```

2. **델타 계산 방식 변경**
   - 이전: 이전 터치와의 차이 누적 (drift 발생)
   - 변경: 시작 위치 기준 절대 델타
   - 코드:
     ```javascript
     const newPan = {
       x: state.startPan.x + deltaX,  // 누적이 아닌 시작점 기준
       y: state.startPan.y + deltaY
     };
     ```

3. **하드웨어 가속 적용**
   - CSS: `transform: translateZ(0)`, `backface-visibility: hidden`
   - GPU 렌더링으로 60fps 유지

#### Git 커밋
```bash
git commit -m "fix: 터치 제스처 안정화 (useRef 기반 상태 관리)

- useState → useRef 전환으로 재렌더링 제거
- 시작점 기준 델타 계산으로 drift 방지
- CSS 하드웨어 가속 적용 (60fps)
- 핀치줌 중 위치 고정 안정화"
```

---

### Phase 5: 고급 터치 & 레이아웃 (완료)

#### 요구사항
> "3가지 추가 개선을 해주세요."

1. **좌석배치도 패딩 제거 & 드래그 경계**
   - 문제: 빈 공간 드래그 시 흰 여백 노출
   - 해결:
     - 패딩 10px 제거
     - `constrainPanPosition()` 함수로 수학적 경계 계산
     - 코드:
       ```javascript
       const maxX = 0;
       const minX = Math.min(0, containerWidth - wrapperWidth);
       const maxY = 0;
       const minY = Math.min(0, containerHeight - wrapperHeight);
       ```
   - 파일: `frontend/src/App.jsx` (lines 1044-1063)

2. **좌석 버튼 위에서도 핀치줌 가능**
   - 문제: 버튼 영역에서는 두 손가락 제스처 무반응
   - 해결: 단일 터치만 버튼에서 차단, 두 손가락은 항상 핀치줌
   - 코드:
     ```javascript
     if (touchCount === 1 && e.target.closest('.seat-btn')) {
       return; // 단일 터치 차단
     }
     if (touchCount === 2) {
       e.preventDefault(); // 두 손가락은 항상 핀치
       // ... 줌 로직
     }
     ```

3. **초기 로드 시 자동 fit-to-screen**
   - 목표: 좌석배치도가 항상 화면에 꽉 차게 시작
   - 해결: useEffect에서 컨테이너/콘텐츠 크기 비교 후 최적 줌 계산
   - 코드:
     ```javascript
     const scaleX = (containerWidth - 20) / wrapperWidth;
     const scaleY = (containerHeight - 20) / wrapperHeight;
     const initialZoom = Math.min(scaleX, scaleY, 1);
     setZoomLevel(initialZoom);
     ```
   - 파일: `frontend/src/App.jsx` (lines 697-722)

#### Git 커밋
```bash
git commit -m "feat: 고급 터치 제스처 및 레이아웃 개선

- 좌석배치도 드래그 경계 제한 (빈 공간 제거)
- 좌석 버튼 위에서 핀치줌 활성화
- 초기 로드 시 자동 fit-to-screen (최적 줌)"
```

---

### Phase 6: 3대 핵심 수정 (완료)

#### 요구사항
> "3가지 중요한 버그를 수정해주세요."

1. **좌석배치도에서 공결 미표시 문제**
   - 문제: 목록보기(grid)에는 공결 표시, 좌석배치(seating)에는 미표시
   - 원인: useEffect 의존성에 `viewMode` 누락
   - 해결: 
     ```javascript
     }, [currentDate, currentSession, students.length, selectedRoomName, viewMode]);
     //                                                                    ^^^^^^^^
     ```
   - 파일: `frontend/src/App.jsx` (line 779)

2. **"뒤로" 버튼 계층적 네비게이션**
   - 기존: 항상 홈으로 이동
   - 변경: 계층적 이동
     - attendance → roomSelect
     - roomSelect → home
     - admin → home
   - 코드:
     ```javascript
     const goBack = () => {
       if (currentView === 'attendance') {
         setCurrentView('roomSelect');
         // ... attendance 상태 초기화
       } else if (currentView === 'roomSelect') {
         setCurrentView('home');
         // ... roomSelect 상태 초기화
       } else {
         goHome();
       }
     };
     ```
   - 파일: `frontend/src/App.jsx` (lines 919-958)

3. **좌석 버튼에서 단일 손가락 드래그 활성화**
   - 문제: 좌석 버튼 터치 시 드래그 불가 (클릭만 가능)
   - 해결: 5px 임계값 적용
     - 5px 미만 이동: 클릭으로 인식
     - 5px 이상 이동: 드래그로 전환
   - 코드:
     ```javascript
     const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
     if (!state.hasMoved && distance > 5) {
       state.hasMoved = true;
       state.isDragging = true;
       e.preventDefault();
     }
     ```
   - TouchEnd에서 미이동 시 프로그래밍 방식 클릭:
     ```javascript
     if (!state.hasMoved && state.startTarget && state.startTarget.closest('.seat-btn')) {
       const button = state.startTarget.closest('.seat-btn');
       button.click();
     }
     ```
   - 파일: `frontend/src/App.jsx` (handleTouchMove, handleTouchEnd)

#### Git 커밋
```bash
git commit -m "fix: 3대 핵심 버그 수정

- 좌석배치도에 공결 표시 (viewMode 의존성 추가)
- 뒤로 버튼 계층적 네비게이션 구현
- 좌석 버튼에서 드래그 활성화 (5px 임계값)"
```

---

### Phase 7: 현재 작업 (진행 중)

#### 요구사항
> "6가지 작업을 해주세요."

1. **✅ 출석 초기화 버튼 추가**
   - 기능: 현재 출결 상태 모두 'present'로 리셋
   - UI: "🔄 초기화" 버튼 (action-buttons에 추가)
   - 확인 대화상자: "현재 출결 상황을 모두 초기화하시겠습니까?"
   - Toast 알림: "✓ 출결 초기화 완료!"
   - 코드:
     ```javascript
     const resetAttendance = () => {
       if (window.confirm('현재 출결 상황을 모두 초기화하시겠습니까?\n\n저장되지 않은 내용은 사라집니다.')) {
         const newAttendance = {};
         students.forEach(student => {
           newAttendance[student.id] = 'present';
         });
         setAttendance(newAttendance);
         
         const successMsg = document.createElement('div');
         successMsg.className = 'toast-success';
         successMsg.textContent = '✓ 출결 초기화 완료!';
         document.body.appendChild(successMsg);
         setTimeout(() => successMsg.remove(), 2000);
       }
     };
     ```
   - 파일: `frontend/src/App.jsx` (line ~878)

2. **✅ "뒤로"와 "홈" 버튼 분리**
   - "← 뒤로": 계층적 네비게이션 (이전 단계로)
   - "🏠 홈": 메인 페이지로 직행
   - 배치: 헤더 양쪽 끝
   - 조건: 홈 화면에서는 둘 다 숨김
   - 코드:
     ```javascript
     <header className="header">
       <div className="header-content">
         {currentView !== 'home' && (
           <button className="btn-back" onClick={goBack}>
             ← 뒤로
           </button>
         )}
         <h1 className="header-title">📱 출석체크</h1>
         {currentView !== 'home' && (
           <button className="btn-home" onClick={goHome}>
             🏠 홈
           </button>
         )}
       </div>
     </header>
     ```
   - 파일: `frontend/src/App.jsx` (lines 1471-1481)

3. **✅ PC 화면 큰 폰트 최적화**
   - 목표: PC에서도 모바일처럼 큰 폰트로 가시성 확보
   - 방법: `@media (min-width: 769px)` 미디어 쿼리
   - 변경 사항:
     - `.app`: max-width 600px, 중앙 정렬, 그림자
     - 버튼: font-size 16px, padding 14px, min-height 50px
     - 학생 카드: min-width 90px, min-height 90px
     - 학생 이름: font-size 17px
     - 홈 버튼: gradient 배경, 그림자, 18px 패딩
   - 코드:
     ```css
     @media (min-width: 769px) {
       .app {
         max-width: 600px;
         margin: 0 auto;
         box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
       }
       
       .btn-action {
         font-size: 16px !important;
         padding: 14px 20px !important;
         min-height: 50px;
       }
       
       .btn-home {
         background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
         color: white;
         /* ... */
       }
       
       .student-card, .seat-btn {
         min-width: 90px !important;
         min-height: 90px !important;
         font-size: 16px !important;
       }
       
       /* ... */
     }
     ```
   - 파일: `frontend/src/App.css` (끝에 추가)

4. **⏳ 공결 좌석배치 표시 문제 재확인**
   - 상태: viewMode 의존성 이미 추가됨
   - 추가 작업: 디버깅 로그 추가
   - 로그 내용:
     - 공결 데이터 로드 시작
     - API 응답 데이터
     - excused 상태 적용된 학생 수
   - 파일: `frontend/src/App.jsx` (lines 741-779)

5. **⏳ 전문가 평가를 위한 3가지 개선안**
   - 문서: `EXPERT_IMPROVEMENTS.md` 생성
   - 내용:
     1. 컴포넌트 모듈화 (아토믹 디자인 + Context API)
     2. 오프라인 우선 아키텍처 (WebSocket + IndexedDB + Service Worker)
     3. AI 기반 이상 패턴 감지 (TensorFlow.js + 출결 예측)
   - 각 개선안마다 코드 예시 및 기대 효과 상세 설명

6. **⏳ 종합 프롬프트 파일 작성**
   - 현재 문서: `MASTER_PROMPT.md`
   - 내용:
     - 프로젝트 개요
     - 시스템 아키텍처
     - 전체 개발 이력 (Phase 1-7)
     - 각 요구사항과 해결책
     - Git 커밋 메시지
     - 업데이트 가능한 구조

#### Git 작업 대기 중
```bash
# 다음 커밋 예정
git add frontend/src/App.jsx frontend/src/App.css
git commit -m "feat: 출석 초기화, 뒤로/홈 분리, PC 최적화

- resetAttendance() 함수 추가 (확인 대화상자 + Toast)
- 뒤로(계층적) / 홈(직행) 버튼 분리
- PC 미디어 쿼리로 큰 폰트 적용 (600px 컨테이너)
- 공결 표시 디버깅 로그 추가
- EXPERT_IMPROVEMENTS.md 생성 (3대 개선안)
- MASTER_PROMPT.md 생성 (종합 프롬프트)"
```

---

## 🎯 핵심 코드 패턴

### 1. 터치 제스처 핸들링 (Ref 기반)

```javascript
// 상태는 useRef로 관리 (재렌더링 방지)
const touchStateRef = useRef({
  isDragging: false,
  isPinching: false,
  startPos: null,
  startPan: null,
  startDistance: null,
  startZoom: null,
  hasMoved: false,
  startTarget: null
});

// 터치 시작
const handleTouchStart = (e) => {
  const touchCount = e.touches.length;
  const state = touchStateRef.current;

  // 버튼 클릭은 허용
  if (touchCount === 1 && e.target.closest('.seat-btn')) {
    return;
  }

  if (touchCount === 1) {
    // 드래그 준비
    state.startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    state.startPan = { ...panPosition };
    state.hasMoved = false;
    state.startTarget = e.target;
  } else if (touchCount === 2) {
    // 핀치줌 준비
    e.preventDefault();
    state.isPinching = true;
    const [t1, t2] = [e.touches[0], e.touches[1]];
    state.startDistance = Math.sqrt(
      Math.pow(t2.clientX - t1.clientX, 2) +
      Math.pow(t2.clientY - t1.clientY, 2)
    );
    state.startZoom = zoomLevel;
  }
};

// 터치 이동
const handleTouchMove = (e) => {
  const state = touchStateRef.current;
  const touchCount = e.touches.length;

  if (touchCount === 1 && state.startPos) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startPos.x;
    const deltaY = touch.clientY - state.startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 5px 임계값 (tap vs drag 구분)
    if (!state.hasMoved && distance > 5) {
      state.hasMoved = true;
      state.isDragging = true;
      e.preventDefault();
    }
    
    if (state.isDragging) {
      const newPan = {
        x: state.startPan.x + deltaX,
        y: state.startPan.y + deltaY
      };
      setPanPosition(constrainPanPosition(newPan, zoomLevel));
    }
  } else if (touchCount === 2 && state.isPinching) {
    e.preventDefault();
    const [t1, t2] = [e.touches[0], e.touches[1]];
    const currentDistance = Math.sqrt(
      Math.pow(t2.clientX - t1.clientX, 2) +
      Math.pow(t2.clientY - t1.clientY, 2)
    );
    
    const scale = currentDistance / state.startDistance;
    const newZoom = Math.max(0.5, Math.min(3, state.startZoom * scale));
    setZoomLevel(newZoom);
  }
};

// 터치 종료
const handleTouchEnd = (e) => {
  const state = touchStateRef.current;
  
  // 이동 없었고 버튼이면 클릭 발생
  if (!state.hasMoved && state.startTarget?.closest('.seat-btn')) {
    state.startTarget.closest('.seat-btn').click();
  }
  
  // 상태 초기화
  state.isDragging = false;
  state.isPinching = false;
  state.startPos = null;
  state.startPan = null;
  state.hasMoved = false;
  state.startTarget = null;
};
```

### 2. 경계 제한 함수

```javascript
const constrainPanPosition = (newPan, currentZoom) => {
  if (!seatingWrapperRef.current) return newPan;
  
  const wrapper = seatingWrapperRef.current;
  const container = wrapper.parentElement;
  
  const wrapperWidth = wrapper.scrollWidth * currentZoom;
  const wrapperHeight = wrapper.scrollHeight * currentZoom;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // 콘텐츠가 컨테이너보다 작으면 드래그 불필요
  const maxX = 0;
  const minX = Math.min(0, containerWidth - wrapperWidth);
  const maxY = 0;
  const minY = Math.min(0, containerHeight - wrapperHeight);
  
  return {
    x: Math.max(minX, Math.min(maxX, newPan.x)),
    y: Math.max(minY, Math.min(maxY, newPan.y))
  };
};
```

### 3. 공결 자동 로드 (useEffect)

```javascript
// viewMode 변경 시에도 공결 재로드
useEffect(() => {
  const reloadPreAbsence = async () => {
    if (!students.length || !selectedRoomName) return;
    
    try {
      const response = await axios.get(`${API_BASE}/pre-absence`, {
        params: { date: currentDate }
      });
      
      setAttendance(prevAttendance => {
        const updated = { ...prevAttendance };
        
        // 기존 공결 제거
        Object.keys(updated).forEach(id => {
          if (updated[id] === 'excused') {
            updated[id] = 'present';
          }
        });
        
        // 새 공결 적용
        response.data.forEach(absence => {
          if (absence.session === currentSession && updated.hasOwnProperty(absence.studentId)) {
            updated[absence.studentId] = 'excused';
          }
        });
        
        return updated;
      });
    } catch (error) {
      console.error('공결 로드 오류:', error);
    }
  };
  
  reloadPreAbsence();
}, [currentDate, currentSession, students.length, selectedRoomName, viewMode]);
//                                                                    ^^^^^^^^ 중요!
```

### 4. 자동 Fit-to-Screen

```javascript
useEffect(() => {
  if (seatingData && hasSeatingChart && seatingWrapperRef.current && viewMode === 'seating') {
    setTimeout(() => {
      const wrapper = seatingWrapperRef.current;
      const container = wrapper.parentElement;
      
      const wrapperWidth = wrapper.scrollWidth;
      const wrapperHeight = wrapper.scrollHeight;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // 가로/세로 스케일 중 작은 값 선택 (전체가 화면에 들어오도록)
      const scaleX = (containerWidth - 20) / wrapperWidth;
      const scaleY = (containerHeight - 20) / wrapperHeight;
      const initialZoom = Math.min(scaleX, scaleY, 1);
      
      setZoomLevel(initialZoom);
      setPanPosition({ x: 0, y: 0 });
    }, 100);
  }
}, [seatingData, hasSeatingChart, viewMode]);
```

### 5. 공결 등록 (양쪽 세션 자동)

```javascript
// backend/server.js
app.post('/api/pre-register', (req, res) => {
  const { startDate, endDate, studentIds, reason } = req.body;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  
  // 날짜 범위 생성
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  const absenceData = loadAbsenceData();
  
  dates.forEach(date => {
    ['1', '2'].forEach(session => {  // 1차, 2차 자동 등록
      studentIds.forEach(studentId => {
        const student = studentsData.find(s => s.id === studentId);
        if (!student) return;
        
        absenceData.push({
          id: uuidv4(),
          studentId,
          studentNumber: student.studentNumber,
          studentName: student.name,
          grade: student.grade,
          date,
          session,
          reason,
          registeredAt: new Date().toISOString()
        });
      });
    });
  });
  
  saveAbsenceData(absenceData);
  res.json({ success: true, message: '공결이 등록되었습니다.' });
});
```

---

## 🎨 CSS 주요 패턴

### 모바일 우선 + PC 미디어 쿼리

```css
/* 기본 (모바일) */
.btn-action {
  font-size: 15px;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 700;
}

.student-card {
  min-width: 80px;
  min-height: 80px;
  font-size: 14px;
}

/* PC (769px 이상) */
@media (min-width: 769px) {
  .app {
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
  }
  
  .btn-action {
    font-size: 16px !important;
    padding: 14px 20px !important;
    min-height: 50px;
  }
  
  .student-card, .seat-btn {
    min-width: 90px !important;
    min-height: 90px !important;
    font-size: 16px !important;
  }
  
  .student-name, .seat-name {
    font-size: 17px !important;
  }
}
```

### 터치 최적화 CSS

```css
.seating-wrapper {
  display: inline-block;
  min-width: min-content;
  touch-action: none;               /* 브라우저 제스처 차단 */
  transform-origin: top left;
  will-change: transform;           /* GPU 가속 힌트 */
  -webkit-transform: translateZ(0); /* 하드웨어 가속 */
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.students-container {
  user-select: none;                /* 텍스트 선택 방지 */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;      /* 바운스 스크롤 방지 */
}
```

---

## 📊 데이터 구조

### students.json
```json
[
  {
    "id": "23-001",
    "studentNumber": "23-001",
    "name": "홍길동",
    "grade": 3,
    "room": "형설관 4층"
  }
]
```

### seating_charts.json
```json
{
  "형설관 4층": {
    "hasSeating": true,
    "rows": [
      {
        "row": 1,
        "seats": [
          {"id": "23-001", "studentNumber": "23-001", "name": "홍길동", "grade": 3},
          null,
          {"id": "23-002", "studentNumber": "23-002", "name": "김철수", "grade": 3}
        ]
      },
      {
        "row": 3,
        "seats": [
          {"id": "23-088", "studentNumber": "23-088", "name": "이재헌", "grade": 3}
        ]
      }
    ]
  }
}
```

### attendance.json
```json
[
  {
    "id": "uuid",
    "date": "2025-11-03",
    "session": "1",
    "roomName": "형설관 4층",
    "grade": 3,
    "supervisorName": "김선생",
    "attendance": {
      "23-001": "present",
      "23-002": "absent",
      "23-003": "late",
      "23-004": "excused"
    },
    "savedAt": "2025-11-03T10:30:00.000Z"
  }
]
```

### pre_absence.json
```json
[
  {
    "id": "uuid",
    "studentId": "23-001",
    "studentNumber": "23-001",
    "studentName": "홍길동",
    "grade": 3,
    "date": "2025-11-03",
    "session": "1",
    "reason": "병원 진료",
    "registeredAt": "2025-11-02T15:00:00.000Z"
  }
]
```

---

## 🔧 Git Workflow (GenSpark AI Developer)

### 브랜치 전략
- **Main Branch**: `main` (프로덕션)
- **Development Branch**: `genspark_ai_developer` (AI 개발 작업)

### 🚨 필수 워크플로우

**모든 코드 변경 시 MANDATORY:**
1. **즉시 커밋**: 코드 수정 후 반드시 커밋
2. **리모트 동기화**: `git fetch origin main`
3. **병합/리베이스**: `git rebase origin/main`
4. **충돌 해결**: 리모트 코드 우선 (로컬 코드는 중요한 경우만 보존)
5. **커밋 스쿼시**: `git reset --soft HEAD~N && git commit -m "message"`
6. **푸시**: `git push -f origin genspark_ai_developer` (리베이스 후에는 force push)
7. **PR 생성/업데이트**: `genspark_ai_developer` → `main`
8. **PR 링크 공유**: 사용자에게 PR URL 제공

### 커밋 메시지 규칙
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `style`: 코드 스타일 (공백, 세미콜론 등)
- `docs`: 문서 변경
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 패키지 매니저 등

**예시:**
```bash
git commit -m "feat: Add reset button, separate back/home navigation, optimize PC display

- Add resetAttendance() function with confirmation dialog
- Implement separate '뒤로' (hierarchical back) and '🏠 홈' buttons
- Add PC media query (@min-width: 769px) with large fonts matching mobile
- Fix viewMode dependency in pre-absence useEffect for seating chart display
- Center PC view with 600px max-width container
- Ensure consistent button sizes and visibility across devices"
```

### Pull Request 템플릿
```markdown
## 변경 사항
- [ ] 기능 추가
- [ ] 버그 수정
- [ ] 리팩토링
- [ ] 문서 업데이트

## 설명
[변경 사항에 대한 상세 설명]

## 테스트
- [ ] 모바일 Chrome에서 테스트
- [ ] PC Chrome에서 테스트
- [ ] 터치 제스처 테스트
- [ ] 공결 등록 테스트

## 스크린샷
[필요시 스크린샷 첨부]

## 관련 이슈
Closes #[이슈 번호]
```

---

## 🐛 트러블슈팅 가이드

### 문제 1: 터치 제스처 떨림/튐
**증상**: 드래그 시 화면이 떨리거나 핀치줌 시 위치가 튐

**원인**: useState 다중 사용으로 재렌더링 충돌, 누적 델타 계산

**해결**:
1. useRef로 터치 상태 통합
2. 시작점 기준 절대 델타 계산
3. CSS 하드웨어 가속

**코드**:
```javascript
// useState (X)
const [isDragging, setIsDragging] = useState(false);

// useRef (O)
const touchStateRef = useRef({ isDragging: false });

// 누적 델타 (X)
const newX = panPosition.x + deltaX;

// 절대 델타 (O)
const newX = state.startPan.x + (touch.clientX - state.startPos.x);
```

### 문제 2: 공결이 좌석배치에 안 보임
**증상**: 목록보기(grid)에는 공결 표시, 좌석배치(seating)에는 미표시

**원인**: useEffect 의존성 배열에 `viewMode` 누락

**해결**:
```javascript
}, [currentDate, currentSession, students.length, selectedRoomName, viewMode]);
//                                                                    ^^^^^^^^ 추가
```

### 문제 3: 버튼 클릭이 안 되고 드래그만 됨
**증상**: 좌석 버튼 터치 시 항상 드래그로 인식

**원인**: 터치 시작 시 무조건 드래그 모드 진입

**해결**: 5px 임계값 적용
```javascript
const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
if (!state.hasMoved && distance > 5) {
  state.hasMoved = true;
  state.isDragging = true;
}

// TouchEnd에서 미이동 시 클릭 발생
if (!state.hasMoved && state.startTarget?.closest('.seat-btn')) {
  state.startTarget.closest('.seat-btn').click();
}
```

### 문제 4: Excel 파일명 깨짐
**증상**: `공결등록_샘플.xlsx` → `_____.xlsx`

**원인**: Content-Disposition 헤더 인코딩 문제

**해결**: RFC 5987 인코딩
```javascript
const filename = encodeURIComponent('공결등록_샘플.xlsx');
res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
```

### 문제 5: 드래그 시 빈 공간 노출
**증상**: 좌석배치 드래그 시 화면에 흰 여백 보임

**원인**: 경계 제한 없음

**해결**: `constrainPanPosition()` 함수
```javascript
const maxX = 0;
const minX = Math.min(0, containerWidth - wrapperWidth);
return { x: Math.max(minX, Math.min(maxX, newPan.x)), ... };
```

---

## 📈 성능 최적화 팁

### 1. React 최적화
```javascript
// 불필요한 재렌더링 방지
const MemoizedSeatButton = React.memo(SeatButton, (prev, next) => {
  return prev.student.id === next.student.id && 
         prev.status === next.status;
});

// useCallback으로 함수 메모이제이션
const handleSeatClick = useCallback((studentId) => {
  setAttendance(prev => ({
    ...prev,
    [studentId]: cycleStatus(prev[studentId])
  }));
}, []);

// useMemo로 계산 결과 캐싱
const attendanceStats = useMemo(() => {
  return {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length
  };
}, [attendance]);
```

### 2. CSS 최적화
```css
/* 하드웨어 가속 */
.seating-wrapper {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

/* Reflow 최소화 */
.student-card {
  contain: layout style paint;
}

/* 이미지 최적화 */
.floor-plan-img {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
```

### 3. 네트워크 최적화
```javascript
// 디바운스로 API 호출 최소화
const debouncedSave = debounce(async () => {
  await axios.post('/api/attendance', data);
}, 1000);

// 배치 요청
const saveBatch = async (attendanceRecords) => {
  await axios.post('/api/attendance/batch', { records: attendanceRecords });
};
```

---

## 🚀 배포 가이드

### 프로덕션 빌드
```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 빌드 파일을 백엔드에 복사
cp -r dist/* ../backend/public/

# 백엔드 실행
cd ../backend
NODE_ENV=production PORT=3001 node server.js
```

### Docker 배포
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# 프론트엔드 빌드
COPY frontend ./frontend
RUN cd frontend && npm ci && npm run build

# 백엔드 설정
COPY backend ./backend
RUN cp -r frontend/dist/* backend/public/

# 데이터 디렉토리
RUN mkdir -p backend/data

EXPOSE 3001
CMD ["node", "backend/server.js"]
```

### 환경 변수
```bash
# .env
PORT=3001
NODE_ENV=production
DATA_DIR=/app/backend/data
CORS_ORIGIN=https://attendance.school.com
```

---

## 📝 향후 개선 로드맵

### 단기 (1-2주)
- [ ] 컴포넌트 모듈화 (아토믹 디자인)
- [ ] Context API 도입 (전역 상태 관리)
- [ ] 테스트 코드 작성 (Jest + React Testing Library)

### 중기 (1개월)
- [ ] IndexedDB 오프라인 저장
- [ ] Service Worker PWA 변환
- [ ] WebSocket 실시간 동기화

### 장기 (2-3개월)
- [ ] AI 출결 패턴 분석 (TensorFlow.js)
- [ ] 예측 모델 (결석 위험도)
- [ ] 대시보드 인사이트 페이지

---

## 🔗 참고 자료

### 터치 제스처
- MDN Touch Events: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
- Pointer Events Polyfill: https://github.com/jquery/PEP

### React 성능
- React DevTools Profiler: https://react.dev/learn/react-developer-tools
- React.memo: https://react.dev/reference/react/memo
- useCallback: https://react.dev/reference/react/useCallback

### PWA
- Workbox: https://developers.google.com/web/tools/workbox
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

### AI/ML
- TensorFlow.js: https://www.tensorflow.org/js
- Brain.js: https://brain.js.org/

---

## 📞 문의 및 지원

이 문서는 모바일 출석체크 시스템의 **전체 개발 히스토리**와 **구현 세부사항**을 담고 있습니다. 
새로운 기능 추가 또는 수정 시 이 문서를 업데이트하여 최신 상태를 유지해주세요.

---

**최종 업데이트**: 2025-11-03  
**작성자**: GenSpark AI Developer  
**프로젝트 경로**: `/home/user/webapp`
