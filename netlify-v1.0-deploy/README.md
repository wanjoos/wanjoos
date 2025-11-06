# 📚 KSA 자습실 출석 체크 시스템 v1.0 - Netlify 배포 패키지

## 🌐 배포 사이트
**현재 배포된 사이트:** https://ksa-night-study.netlify.app/

---

## 📦 패키지 내용

이 패키지는 Netlify에 바로 업로드 가능한 완전한 배포 버전입니다.

### 📁 파일 구조
```
netlify-v1.0-deploy/
├── index.html                    # 메인 HTML 파일
├── vite.svg                      # 파비콘
├── netlify.toml                  # Netlify 설정 파일
├── assets/                       # JavaScript & CSS 번들
│   ├── index-[hash].css          # 스타일시트
│   └── index-[hash].js           # React 앱 번들
├── floor-plans/                  # 평면도 이미지
└── backend/                      # 백엔드 데이터 (참고용)
    ├── students.json             # 390명 학생 데이터
    ├── seating_charts.json       # 좌석 배치도 6개
    ├── floor_plans.json          # 평면도 데이터
    └── data/
        ├── attendance.json       # 출석 데이터 (빈 배열)
        └── pre_absence.json      # 사전 결석 데이터 (빈 배열)
```

---

## 🚀 Netlify 업로드 방법

### 방법 1: Netlify 웹사이트에서 드래그 앤 드롭 ⭐ 추천

1. **Netlify 로그인**
   - https://app.netlify.com/ 접속
   - 계정 로그인

2. **기존 사이트 찾기**
   - Sites 목록에서 `ksa-night-study` 사이트 찾기
   - 또는 https://app.netlify.com/sites/ksa-night-study 로 직접 이동

3. **Deploys 탭으로 이동**
   - 사이트 대시보드에서 "Deploys" 탭 클릭

4. **파일 드래그 앤 드롭**
   - 화면 하단 "Need to update your site? Drag and drop your site folder here" 영역 찾기
   - **이 폴더 전체를 드래그하여 드롭 영역에 올리기**
   - 또는 "browse to upload" 클릭하여 폴더 선택

5. **배포 완료 대기**
   - 파일 업로드 진행 (약 1-2분)
   - "Site is live" 메시지 확인
   - https://ksa-night-study.netlify.app/ 에서 확인

---

### 방법 2: Netlify CLI 사용

```bash
# 1. Netlify CLI 설치 (한 번만)
npm install -g netlify-cli

# 2. Netlify 로그인
netlify login

# 3. 이 폴더로 이동
cd netlify-v1.0-deploy

# 4. 기존 사이트에 연결 (처음 한 번만)
netlify link

# Site name 입력: ksa-night-study

# 5. 배포 실행
netlify deploy --prod

# 6. 확인
# URL: https://ksa-night-study.netlify.app/
```

---

### 방법 3: GitHub 연동 자동 배포 (고급)

1. **GitHub Repository에 푸시**
   ```bash
   cd /path/to/project
   git add netlify-v1.0-deploy/
   git commit -m "Update v1.0 deployment package"
   git push origin main
   ```

2. **Netlify에서 GitHub 연동**
   - Netlify 사이트 설정 → Build & Deploy → Configure
   - Repository 연결
   - Build settings:
     - Base directory: `netlify-v1.0-deploy`
     - Build command: (비워두기)
     - Publish directory: `.`

3. **자동 배포 활성화**
   - 이후 `git push` 할 때마다 자동 배포됨

---

## 🎯 배포 후 확인사항

### 1. 사이트 접속 테스트
- [ ] https://ksa-night-study.netlify.app/ 접속
- [ ] 메인 화면 정상 표시
- [ ] "출석 체크" 버튼 작동
- [ ] "관리자" 버튼 작동

### 2. 출석 체크 기능 테스트
- [ ] 학년 선택 (1, 2, 3학년)
- [ ] 자습공간 선택
- [ ] 학생 목록 표시 확인
- [ ] 좌석 배치도 표시 (있는 경우)
- [ ] 출석 상태 변경 (출석 ↔ 결석)
- [ ] 저장 버튼 작동

