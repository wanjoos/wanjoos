# 🏫 KSA 야간자습 출석체크 시스템 - 학교 서버 설치 가이드

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [필요 사양](#필요-사양)
3. [설치 방법](#설치-방법)
4. [실행 방법](#실행-방법)
5. [보안 설정](#보안-설정)
6. [백업 및 유지보수](#백업-및-유지보수)
7. [문제 해결](#문제-해결)

---

## 시스템 개요

### 특징
- ✅ **완전 내부망 운영** - 모든 데이터가 학교 서버에만 저장
- ✅ **외부 클라우드 미사용** - 개인정보 외부 유출 없음
- ✅ **단순한 구조** - 일반 웹 애플리케이션 형태
- ✅ **모바일 최적화** - 스마트폰/태블릿에서 사용

### 기술 스택
```
프론트엔드: React.js (정적 웹페이지)
백엔드: Node.js + Express.js
데이터 저장: JSON 파일 (로컬 저장)
포트: 3001 (백엔드), 5173 또는 80 (프론트엔드)
```

---

## 필요 사양

### 최소 사양
```
운영체제: Windows 10/11 또는 Ubuntu 20.04+
CPU: 듀얼코어 이상
RAM: 4GB 이상
저장공간: 20GB 이상 여유 공간
네트워크: 학교 내부망 연결
```

### 소프트웨어
```
Node.js v18 이상 (필수)
npm (Node.js와 함께 설치됨)
```

---

## 설치 방법

### STEP 1: Node.js 설치

#### Windows:
1. https://nodejs.org 접속
2. LTS 버전 다운로드 (예: v20.x.x)
3. 설치 파일 실행
4. 모든 옵션 기본값으로 설치

설치 확인:
```cmd
node --version
npm --version
```

#### Linux (Ubuntu):
```bash
# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

---

### STEP 2: 프로그램 파일 배치

#### Windows:
```cmd
# C 드라이브에 폴더 생성
mkdir C:\attendance-system

# 다운받은 파일을 C:\attendance-system 에 압축 해제
# 최종 구조:
# C:\attendance-system\
#   ├── backend\
#   ├── frontend\
#   ├── students.json
#   └── README.md
```

#### Linux:
```bash
# /opt 에 폴더 생성
sudo mkdir -p /opt/attendance-system
sudo chown $USER:$USER /opt/attendance-system

# 다운받은 파일을 /opt/attendance-system 에 압축 해제
cd /opt/attendance-system
```

---

### STEP 3: 의존성 패키지 설치

#### Windows (명령 프롬프트 또는 PowerShell):
```cmd
cd C:\attendance-system\backend
npm install

cd C:\attendance-system\frontend
npm install
```

#### Linux:
```bash
cd /opt/attendance-system/backend
npm install

cd /opt/attendance-system/frontend
npm install
```

**예상 소요 시간**: 약 5-10분 (인터넷 속도에 따라)

---

### STEP 4: 환경 설정

#### 4.1 서버 IP 주소 확인

**Windows:**
```cmd
ipconfig
```
→ "IPv4 주소" 확인 (예: 192.168.1.100)

**Linux:**
```bash
ip addr show
```
→ inet 주소 확인 (예: 192.168.1.100)

#### 4.2 프론트엔드 설정 파일 수정

**frontend/vite.config.js 파일 열기:**
```javascript
// 14-16번 줄의 allowedHosts를 서버 IP로 수정
allowedHosts: [
  '192.168.1.100',  // ← 여기에 실제 서버 IP 입력
  '.yourschool.ac.kr'  // ← 도메인이 있으면 입력
]
```

#### 4.3 비밀번호 변경 (선택사항)

**frontend/src/App.jsx 파일:**
```javascript
// 2095번 줄 근처
const CORRECT_PASSWORD = 'ksa2025'; // ← 원하는 비밀번호로 변경
```

---

## 실행 방법

### 방법 1: 수동 실행 (테스트용)

#### Windows:
```cmd
# 백엔드 실행 (첫 번째 명령 프롬프트)
cd C:\attendance-system\backend
node server.js

# 프론트엔드 실행 (두 번째 명령 프롬프트)
cd C:\attendance-system\frontend
npm run dev -- --host 0.0.0.0
```

#### Linux:
```bash
# 백엔드 실행 (첫 번째 터미널)
cd /opt/attendance-system/backend
node server.js

# 프론트엔드 실행 (두 번째 터미널)
cd /opt/attendance-system/frontend
npm run dev -- --host 0.0.0.0
```

**접속 테스트:**
- 같은 컴퓨터: http://localhost:5173
- 다른 컴퓨터: http://서버IP:5173

---

### 방법 2: 자동 실행 (운영용 - 추천)

#### Windows: PM2 사용

**1. PM2 설치:**
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

**2. 서비스 등록 및 실행:**
```cmd
cd C:\attendance-system

# 백엔드 시작
cd backend
pm2 start server.js --name attendance-backend

# 프론트엔드 빌드
cd ..\frontend
npm run build

# 프론트엔드 서비스 시작 (포트 80)
pm2 serve dist 80 --name attendance-frontend --spa

# 자동 시작 설정 저장
pm2 save
```

**3. PM2 관리 명령어:**
```cmd
pm2 list              # 실행 중인 서비스 확인
pm2 logs              # 로그 보기
pm2 restart all       # 모든 서비스 재시작
pm2 stop all          # 모든 서비스 중지
pm2 delete all        # 모든 서비스 삭제
```

#### Linux: systemd 사용

**1. 백엔드 서비스 파일 생성:**
```bash
sudo nano /etc/systemd/system/attendance-backend.service
```

다음 내용 입력:
```ini
[Unit]
Description=KSA Attendance Backend Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/attendance-system/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**2. 프론트엔드 빌드:**
```bash
cd /opt/attendance-system/frontend
npm run build
```

**3. 프론트엔드 서비스 파일 생성:**
```bash
sudo nano /etc/systemd/system/attendance-frontend.service
```

다음 내용 입력:
```ini
[Unit]
Description=KSA Attendance Frontend Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/attendance-system/frontend/dist
ExecStart=/usr/bin/npx http-server -p 80 -c-1
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**4. 서비스 활성화 및 시작:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable attendance-backend
sudo systemctl enable attendance-frontend
sudo systemctl start attendance-backend
sudo systemctl start attendance-frontend
```

**5. 서비스 관리 명령어:**
```bash
sudo systemctl status attendance-backend    # 상태 확인
sudo systemctl restart attendance-backend   # 재시작
sudo systemctl stop attendance-backend      # 중지
sudo systemctl logs -f attendance-backend   # 로그 보기
```

---

## 보안 설정

### 1. 방화벽 설정

#### Windows 방화벽:
```
1. "제어판" → "Windows Defender 방화벽" → "고급 설정"
2. "인바운드 규칙" → "새 규칙" 클릭
3. 규칙 유형: "포트" 선택
4. 프로토콜: TCP, 특정 로컬 포트: 80, 3001, 5173
5. 작업: "연결 허용"
6. 적용 대상: "도메인", "개인", "공용" 모두 체크
```

#### Linux (UFW):
```bash
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5173/tcp
sudo ufw enable
sudo ufw status
```

### 2. 접근 제한 (선택사항)

#### nginx를 통한 IP 제한:
```bash
# nginx 설치
sudo apt install nginx

# 설정 파일 생성
sudo nano /etc/nginx/sites-available/attendance
```

설정 내용:
```nginx
server {
    listen 80;
    server_name 192.168.1.100;

    # 학교 내부망 IP만 허용 (예: 192.168.x.x)
    allow 192.168.0.0/16;
    deny all;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

활성화:
```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 백업 및 유지보수

### 자동 백업 스크립트

#### Windows (backup.bat):
```batch
@echo off
set BACKUP_DIR=C:\attendance-backups\%date:~0,4%%date:~5,2%%date:~8,2%
mkdir %BACKUP_DIR%
xcopy /E /I C:\attendance-system\backend\data %BACKUP_DIR%\data
copy C:\attendance-system\students.json %BACKUP_DIR%\
echo Backup completed: %BACKUP_DIR%
```

**작업 스케줄러 등록:**
1. "작업 스케줄러" 실행
2. "작업 만들기" 클릭
3. 트리거: 매일 자정
4. 동작: backup.bat 실행

#### Linux (backup.sh):
```bash
#!/bin/bash
BACKUP_DIR="/backup/attendance/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r /opt/attendance-system/backend/data $BACKUP_DIR/
cp /opt/attendance-system/students.json $BACKUP_DIR/
echo "Backup completed: $BACKUP_DIR"
```

**crontab 등록 (매일 자정):**
```bash
chmod +x /opt/attendance-system/backup.sh
crontab -e

# 다음 줄 추가:
0 0 * * * /opt/attendance-system/backup.sh
```

### 로그 확인

#### 백엔드 로그:
```bash
# Windows
type C:\attendance-system\backend\server.log

# Linux
tail -f /opt/attendance-system/backend/server.log
```

---

## 문제 해결

### 1. 서버가 시작되지 않을 때

**포트 충돌 확인:**
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Linux
netstat -tulpn | grep 3001
netstat -tulpn | grep 5173
```

**해결 방법:**
- 해당 포트를 사용하는 프로세스 종료
- 또는 다른 포트로 변경

### 2. 다른 컴퓨터에서 접속 안 될 때

**확인사항:**
1. 서버 컴퓨터 방화벽 설정 확인
2. 서버 IP 주소 정확한지 확인 (`ipconfig` 또는 `ip addr`)
3. 같은 네트워크에 연결되어 있는지 확인
4. 서비스가 실행 중인지 확인 (`pm2 list` 또는 `systemctl status`)

### 3. 학생 명단 업데이트

**students.json 파일 교체:**
```bash
# Windows
copy 새로운_students.json C:\attendance-system\students.json

# Linux
cp 새로운_students.json /opt/attendance-system/students.json
```

**서비스 재시작:**
```bash
# Windows (PM2)
pm2 restart attendance-backend

# Linux
sudo systemctl restart attendance-backend
```

### 4. 출석 데이터 초기화

```bash
# Windows
echo [] > C:\attendance-system\backend\data\attendance.json
echo [] > C:\attendance-system\backend\data\pre_absence.json

# Linux
echo '[]' > /opt/attendance-system/backend/data/attendance.json
echo '[]' > /opt/attendance-system/backend/data/pre_absence.json
```

---

## 보안 담당자용 점검 체크리스트

### 취약점 점검 항목
```
✅ SQL Injection: N/A (데이터베이스 미사용, JSON 파일 사용)
✅ XSS (Cross-Site Scripting): React의 자동 이스케이프 처리
✅ CSRF (Cross-Site Request Forgery): Same-Origin 정책 적용
✅ 인증: 세션 기반 비밀번호 인증
✅ 데이터 저장: 모든 데이터 로컬 서버에만 저장
✅ 외부 통신: 없음 (완전 내부망 운영)
```

### 데이터 저장 위치
```
학생 명단: /backend/../students.json
출석 기록: /backend/data/attendance.json
공결 정보: /backend/data/pre_absence.json
좌석 배치: /backend/seating_charts.json
```

### 네트워크 구성도
```
[교사 스마트폰/PC] ←→ [학교 Wi-Fi/내부망] ←→ [학교 서버]
                                              ├─ Frontend (Port 80/5173)
                                              ├─ Backend (Port 3001)
                                              └─ Data Files (로컬 저장)
```

---

## 지원 및 문의

- **GitHub**: https://github.com/wanjoos/wanjoos
- **버전**: 1.0.0
- **최종 업데이트**: 2025-11-05

---

## 라이선스

이 소프트웨어는 학교 내부 사용 목적으로 제공됩니다.
