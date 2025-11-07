# 📦 파일 구성 목록

## 전체 파일 구조

```
attendance-system/
├── README.md                          # 주요 설치 및 운영 가이드
├── FILE_LIST.md                       # 이 파일 (파일 목록 및 설명)
├── students.json                      # 학생 명단 데이터
│
├── backend/                           # 백엔드 서버
│   ├── server.js                      # Express.js 서버 메인 파일
│   ├── package.json                   # 백엔드 의존성 목록
│   ├── seating_charts.json            # 좌석 배치 데이터
│   └── data/                          # 데이터 저장 폴더
│       ├── attendance.json            # 출석 기록 (초기값: 빈 배열)
│       └── pre_absence.json           # 공결 정보 (초기값: 빈 배열)
│
├── frontend/                          # 프론트엔드 애플리케이션
│   ├── index.html                     # HTML 진입점
│   ├── package.json                   # 프론트엔드 의존성 목록
│   ├── vite.config.js                 # Vite 빌드 도구 설정
│   └── src/                           # 소스 코드
│       ├── main.jsx                   # React 진입점
│       ├── App.jsx                    # 메인 애플리케이션 컴포넌트
│       ├── App.css                    # 메인 스타일시트
│       └── index.css                  # 글로벌 스타일
│
└── docs/                              # 문서 폴더
    ├── SECURITY_GUIDE.md              # 보안 담당자용 검토 가이드
    └── QUICK_START.md                 # 빠른 시작 가이드
```

---

## 주요 파일 설명

### 1. 루트 디렉토리

#### README.md
- **용도**: 전체 시스템 설치 및 운영 매뉴얼
- **대상**: 시스템 관리자, 설치 담당자
- **내용**: 
  - 시스템 개요
  - 설치 방법 (Windows/Linux)
  - 실행 방법 (수동/자동)
  - 보안 설정
  - 백업 및 유지보수
  - 문제 해결

#### students.json (390명 데이터 포함)
- **용도**: 학생 명단 데이터
- **형식**: JSON 배열
- **구조**:
  ```json
  [
    {
      "id": "24-006",
      "name": "학생이름",
      "location": "창조관 8층 면학실 A",
      "grade": 2
    }
  ]
  ```
- **수정 방법**: 텍스트 편집기로 직접 수정 또는 새 파일로 교체

---

### 2. backend/ (백엔드 서버)

#### server.js (870줄)
- **용도**: Express.js 기반 REST API 서버
- **포트**: 3001
- **주요 기능**:
  - 학생 명단 API (`/api/students`)
  - 출석 기록 API (`/api/attendance`)
  - 공결 등록 API (`/api/pre-absence`)
  - 통계 API (`/api/statistics`)
  - 파일 업로드 API
- **의존성**: Express, axios, multer, xlsx

#### package.json
- **용도**: npm 패키지 의존성 정의
- **주요 패키지**:
  ```json
  {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "xlsx": "^0.18.5",
    "date-fns": "^2.30.0"
  }
  ```

#### seating_charts.json (27KB)
- **용도**: 2-3학년 좌석 배치 데이터
- **포함 공간**:
  - 창조관 8층 면학실 A, B
  - 본관3층 도서관 우측 별실
  - 창조관 3층 면학실
  - 형설관 3층, 4층 EOZ

#### data/attendance.json (초기값: [])
- **용도**: 출석 기록 저장
- **자동 생성**: 출석 체크 시 자동으로 데이터 추가
- **백업 필요**: 중요 데이터이므로 정기 백업 권장

#### data/pre_absence.json (초기값: [])
- **용도**: 공결 사전 등록 정보
- **자동 생성**: 관리자가 공결 등록 시 자동 저장

---

### 3. frontend/ (프론트엔드 애플리케이션)