### 3. 관리자 기능 테스트
- [ ] 통계 페이지 접속
- [ ] 기간 선택 기능
- [ ] 학년 필터 기능
- [ ] 엑셀 다운로드 기능
- [ ] 사전 결석 관리 기능

### 4. 모바일 테스트
- [ ] 스마트폰에서 접속
- [ ] 반응형 디자인 확인
- [ ] 터치 인터페이스 확인

---

## 📊 포함된 데이터

### 학생 데이터 (390명)
- **1학년**: 132명 (14개 자습공간)
- **2학년**: 131명 (2개 자습공간)
- **3학년**: 127명 (4개 자습공간)

### 좌석 배치도 (6개)
1. 창조관 3층 면학실 (66/72석)
2. 창조관 3층 면학실 추가1
3. 창조관 3층 면학실 추가2
4. 본관 3층 도서관 우측 별실
5. 형설관 3층 EOZ
6. 형설관 4층 EOZ

### 평면도 이미지 (6개)
- 각 좌석 배치도에 매핑된 평면도

---

## ⚙️ 설정 파일 설명

### netlify.toml
```toml
[build]
  publish = "."              # 현재 폴더 전체를 배포

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200               # SPA 라우팅 지원
```

**주요 설정:**
- ✅ **publish = "."**: 빌드된 파일이 이미 포함되어 있음
- ✅ **SPA 리디렉션**: 모든 경로를 index.html로 리디렉트
- ✅ **보안 헤더**: X-Frame-Options, Content-Type-Options 등
- ✅ **캐시 최적화**: 정적 리소스 1년 캐싱

---

## 🔧 문제 해결

### 1. 배포 실패
**증상:** "Deploy failed" 메시지

**해결:**
1. netlify.toml 파일 확인
2. 폴더 구조 확인 (index.html이 루트에 있어야 함)
3. Netlify 로그 확인

### 2. 사이트가 빈 화면
**증상:** 흰 화면만 표시

**해결:**
1. 브라우저 콘솔 확인 (F12)
2. assets 폴더가 제대로 업로드되었는지 확인
3. 하드 리프레시 (Ctrl+Shift+R)

### 3. 학생 데이터가 안 보임
**증상:** 학생 목록이 비어있음

**해결:**
- 현재 v1.0은 **프론트엔드 전용** 버전입니다
- 백엔드 API가 없어 학생 데이터 로드 불가
- **해결책**: Netlify Functions 추가 필요 (별도 작업)

**참고:** 완전한 오프라인 버전은 **v2.0** 사용 권장
- 파일: `/ksa-attendance-v2.0-new/teacher/attendance.html`
- localStorage 기반으로 완전 작동

---

## 📝 주요 변경사항 (v1.0 최신)

### 2025-11-06 업데이트
- ✅ 최신 학생 데이터 (390명)
- ✅ 좌석 배치도 6개 완전 통합
- ✅ 평면도 이미지 포함
- ✅ 반응형 디자인 개선
- ✅ 보안 헤더 추가
- ✅ 캐시 최적화

---

## 🎓 다음 단계

### v1.0 → v1.1 업그레이드 계획
- [ ] Netlify Functions 추가 (백엔드 API)
- [ ] Netlify Blobs로 데이터 저장
- [ ] 실시간 동기화 구현
- [ ] 관리자 로그인 기능

### v2.0 오프라인 버전
완전한 오프라인 작동을 원하시면 **v2.0** 사용 권장:
- 파일: `ksa-attendance-v2.0-new/teacher/attendance.html`
- 단일 HTML 파일 (377.7 KB)
- localStorage 기반
- 인터넷 연결 불필요
- CSV 내보내기 지원

---

## 📞 지원

**문제 발생 시:**
- GitHub Issues: https://github.com/wanjoos/wanjoos/issues
- 이메일: support@example.com

**최신 버전:**
- v1.0 (Netlify): https://ksa-night-study.netlify.app/
- v2.0 (Offline): attendance.html

---

**배포일:** 2025-11-06  
**버전:** v1.0 (Latest)  
**개발자:** GenSpark AI Developer  
**라이센스:** MIT
