# 🚀 Netlify 업로드 완전 가이드

## 📦 이 패키지는 무엇인가요?

**KSA 자습실 출석 체크 시스템 v1.0**의 최신 버전을 Netlify에 업로드하기 위한 완전한 패키지입니다.

**배포 목표:** https://ksa-night-study.netlify.app/

---

## ⚡ 빠른 시작 (5분)

### 🎯 방법 1: 드래그 앤 드롭 (가장 쉬움!)

1. **이 폴더 찾기**
   - `netlify-v1.0-deploy` 폴더를 찾으세요
   - 이 폴더 안의 모든 파일이 업로드됩니다

2. **Netlify 웹사이트 접속**
   ```
   https://app.netlify.com/sites/ksa-night-study/deploys
   ```
   - 위 링크로 직접 이동
   - 또는: https://app.netlify.com/ → Sites → ksa-night-study 선택 → Deploys 탭

3. **로그인**
   - Netlify 계정으로 로그인

4. **드래그 앤 드롭!**
   - 화면 하단에 "Drag and drop your site folder here" 영역 찾기
   - **이 `netlify-v1.0-deploy` 폴더를 드래그하여 드롭**
   - 또는 "browse to upload" 클릭

5. **배포 완료 대기**
   - 약 1-2분 대기
   - "Site is live ✅" 메시지 확인

6. **확인**
   ```
   https://ksa-night-study.netlify.app/
   ```
   - 위 링크에서 업데이트된 사이트 확인

---

## 🖥️ 방법 2: Netlify CLI (개발자용)

### 설치 (한 번만)
```bash
# Node.js가 설치되어 있어야 함
npm install -g netlify-cli
```

### 배포
```bash
# 1. 이 폴더로 이동
cd netlify-v1.0-deploy

# 2. Netlify 로그인
netlify login
# → 브라우저에서 인증

# 3. 사이트 연결 (처음 한 번만)
netlify link
# → Site name: ksa-night-study

# 4. 배포!
netlify deploy --prod

# 5. 결과 확인
# ✅ Website URL: https://ksa-night-study.netlify.app/
```

---

## 📋 업로드할 파일 목록

아래 파일들이 모두 포함되어 있는지 확인하세요:

```
✅ index.html              (메인 HTML)
✅ vite.svg                (파비콘)
✅ netlify.toml            (설정 파일)
✅ README.md               (문서)
✅ assets/                 (JavaScript & CSS)
   ✅ index-[hash].css
   ✅ index-[hash].js
✅ floor-plans/            (평면도 이미지)
✅ backend/                (참고용 데이터)
   ✅ students.json
   ✅ seating_charts.json
   ✅ floor_plans.json
```

**중요:** 모든 파일을 함께 업로드해야 합니다!

---

## ✅ 배포 후 체크리스트

### 1단계: 기본 동작 확인
- [ ] https://ksa-night-study.netlify.app/ 접속
- [ ] 페이지가 로드되는가?
- [ ] 메인 화면이 보이는가?

### 2단계: 출석 체크 기능
- [ ] "출석 체크" 버튼 클릭
- [ ] 학년 선택 (1, 2, 3학년)
- [ ] 자습공간 선택
- [ ] 학생 목록이 표시되는가? ⚠️

### 3단계: 관리자 기능
- [ ] "관리자" 버튼 클릭
- [ ] 통계 페이지가 열리는가?

---

## ⚠️ 중요: v1.0의 제한사항

### 현재 상태
**v1.0은 프론트엔드 전용 버전입니다.**

- ✅ **작동하는 것:**
  - UI 표시
  - 화면 전환
  - 반응형 디자인

- ❌ **작동하지 않는 것:**
  - 학생 데이터 로드 (백엔드 API 없음)
  - 출석 데이터 저장
  - 통계 조회

### 해결 방법 2가지

#### 옵션 1: v1.0에 백엔드 추가 (복잡)
Netlify Functions를 추가하여 API 구현 (별도 작업 필요)

