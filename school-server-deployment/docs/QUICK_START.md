# ⚡ 빠른 시작 가이드

## 5분 안에 시작하기

### 전제 조건
✅ Node.js가 설치되어 있어야 합니다
✅ 관리자 권한이 있어야 합니다

---

## Windows 빠른 설치

### 1단계: 압축 해제
```
다운받은 파일을 C:\attendance-system 에 압축 해제
```

### 2단계: 의존성 설치 (5-10분)
```cmd
cd C:\attendance-system\backend
npm install

cd C:\attendance-system\frontend
npm install
```

### 3단계: 실행
```cmd
# 백엔드 시작 (첫 번째 명령 프롬프트)
cd C:\attendance-system\backend
node server.js

# 프론트엔드 시작 (두 번째 명령 프롬프트)
cd C:\attendance-system\frontend
npm run dev -- --host 0.0.0.0
```

### 4단계: 접속
```
브라우저에서 http://localhost:5173 접속
비밀번호: ksa2025
```

---

## Linux 빠른 설치

### 1단계: 압축 해제
```bash
sudo mkdir -p /opt/attendance-system
sudo tar -xzf attendance-system.tar.gz -C /opt/attendance-system
cd /opt/attendance-system
```

### 2단계: 의존성 설치
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3단계: 실행
```bash
# 백엔드
cd /opt/attendance-system/backend
node server.js &

# 프론트엔드
cd /opt/attendance-system/frontend
npm run dev -- --host 0.0.0.0 &
```

### 4단계: 접속
```
브라우저에서 http://서버IP:5173 접속
```

---

## 자주 묻는 질문

### Q1: Node.js가 설치되어 있지 않다면?
**A:** https://nodejs.org 에서 LTS 버전 다운로드 후 설치

### Q2: 포트 80으로 변경하려면?
**A:** 프론트엔드 실행 시:
```bash
npm run dev -- --host 0.0.0.0 --port 80
```
(Windows에서는 관리자 권한 필요)

### Q3: 다른 컴퓨터에서 접속이 안 된다면?
**A:** 
1. 방화벽에서 포트 5173, 3001 허용
2. 서버 IP 확인: `ipconfig` (Windows) 또는 `ip addr` (Linux)
3. 같은 네트워크에 연결되어 있는지 확인

### Q4: 비밀번호를 변경하려면?
**A:** `frontend/src/App.jsx` 파일에서:
```javascript
const CORRECT_PASSWORD = 'ksa2025'; // ← 이 부분 변경
```

### Q5: 학생 명단을 업데이트하려면?
**A:** `students.json` 파일을 새 파일로 교체 후 백엔드 재시작

---

## 운영 모드로 전환 (자동 시작)

### Windows: PM2 사용
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install

cd C:\attendance-system\backend
pm2 start server.js --name attendance-backend

cd C:\attendance-system\frontend
npm run build
pm2 serve dist 80 --name attendance-frontend --spa

pm2 save
```

### Linux: systemd 사용
자세한 내용은 README.md의 "실행 방법 - 방법 2" 참조

---

## 도움말

자세한 설치 가이드: README.md
보안 검토 가이드: docs/SECURITY_GUIDE.md
문제 해결: README.md의 "문제 해결" 섹션
