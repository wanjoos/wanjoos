# 📥 Netlify 업로드 파일 다운로드 가이드

## ✅ 준비 완료된 파일들

다음 파일들이 `/home/user/webapp/` 폴더에 준비되었습니다:

### 1️⃣ 배포 패키지 (폴더)
- **경로:** `/home/user/webapp/deploy_package/`
- **내용:**
  - `index.html` - 메인 HTML 파일
  - `assets/` - CSS, JS 파일들
  - `floor-plans/` - 좌석 배치도 이미지
  - `students.json` - 학생 데이터
  - `vite.svg` - 아이콘

### 2️⃣ 압축 파일 (다운로드용)
- **TAR.GZ:** `/home/user/webapp/netlify_deploy_20251104.tar.gz` (398KB)
- **ZIP:** `/home/user/webapp/netlify_deploy_20251104.zip` (420KB)

### 3️⃣ 설정 파일
- **netlify.toml** - Netlify 빌드 설정 파일

---

## 📦 다운로드 방법

### 방법 A: 파일 브라우저 사용 (추천)

1. **왼쪽 파일 탐색기**에서 `/home/user/webapp/` 이동
2. 다음 파일을 찾기:
   - `netlify_deploy_20251104.zip` (Windows 사용자)
   - `netlify_deploy_20251104.tar.gz` (Mac/Linux 사용자)
3. 파일 **우클릭** → **다운로드**
4. 다운로드 완료!

### 방법 B: 명령어로 확인

파일이 제대로 준비되었는지 확인:
```bash
cd /home/user/webapp
ls -lh netlify_deploy_*
```

출력:
```
-rw-r--r-- 1 user user 398K Nov  4 04:12 netlify_deploy_20251104.tar.gz
-rw-r--r-- 1 user user 420K Nov  4 04:12 netlify_deploy_20251104.zip
```

---

## 🚀 Netlify에 업로드하는 방법

### 옵션 1: GitHub 자동 배포 (강력 추천!) ⭐

**장점:** 한 번 설정하면 영원히 자동!

#### Step 1: GitHub 푸시
```bash
cd /home/user/webapp
git add netlify.toml
git commit -m "Add Netlify configuration"
git push origin main
```

#### Step 2: Netlify 설정
1. https://app.netlify.com/ 로그인
2. "Add new site" → "Import an existing project"
3. "GitHub" 선택
4. Repository 선택: `wanjoos/wanjoos`
5. Branch: `main`
6. Build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/dist`
7. "Deploy site" 클릭!

#### Step 3: 완료!
- 3~5분 후 사이트가 배포됩니다
- 이후 Git 푸시할 때마다 **자동으로 재배포**됩니다! 🎉

---

### 옵션 2: 수동 업로드 (드래그 앤 드롭)

GitHub 없이 직접 업로드하는 방법입니다.

#### Step 1: 파일 압축 해제

**Windows:**
1. `netlify_deploy_20251104.zip` 다운로드
2. 우클릭 → "압축 풀기"
3. `deploy_package` 폴더 생성됨

**Mac/Linux:**
```bash
tar -xzf netlify_deploy_20251104.tar.gz
```

#### Step 2: Netlify 수동 배포

1. https://app.netlify.com/ 로그인
2. 기존 사이트 선택: `ksa-night-study`
3. **Deploys** 탭 클릭
4. 화면 하단의 드롭 영역으로 스크롤
5. **`deploy_package` 폴더 전체**를 드래그 앤 드롭
6. 업로드 완료 대기 (1~2분)
7. 완료! 🎉

**⚠️ 주의:** 폴더 자체가 아니라 **폴더 안의 내용**을 드롭해야 합니다!

---

## 📋 파일 구조 확인

압축을 풀면 다음과 같은 구조여야 합니다:

```
deploy_package/
├── index.html              # 메인 페이지
├── vite.svg               # 아이콘
├── students.json          # 학생 데이터 (390명)
├── assets/
│   ├── index-CGjMd9z7.css    # 스타일시트 (45KB)
│   └── index-De58piI5.js     # JavaScript (295KB)
└── floor-plans/
    ├── 본관3층.png
    ├── 창조관3층.png
    ├── 창조관8층A.png
    ├── 창조관8층B.png
    └── 형설관3,4층.png