#### 옵션 2: v2.0 사용 (권장!) ⭐
**완전히 작동하는 오프라인 버전**
- 파일 위치: `/ksa-attendance-v2.0-new/teacher/attendance.html`
- 크기: 377.7 KB
- 특징:
  - ✅ 390명 학생 데이터 내장
  - ✅ localStorage 기반 저장
  - ✅ CSV 내보내기
  - ✅ 완전 오프라인 작동
  - ✅ 인터넷 불필요

**v2.0 사용법:**
1. `attendance.html` 파일 더블클릭
2. 브라우저에서 자동 실행
3. 바로 사용 시작!

---

## 🔧 문제 해결

### 문제 1: "Deploy failed"
**원인:** 파일 구조 문제

**해결:**
1. `netlify-v1.0-deploy` 폴더 자체를 업로드
2. 폴더 안의 파일만 선택하지 마세요
3. netlify.toml 파일이 포함되어 있는지 확인

### 문제 2: 흰 화면만 보임
**원인:** JavaScript 로드 실패

**해결:**
1. 브라우저 콘솔 열기 (F12)
2. 에러 메시지 확인
3. 하드 리프레시 (Ctrl+Shift+R)
4. assets 폴더가 제대로 업로드되었는지 Netlify에서 확인

### 문제 3: 학생 데이터가 안 보임
**원인:** 백엔드 API 없음 (정상)

**해결:**
- v1.0은 UI만 제공하는 버전입니다
- 완전한 기능을 원하시면 **v2.0 사용 권장**
- 또는 Netlify Functions 추가 필요 (별도 개발)

---

## 📊 배포 상태 확인

### Netlify 대시보드
```
https://app.netlify.com/sites/ksa-night-study
```

**확인 항목:**
- Deploys 탭 → 최신 배포 "Published" 상태
- Functions 탭 → (없음, 정상)
- Domain settings → ksa-night-study.netlify.app

### 브라우저 개발자 도구
1. 사이트 접속: https://ksa-night-study.netlify.app/
2. F12 키 눌러 개발자 도구 열기
3. Console 탭 확인
4. 에러 메시지 확인

---

## 🎯 다음 단계

### v1.0 개선 (선택사항)
백엔드 API를 추가하려면:
1. Netlify Functions 생성
2. Netlify Blobs로 데이터 저장
3. API 엔드포인트 구현

**예상 작업 시간:** 2-4시간

### v2.0 사용 (권장!)
바로 사용 가능한 완전한 버전:
- 파일: `ksa-attendance-v2.0-new/teacher/attendance.html`
- 설치: 필요 없음
- 사용: 파일 더블클릭 → 브라우저 자동 실행

---

## 📞 도움이 필요하신가요?

### 빠른 도움말
1. **배포가 안 돼요** → netlify.toml 파일 포함 여부 확인
2. **학생이 안 보여요** → 정상입니다. v2.0 사용 권장
3. **저장이 안 돼요** → 백엔드 없음. v2.0 사용 권장

### 추가 지원
- GitHub: https://github.com/wanjoos/wanjoos/issues
- 이메일: support@example.com

---

## 📝 요약

### ✅ v1.0 Netlify 배포
- **목적:** UI 프리뷰 및 디자인 확인
- **방법:** 드래그 앤 드롭
- **URL:** https://ksa-night-study.netlify.app/
- **제한:** 백엔드 없음 (데이터 로드/저장 불가)

### ⭐ v2.0 오프라인 버전 (권장)
- **목적:** 실제 출석 체크 작업
- **방법:** HTML 파일 더블클릭
- **제한:** 없음 (완전 작동)

---

**업로드 준비 완료!** 🎉

위의 "방법 1: 드래그 앤 드롭"을 따라하시면 5분 안에 배포 완료됩니다.

**최종 업데이트:** 2025-11-06  
**패키지 버전:** v1.0 (Latest)