#### src/App.jsx (2,400줄)
- **용도**: React 메인 애플리케이션 컴포넌트
- **주요 기능**:
  - 로그인 인증
  - 학년/공간 선택
  - 출석 체크 (리스트/좌석배치)
  - 공결 사전 등록
  - 통계 조회
- **비밀번호**: 2095번 줄 근처에서 변경 가능

#### src/App.css (3,600줄)
- **용도**: 메인 스타일시트
- **특징**:
  - 모바일 최적화 레이아웃
  - 터치 친화적 버튼 크기
  - 다크 모드 스타일

#### package.json
- **용도**: 프론트엔드 의존성 정의
- **주요 패키지**:
  ```json
  {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.2",
    "date-fns": "^2.30.0"
  }
  ```

#### vite.config.js
- **용도**: Vite 빌드 도구 설정
- **중요 설정**:
  - 프록시 설정 (API 연결)
  - 호스트 설정 (외부 접속 허용)
  - HMR 설정 (개발 시 핫 리로딩)

---

### 4. docs/ (문서)

#### SECURITY_GUIDE.md
- **대상**: 보안 담당자
- **내용**:
  - 시스템 아키텍처
  - 보안 특징
  - 취약점 점검 체크리스트
  - 데이터 흐름
  - 법적 검토 사항
  - 승인 체크리스트

#### QUICK_START.md
- **대상**: 빠른 설치를 원하는 담당자
- **내용**:
  - 5분 빠른 설치
  - 자주 묻는 질문
  - 운영 모드 전환

---

## 필수 파일 vs 선택 파일

### 필수 파일 (시스템 구동에 반드시 필요)
```
✅ backend/server.js
✅ backend/package.json
✅ backend/seating_charts.json
✅ backend/data/attendance.json
✅ backend/data/pre_absence.json
✅ frontend/package.json
✅ frontend/vite.config.js
✅ frontend/index.html
✅ frontend/src/main.jsx
✅ frontend/src/App.jsx
✅ frontend/src/App.css
✅ frontend/src/index.css
✅ students.json
```

### 선택 파일 (참고 문서)
```
📄 README.md
📄 FILE_LIST.md
📄 docs/SECURITY_GUIDE.md
📄 docs/QUICK_START.md
```

---

## 수정 가능한 파일

### 자유롭게 수정 가능
- ✏️ `students.json` - 학생 명단 업데이트
- ✏️ `backend/data/attendance.json` - 출석 기록 초기화
- ✏️ `backend/data/pre_absence.json` - 공결 정보 초기화

### 주의해서 수정
- ⚠️ `frontend/src/App.jsx` - 비밀번호 변경 시
- ⚠️ `frontend/vite.config.js` - 서버 IP 변경 시

### 수정 금지
- 🚫 `backend/server.js` - 서버 로직 (버그 발생 가능)
- 🚫 `backend/seating_charts.json` - 좌석 배치 (레이아웃 깨짐)
- 🚫 `frontend/src/App.css` - 스타일 (화면 깨짐)

---

## 파일 크기 정보

```
전체 압축 파일: 약 5-10MB
압축 해제 후: 약 50-100MB (node_modules 포함)

주요 파일 크기:
- backend/server.js: 28KB
- frontend/src/App.jsx: 78KB
- frontend/src/App.css: 135KB
- students.json: 43KB
- backend/seating_charts.json: 27KB
```

---

## 설치 후 생성되는 파일

### npm install 실행 후:
```
backend/node_modules/       (약 30MB)
backend/package-lock.json   (자동 생성)
frontend/node_modules/      (약 200MB)
frontend/package-lock.json  (자동 생성)
```

### 프론트엔드 빌드 후:
```
frontend/dist/              (약 500KB, 배포용 정적 파일)
```

---

## 백업 권장 파일

정기 백업이 필요한 파일:
```
📦 students.json
📦 backend/data/attendance.json
📦 backend/data/pre_absence.json
```

---

## 문의

파일 관련 문의: GitHub Issues
버전: 1.0.0