```

---

## 🎯 백엔드 서버 설정

**⚠️ 중요:** 현재 빌드된 파일은 **프론트엔드만** 포함합니다!

출석 체크 시스템은 백엔드 서버가 필요합니다. 두 가지 옵션:

### 옵션 A: Netlify Functions 사용 (추천)
- 서버리스 함수로 백엔드 구현
- 별도 서버 불필요
- 무료 tier 사용 가능
- 설정 필요: `DEPLOYMENT_GUIDE.md` 참고

### 옵션 B: 별도 백엔드 서버
- Express 서버를 다른 곳에 호스팅
- Heroku, Railway, Render 등 사용
- API URL을 프론트엔드에 설정

**현재 상태:**
- ✅ 프론트엔드: 배포 준비 완료
- ⚠️ 백엔드: 별도 설정 필요

---

## ✅ 배포 확인 체크리스트

### 배포 전
- [ ] `netlify_deploy_20251104.zip` 다운로드 완료
- [ ] 압축 해제 완료
- [ ] `deploy_package/index.html` 파일 확인
- [ ] `deploy_package/students.json` 파일 확인 (390명)

### Netlify 업로드
- [ ] Netlify 로그인 완료
- [ ] 사이트 선택 또는 생성
- [ ] 파일 업로드 완료
- [ ] 배포 상태 "Published" 확인

### 배포 후 테스트
- [ ] 사이트 접속: https://ksa-night-study.netlify.app/
- [ ] 홈 화면 정상 표시
- [ ] "출석 체크" 버튼 클릭 가능
- [ ] 학년 선택 가능
- [ ] 학생 목록 표시 (각 학년별)
- [ ] 모바일에서도 접속 확인

### 백엔드 연결 (필요시)
- [ ] API 엔드포인트 설정
- [ ] 출석 저장 테스트
- [ ] 통계 조회 테스트

---

## 🔧 문제 해결

### Q: 다운로드한 파일이 없어요
**A:** 
```bash
cd /home/user/webapp
ls -la netlify_deploy_*
```
위 명령어로 파일 존재 확인

### Q: 압축 파일이 손상되었어요
**A:** 다시 생성하기
```bash
cd /home/user/webapp
rm netlify_deploy_*.zip
zip -r netlify_deploy_new.zip deploy_package/
```

### Q: Netlify에서 404 에러
**A:** 
- `netlify.toml` 파일이 제대로 업로드되었는지 확인
- 리다이렉트 설정 확인

### Q: API 호출이 안 돼요
**A:**
- 백엔드 서버 실행 확인
- API URL이 올바른지 확인
- CORS 설정 확인

---

## 📞 다음 단계

### 배포 성공 후
1. ✅ 사이트 주소 공유: https://ksa-night-study.netlify.app/
2. ✅ 선생님들께 `사용안내.md` 배포
3. ✅ 모바일 홈 화면에 추가 안내
4. ✅ 첫 출석 테스트

### 백엔드 설정 (필요시)
1. `DEPLOYMENT_GUIDE.md` 읽기
2. Netlify Functions 설정 또는
3. 별도 백엔드 서버 설정

---

## 📦 파일 재생성

파일을 다시 만들어야 한다면:

```bash
# 1. 프론트엔드 빌드
cd /home/user/webapp/frontend
npm run build

# 2. 배포 패키지 생성
cd /home/user/webapp
rm -rf deploy_package
mkdir deploy_package
cp -r frontend/dist/* deploy_package/
cp students.json deploy_package/

# 3. 압축
zip -r netlify_deploy_$(date +%Y%m%d_%H%M).zip deploy_package/

# 4. 다운로드
# 파일 브라우저에서 zip 파일 다운로드
```

---

## 🎉 요약

**준비된 파일:**
- ✅ `netlify_deploy_20251104.zip` (420KB)
- ✅ `netlify_deploy_20251104.tar.gz` (398KB)
- ✅ `deploy_package/` 폴더

**업로드 방법:**
1. **GitHub 자동 배포** (추천) - 설정 후 영원히 자동
2. **수동 업로드** - 드래그 앤 드롭

**다음 단계:**
- 파일 다운로드
- Netlify에 업로드
- 사이트 접속 확인
- 선생님들께 안내

---

**파일 위치:** `/home/user/webapp/`  
**생성 일시:** 2025-11-04  
**버전:** 1.0.0

**🚀 준비 완료! 이제 다운로드해서 Netlify에 업로드하세요!**
