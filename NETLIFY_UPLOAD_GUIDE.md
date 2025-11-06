# 🚀 Netlify 업로드 가이드

## 📦 업로드 방법 2가지

### 방법 1: GitHub 자동 배포 (추천) ⭐

이미 GitHub에 코드가 있으므로 이 방법이 가장 쉽습니다!

#### Step 1: Netlify 로그인
1. https://www.netlify.com/ 접속
2. "Sign up" 또는 "Log in" (GitHub 계정으로 로그인 추천)

#### Step 2: 기존 사이트 설정
1. Netlify 대시보드에서 `ksa-night-study` 사이트 선택
2. **Site settings** → **Build & deploy** 클릭

#### Step 3: GitHub 연동
1. **Link repository** 버튼 클릭
2. GitHub 선택
3. Repository 선택: `wanjoos/wanjoos`
4. Branch 선택: `main` 또는 `genspark_ai_developer`

#### Step 4: 빌드 설정
```
Base directory: frontend
Build command: npm install && npm run build
Publish directory: frontend/dist
```

#### Step 5: Deploy!
- "Deploy site" 클릭
- **이제 자동으로 배포됩니다!** 🎉
- Git에 푸시할 때마다 자동으로 업데이트됩니다

---

### 방법 2: 수동 업로드 (드래그 앤 드롭)

GitHub 없이 직접 파일을 업로드하는 방법입니다.

#### Step 1: 빌드 파일 생성

**터미널에서 실행:**
```bash
# 1. frontend 폴더로 이동
cd /home/user/webapp/frontend

# 2. 의존성 설치 (처음 한 번만)
npm install

# 3. 프로덕션 빌드
npm run build
```

이렇게 하면 `frontend/dist` 폴더가 생성됩니다.

#### Step 2: 배포 패키지 생성

**전체 프로젝트를 압축:**
```bash
cd /home/user/webapp

# 배포용 폴더 생성
mkdir -p deploy_package

# frontend 빌드 파일 복사
cp -r frontend/dist/* deploy_package/

# students.json 복사 (학생 데이터)
cp students.json deploy_package/

# backend 파일 복사 (Netlify Functions용)
mkdir -p deploy_package/netlify/functions
# 필요시 백엔드 파일도 포함

# 압축 (다운로드용)
cd /home/user/webapp
tar -czf netlify_deploy.tar.gz deploy_package/

# 또는 ZIP 파일로
zip -r netlify_deploy.zip deploy_package/
```

#### Step 3: 파일 다운로드

**A. AI Drive에 백업 (권장)**
```bash
# AI Drive에 복사
cp netlify_deploy.tar.gz /mnt/aidrive/
```

**B. 로컬로 다운로드**
- 샌드박스 파일 브라우저에서 다운로드
- 경로: `/home/user/webapp/netlify_deploy.tar.gz`

#### Step 4: Netlify에 업로드

1. https://app.netlify.com/ 로그인
2. 기존 사이트 선택: `ksa-night-study`
3. **Deploys** 탭 클릭
4. **"Drag and drop your site output folder here"** 영역에 파일 드롭
5. 또는 **"Deploy manually"** 클릭하여 `deploy_package` 폴더 선택
6. 업로드 완료 대기
7. 완료! 🎉

---

## 🔧 Netlify Functions 설정 (백엔드 포함)

현재 프로젝트는 백엔드(Express)와 프론트엔드(React)가 분리되어 있습니다.  
Netlify에 배포하려면 백엔드를 **Netlify Functions**로 변환해야 합니다.

### netlify.toml 파일 생성

프로젝트 루트에 `netlify.toml` 파일을 만들어야 합니다:

```toml
[build]
  base = "frontend"
  command = "npm install && npm run build"
  publish = "dist"
  functions = "../netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Netlify Functions 폴더 구조

```
webapp/
├── netlify/
│   └── functions/
│       ├── students.js        # 학생 데이터 API
│       ├── attendance.js      # 출석 API
│       ├── statistics.js      # 통계 API
│       └── seating.js         # 좌석 배치 API
├── frontend/
│   └── dist/                  # 빌드된 파일들
└── netlify.toml
```

---

## 📋 체크리스트: 첫 배포

### ✅ 방법 1 (GitHub 자동 배포) 사용 시

- [ ] GitHub 계정 있음
- [ ] 코드가 GitHub에 푸시됨
- [ ] Netlify 계정 생성
- [ ] Netlify에서 GitHub 연동
- [ ] 빌드 설정 완료
- [ ] 첫 배포 성공
- [ ] 사이트 접속 확인

### ✅ 방법 2 (수동 업로드) 사용 시

- [ ] 프론트엔드 빌드 완료
- [ ] deploy_package 폴더 생성
- [ ] 압축 파일 생성
- [ ] 파일 다운로드
- [ ] Netlify에 수동 업로드
- [ ] 사이트 접속 확인

---

## 🎯 추천 방법

### 학교에서 장기 운영한다면?
→ **방법 1 (GitHub 자동 배포)** 강력 추천!

**이유:**
- ✅ 한 번 설정하면 자동 배포
- ✅ 코드 변경 → Git 푸시 → 자동 업데이트
- ✅ 학생 명단 변경도 자동 반영
- ✅ 버전 관리 용이
- ✅ 롤백 쉬움

### 테스트만 해보고 싶다면?
→ **방법 2 (수동 업로드)** 괜찮음

**이유:**
- ✅ 빠르게 테스트 가능
- ✅ Git 지식 불필요
- ✅ 드래그 앤 드롭으로 간단

---

## 💡 실제 작업 흐름

### 시나리오: GitHub 자동 배포 (추천)

**초기 설정 (1회만):**
```bash
# 1. GitHub에 코드 푸시 (이미 완료)
git push origin main

# 2. Netlify 설정
# - Netlify 웹사이트에서 GitHub 연동
# - 빌드 설정 입력
# - 배포!
```

**일상 운영:**
```bash
# 학생 명단 변경
node scripts/convert-students.js students_2026.csv
git add students.json
git commit -m "학생 명단 업데이트"
git push origin main

# → 자동으로 Netlify가 새 버전 배포! 🎉
```

### 시나리오: 수동 업로드

**매번 업데이트 시:**
```bash
# 1. 빌드
cd /home/user/webapp/frontend
npm run build

# 2. 패키징
cd /home/user/webapp
rm -rf deploy_package
mkdir deploy_package
cp -r frontend/dist/* deploy_package/
cp students.json deploy_package/

# 3. 다운로드
tar -czf netlify_deploy.tar.gz deploy_package/

# 4. Netlify에 수동 업로드
# (웹 브라우저에서 드래그 앤 드롭)
```

---

## 🔍 문제 해결

### Q: npm install 에러
**A:**
```bash
cd /home/user/webapp/frontend
rm -rf node_modules package-lock.json
npm install
```

### Q: 빌드 에러
**A:**
```bash
# 빌드 로그 확인
npm run build

# 에러 메시지 확인하고 수정
# 주로 의존성 문제
```

### Q: Netlify에서 404 에러
**A:** `netlify.toml` 파일의 리다이렉트 설정 확인
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Q: API 호출 실패
**A:** 
- Netlify Functions가 설정되지 않았을 가능성
- 백엔드를 Netlify Functions로 변환 필요
- 또는 별도 백엔드 서버 필요

---

## 📞 다음 단계

### 즉시 할 일
1. **방법 선택**: GitHub 자동 배포 vs 수동 업로드
2. **테스트 배포**: 일단 배포해보기
3. **접속 확인**: https://ksa-night-study.netlify.app/

### 이후 작업
1. 커스텀 도메인 설정 (선택사항)
2. 환경 변수 설정 (필요시)
3. 모니터링 설정

---

**파일 위치:**
- 빌드 파일: `/home/user/webapp/frontend/dist/`
- 배포 패키지: `/home/user/webapp/deploy_package/`
- 압축 파일: `/home/user/webapp/netlify_deploy.tar.gz`

---

**마지막 업데이트:** 2025-11-04  
**버전:** 1.0.0
