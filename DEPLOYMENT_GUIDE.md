# 🚀 자습실 출석 체크 시스템 - 배포 및 운영 가이드

## 📋 목차
1. [배포 방법 비교](#배포-방법-비교)
2. [Netlify 배포 (추천)](#netlify-배포-추천)
3. [학생 명단 업데이트 방법](#학생-명단-업데이트-방법)
4. [일상 운영 가이드](#일상-운영-가이드)
5. [문제 해결](#문제-해결)

---

## 배포 방법 비교

### 1️⃣ Netlify (정적 사이트 + Serverless Functions) ⭐ **추천**
**장점:**
- ✅ **무료 배포** 가능
- ✅ **간단한 배포 과정** (GitHub 연동)
- ✅ **자동 HTTPS** 제공
- ✅ **자동 배포** (코드 푸시 시 자동 업데이트)
- ✅ **좋은 성능** (CDN 제공)
- ✅ 이미 사용 중인 서비스 (https://ksa-night-study.netlify.app/)

**단점:**
- ⚠️ Serverless Functions 제한 (월 125,000 요청)
- ⚠️ 빌드 시간 제한 (월 300분)

**적합성:** ⭐⭐⭐⭐⭐ - **학교 자습실 시스템에 최적**

### 2️⃣ Vercel (정적 사이트 + Serverless)
**장점:**
- ✅ 무료 배포
- ✅ 빠른 성능
- ✅ 자동 배포

**단점:**
- ⚠️ Netlify보다 복잡한 설정

**적합성:** ⭐⭐⭐⭐

### 3️⃣ 전통적인 서버 (AWS, 네이버 클라우드 등)
**장점:**
- ✅ 완전한 제어
- ✅ 제한 없음

**단점:**
- ❌ **유료** (월 최소 5,000원~)
- ❌ 서버 관리 필요
- ❌ 복잡한 설정

**적합성:** ⭐⭐ - **학교에서는 비추천**

---

## Netlify 배포 (추천)

### 현재 상황
- ✅ 이미 Netlify 사이트가 있음: `https://ksa-night-study.netlify.app/`
- 🎯 목표: 이 사이트에 출석 시스템 배포

### 배포 준비

#### 1단계: 프로젝트 구조 변경
현재 구조는 백엔드와 프론트엔드가 분리되어 있습니다. Netlify에 배포하려면 통합이 필요합니다.

```
webapp/
├── netlify/
│   └── functions/          # Serverless Functions (백엔드 역할)
│       ├── students.js
│       ├── attendance.js
│       └── statistics.js
├── public/                 # 정적 파일
├── src/                    # React 소스
├── data/                   # 데이터 저장소
│   ├── attendance.json
│   └── students.json
├── netlify.toml           # Netlify 설정
└── package.json
```

#### 2단계: Netlify Functions로 백엔드 변환
기존 Express 서버를 Netlify Functions로 변환합니다.

**netlify/functions/students.js:**
```javascript
const students = require('../../students.json');

exports.handler = async (event, context) => {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    // 학생 데이터 조회
    const { grade, room } = event.queryStringParameters || {};
    
    let filteredStudents = students;
    if (grade) {
      filteredStudents = students.filter(s => s.학년 === parseInt(grade));
    }
    if (room) {
      filteredStudents = filteredStudents.filter(s => s.자습공간 === room);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(filteredStudents)
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
```

#### 3단계: netlify.toml 설정
```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  command = "cd frontend && npm run dev"
  port = 3000
  targetPort = 5173
  framework = "#custom"
```

### 배포 방법

#### 방법 A: GitHub 연동 (추천) ⭐
1. **GitHub Repository 생성**
   ```bash
   cd /home/user/webapp
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/[사용자명]/ksa-attendance.git
   git push -u origin main
   ```

2. **Netlify에서 GitHub 연동**
   - Netlify 로그인 (https://app.netlify.com/)
   - "Add new site" → "Import an existing project"
   - GitHub 선택 → Repository 선택
   - Build settings:
     - Build command: `cd frontend && npm install && npm run build`
     - Publish directory: `frontend/dist`
   - "Deploy site" 클릭

3. **자동 배포 설정 완료!**
   - 이제 GitHub에 푸시할 때마다 자동으로 배포됩니다
   - 예: `git push origin main` → 자동 배포

#### 방법 B: Netlify CLI 사용
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# Netlify 로그인
netlify login

# 기존 사이트에 연결
netlify link

# 배포
netlify deploy --prod
```

---

## 학생 명단 업데이트 방법

### 📝 시나리오: 2026년 새 학년 시작

#### 방법 1: Excel/CSV 파일 업데이트 (가장 쉬움) ⭐

**1단계: 학생 명단 파일 준비**
```csv
학번,이름,학년,자습공간
26-001,김철수,1,세미나A
26-002,이영희,1,세미나B
26-003,박민수,2,창조관 8층 면학실 A
...
```

**2단계: JSON 변환 스크립트 실행**
```bash
# webapp 폴더에 students_2026.csv 업로드 후
cd /home/user/webapp
node scripts/convert-students.js students_2026.csv
```

**convert-students.js 스크립트:**
```javascript
const fs = require('fs');
const csv = require('csv-parser');

const csvFile = process.argv[2] || 'students.csv';
const students = [];

fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (row) => {
    students.push({
      학번: row.학번,
      이름: row.이름,
      학년: parseInt(row.학년),
      자습공간: row.자습공간
    });
  })
  .on('end', () => {
    fs.writeFileSync('students.json', JSON.stringify(students, null, 2));
    console.log(`✅ ${students.length}명의 학생 데이터 변환 완료!`);
    console.log('📁 students.json 파일이 생성되었습니다.');
  });
```

**3단계: GitHub에 푸시 (자동 배포)**
```bash
git add students.json
git commit -m "2026학년도 학생 명단 업데이트"
git push origin main
```

→ **자동으로 사이트가 업데이트됩니다!** 🎉

#### 방법 2: 관리자 페이지에서 직접 업로드 (추천)

**관리자 페이지에 업로드 기능 추가:**

```jsx
// src/components/AdminUpload.jsx
import { useState } from 'react';
import axios from 'axios';

function AdminUpload() {
  const [file, setFile] = useState(null);
  
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/upload-students', formData);
      alert(`✅ ${response.data.count}명의 학생 데이터 업로드 완료!`);
      window.location.reload();
    } catch (error) {
      alert('❌ 업로드 실패: ' + error.message);
    }
  };
  
  return (
    <div className="upload-section">
      <h3>📤 학생 명단 업로드</h3>
      <input 
        type="file" 
        accept=".csv,.xlsx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>업로드</button>
      
      <div className="help">
        <p>📋 CSV 형식: 학번,이름,학년,자습공간</p>
        <p>예: 26-001,김철수,1,세미나A</p>
      </div>
    </div>
  );
}

export default AdminUpload;
```

#### 방법 3: 데이터베이스 직접 수정 (고급)
- Netlify Blobs 또는 MongoDB Atlas 사용
- 관리자 페이지에서 CRUD 기능 구현

### 📅 학년도 변경 체크리스트

**12월 (준비 단계)**
- [ ] 새 학년도 학생 명단 수집 (Excel/CSV)
- [ ] 자습공간 배정 확인
- [ ] 테스트 사이트에서 검증

**1월 (전환 단계)**
- [ ] 기존 출석 데이터 백업
  ```bash
  # 백업 폴더 생성
  mkdir -p backup/2025
  # 출석 데이터 백업
  cp data/attendance.json backup/2025/
  cp data/pre_absence.json backup/2025/
  ```
- [ ] 새 학생 명단 업로드
- [ ] 출석 데이터 초기화
  ```bash
  echo '[]' > data/attendance.json
  echo '[]' > data/pre_absence.json
  ```
- [ ] 테스트 출석 진행
- [ ] 선생님들께 안내

**2월 (운영 시작)**
- [ ] 정식 운영 시작
- [ ] 피드백 수집

---

## 일상 운영 가이드

### 📱 선생님 사용법 (간단 버전)

**1. 출석 체크 시작**
1. 사이트 접속: https://ksa-night-study.netlify.app/
2. "출석 체크" 버튼 클릭
3. 학년 선택 (1, 2, 3학년)
4. 자습공간 선택
5. 날짜 확인 (오늘 날짜 자동 선택)
6. 차수 선택 (1차 또는 2차)

**2. 출석 입력**
- **일괄 출석**: "전체 출석 처리" 버튼 클릭 → 모두 출석 처리
- **개별 결석**: 결석 학생 카드 터치 → 빨간색으로 변경
- **공결/병결**: 카드를 여러 번 터치
  - 1번: 출석 → 결석 (빨강)
  - 2번: 결석 → 공결 (주황)
  - 3번: 공결 → 병결 (보라)
  - 4번: 병결 → 출석 (초록)

**3. 저장**
- "저장" 버튼 클릭 → 완료!

### 👨‍💼 관리자 사용법

**1. 통계 조회**
1. "관리자" 메뉴 선택
2. 조회 기간 설정
3. 학년 선택 (선택사항)
4. "조회" 버튼 클릭

**2. 엑셀 다운로드**
- "엑셀 다운로드" 버튼 클릭
- 파일 저장 → 분석 가능

**3. 사전 결석 등록**
- 병결, 공결 사유가 미리 알려진 경우
- 관리자 페이지에서 사전 등록

### 🔧 정기 유지보수

**매주**
- [ ] 출석 데이터 확인
- [ ] 이상 징후 체크 (비정상적인 결석률 등)

**매월**
- [ ] 통계 리포트 생성
- [ ] 엑셀 다운로드 및 백업
- [ ] 학생/선생님 피드백 수집

**학기별**
- [ ] 데이터 백업
- [ ] 시스템 점검
- [ ] 개선사항 반영

---

## 문제 해결

### 1. 사이트가 안 열려요
**원인:**
- 인터넷 연결 문제
- Netlify 서버 문제

**해결:**
1. 인터넷 연결 확인
2. 다른 브라우저로 시도
3. Netlify Status 확인: https://www.netlifystatus.com/
4. 문제 지속 시: netlify support 문의

### 2. 출석 데이터가 저장 안 돼요
**원인:**
- API 오류
- 권한 문제

**해결:**
1. 브라우저 새로고침 (F5)
2. 캐시 삭제 후 재시도
3. 개발자 도구 콘솔 확인 (F12)
4. Netlify Functions 로그 확인

### 3. 학생 이름이 안 보여요
**원인:**
- students.json 파일 문제
- 배포 오류

**해결:**
1. GitHub에 students.json 파일 확인
2. Netlify 배포 로그 확인
3. 재배포 시도

### 4. 엑셀 다운로드가 안 돼요
**원인:**
- 브라우저 팝업 차단
- API 제한

**해결:**
1. 팝업 허용 설정
2. 다른 브라우저 시도
3. 데이터 양 확인 (너무 크면 분할 다운로드)

---

## 📞 지원 및 문의

### 긴급 문제
- GitHub Issues: [Repository URL]/issues
- 이메일: [관리자 이메일]

### 개선 요청
- Feature Request 등록
- 사용자 피드백 양식 작성

---

## 🎓 추가 학습 자료

### Netlify 관련
- [Netlify 공식 문서](https://docs.netlify.com/)
- [Netlify Functions 가이드](https://docs.netlify.com/functions/overview/)

### React 관련
- [React 공식 문서](https://react.dev/)
- [Vite 가이드](https://vitejs.dev/)

### Git/GitHub
- [GitHub 가이드](https://guides.github.com/)
- [Git 기초](https://git-scm.com/book/ko/v2)

---

## 🚀 다음 단계

### 권장 개선사항

**단기 (1개월)**
- [ ] 관리자 로그인 기능 추가
- [ ] 학생 명단 업로드 UI 개선
- [ ] 모바일 앱 PWA 변환

**중기 (3개월)**
- [ ] 알림 기능 (결석 학생 알림)
- [ ] 학부모 조회 기능
- [ ] 자동 리포트 생성

**장기 (6개월)**
- [ ] AI 기반 출석 패턴 분석
- [ ] 얼굴 인식 자동 출석
- [ ] 통합 학사 시스템 연동

---

**마지막 업데이트:** 2025-11-04  
**버전:** 1.0.0  
**작성자:** GenSpark AI Developer
