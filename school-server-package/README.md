# KSA 야간자습 출석체크 시스템 - 학교 서버 설치 가이드

## 📋 개요

이 시스템은 학교 내부 서버에서 운영되는 웹 기반 출석 체크 애플리케이션입니다.
**모든 데이터는 학교 서버 내부에만 저장되며, 외부 클라우드나 AI 서비스를 사용하지 않습니다.**

### 기술 스택
- **프론트엔드**: React.js (정적 웹페이지)
- **백엔드**: Node.js + Express.js
- **데이터 저장**: JSON 파일 (로컬 파일 시스템)
- **데이터베이스**: 없음 (별도 DB 서버 불필요)

### 보안 특징
- ✅ 외부 API 호출 없음
- ✅ 모든 데이터 로컬 저장
- ✅ 학교 내부망에서만 접근 가능
- ✅ 비밀번호 기반 인증
- ✅ 개인정보 외부 유출 없음

---

## 💻 시스템 요구사항

### 최소 사양
- **운영체제**: Windows 10/11 또는 Ubuntu 20.04 LTS 이상
- **CPU**: Intel Core i3 이상 (듀얼코어)
- **RAM**: 4GB 이상
- **저장공간**: 20GB 이상 (운영체제 포함)
- **네트워크**: 학교 내부망 연결

### 권장 사양
- **운영체제**: Ubuntu 22.04 LTS
- **CPU**: Intel Core i5 이상 (쿼드코어)
- **RAM**: 8GB 이상
- **저장공간**: 50GB 이상 (SSD 권장)

---

## 🚀 설치 방법

### 1단계: Node.js 설치

#### Windows 서버인 경우:
1. https://nodejs.org 접속
2. "LTS" 버전 다운로드 (현재 v20.x 권장)
3. 설치 파일 실행 후 모두 기본값으로 설치
4. 설치 확인:
   ```cmd
   node --version
   npm --version
   ```

#### Linux (Ubuntu) 서버인 경우:
```bash
# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

---

### 2단계: 프로그램 파일 배치

#### Windows:
1. `C:\attendance-system\` 폴더 생성
2. 받으신 파일 전체를 해당 폴더에 복사

```
C:\attendance-system\
├── backend\
├── frontend\
├── students.json
└── README.md
```

#### Linux:
```bash
# 폴더 생성 및 권한 설정
sudo mkdir -p /opt/attendance-system
sudo chown $USER:$USER /opt/attendance-system

# 파일 복사
cp -r 받은파일/* /opt/attendance-system/
```

---

### 3단계: 의존성 설치

#### Windows (PowerShell 또는 CMD):
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

**설치 시간**: 약 5-10분 소요 (인터넷 속도에 따라 다름)

---

### 4단계: 환경 설정

#### A. 학생 데이터 위치 확인
`students.json` 파일이 프로젝트 루트 또는 `backend/` 폴더에 있는지 확인

#### B. 서버 IP 주소 확인

**Windows:**
```cmd
ipconfig
```
결과에서 "IPv4 주소" 확인 (예: 192.168.1.100)

**Linux:**
```bash
ip addr show
```
또는
```bash
hostname -I
```

#### C. 프론트엔드 API 주소 설정

`frontend/vite.config.js` 파일을 열어 서버 IP 확인:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3001',  // 기본값 유지
    changeOrigin: true,
  }
}
```

**기본 설정 그대로 사용하시면 됩니다.**

---

### 5단계: 프론트엔드 빌드

```bash
# Windows
cd C:\attendance-system\frontend
npm run build

# Linux
cd /opt/attendance-system/frontend
npm run build
```

빌드 완료 후 `frontend/dist/` 폴더가 생성됩니다.

---

### 6단계: 서버 실행

#### 방법 1: 수동 실행 (테스트용)

**Windows - 두 개의 PowerShell 창 필요:**

창1 - 백엔드:
```cmd
cd C:\attendance-system\backend
node server.js
```

창2 - 프론트엔드:
```cmd
cd C:\attendance-system\frontend
npm run preview -- --host 0.0.0.0 --port 80
```

**Linux - 두 개의 터미널 필요:**

터미널1 - 백엔드:
```bash
cd /opt/attendance-system/backend
node server.js
```

터미널2 - 프론트엔드:
```bash
cd /opt/attendance-system/frontend
npm run preview -- --host 0.0.0.0 --port 80
```

#### 방법 2: 자동 실행 (운영용 - 권장)

##### Windows 서버:

1. **PM2 설치:**
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

2. **서비스 시작:**
```cmd
cd C:\attendance-system\backend
pm2 start server.js --name attendance-backend

cd C:\attendance-system\frontend
pm2 serve dist 80 --name attendance-frontend --spa

pm2 save
```

3. **서비스 상태 확인:**
```cmd
pm2 status
pm2 logs
```

##### Linux 서버 (systemd):

1. **백엔드 서비스 파일 생성:**
```bash
sudo nano /etc/systemd/system/attendance-backend.service
```

내용:
```ini
[Unit]
Description=KSA Attendance Backend
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

2. **프론트엔드 서비스 파일 생성:**
```bash
sudo nano /etc/systemd/system/attendance-frontend.service
```

내용:
```ini
[Unit]
Description=KSA Attendance Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/attendance-system/frontend/dist
ExecStart=/usr/bin/npx http-server -p 80 --silent
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. **서비스 활성화 및 시작:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable attendance-backend
sudo systemctl enable attendance-frontend
sudo systemctl start attendance-backend
sudo systemctl start attendance-frontend
```

4. **서비스 상태 확인:**
```bash
sudo systemctl status attendance-backend
sudo systemctl status attendance-frontend
```

---

### 7단계: 방화벽 설정

#### Windows 방화벽:
1. "제어판" → "Windows Defender 방화벽" → "고급 설정"
2. "인바운드 규칙" → "새 규칙"
3. "포트" 선택 → "TCP" → 포트 `80, 3001` 입력
4. "연결 허용" 선택
5. "규칙 이름": "Attendance System"

#### Linux (UFW):
```bash
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
sudo ufw status
```

---

### 8단계: 접속 테스트

#### 1. 서버 컴퓨터에서 테스트:
브라우저에서 `http://localhost` 접속

#### 2. 같은 네트워크의 다른 컴퓨터에서:
브라우저에서 `http://서버IP주소` 접속
- 예: `http://192.168.1.100`

#### 3. 스마트폰에서:
- 학교 Wi-Fi 연결
- 브라우저에서 `http://서버IP주소` 접속

#### 4. 로그인:
- 기본 비밀번호: `ksa2025`
- (비밀번호 변경 방법은 아래 참조)

---

## 🔒 보안 설정

### 1. 비밀번호 변경 (필수!)

`frontend/src/App.jsx` 파일 열기 → 약 2095번째 줄:

```javascript
const CORRECT_PASSWORD = 'ksa2025'; // ← 이 부분을 변경
```

변경 후:
```bash
# 프론트엔드 재빌드
cd frontend
npm run build

# 서비스 재시작
pm2 restart attendance-frontend  # Windows
sudo systemctl restart attendance-frontend  # Linux
```

### 2. IP 접근 제한 (권장)

nginx를 사용하는 경우 `/etc/nginx/sites-available/attendance`:
```nginx
server {
    listen 80;
    server_name 192.168.1.100;

    # 학교 내부 IP 대역만 허용
    allow 192.168.0.0/16;
    allow 10.0.0.0/8;
    deny all;

    location / {
        proxy_pass http://localhost:5173;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

### 3. HTTPS 설정 (선택사항)

자체 서명 인증서 생성:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/attendance-key.pem \
  -out /etc/ssl/certs/attendance-cert.pem
```

---

## 📊 데이터 관리

### 데이터 파일 위치

```
backend/data/
├── attendance.json        # 출석 기록
├── pre_absence.json       # 공결 사전등록
```

### 백업 스크립트

#### Windows (backup.bat):
```batch
@echo off
set BACKUP_DIR=C:\attendance-backups\%date:~0,4%%date:~5,2%%date:~8,2%
mkdir %BACKUP_DIR%
xcopy /E /I C:\attendance-system\backend\data %BACKUP_DIR%
echo Backup completed: %BACKUP_DIR%
```

#### Linux (backup.sh):
```bash
#!/bin/bash
BACKUP_DIR="/backup/attendance/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
cp -r /opt/attendance-system/backend/data/* $BACKUP_DIR/
echo "Backup completed: $BACKUP_DIR"
```

실행 권한 부여:
```bash
chmod +x backup.sh
```

자동 백업 (매일 자정):
```bash
crontab -e
# 추가:
0 0 * * * /opt/attendance-system/backup.sh
```

---

## 🆘 문제 해결

### 포트 충돌 발생 시

**포트 사용 확인:**
```bash
# Windows
netstat -ano | findstr :80
netstat -ano | findstr :3001

# Linux
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3001
```

**포트 변경:**
- 백엔드: `backend/server.js`에서 `PORT = 3001` 수정
- 프론트엔드: `npm run preview -- --port 8080` 처럼 다른 포트 사용

### 로그 확인

**PM2 (Windows):**
```cmd
pm2 logs attendance-backend
pm2 logs attendance-frontend
```

**systemd (Linux):**
```bash
sudo journalctl -u attendance-backend -f
sudo journalctl -u attendance-frontend -f
```

### 서비스 재시작

**PM2:**
```cmd
pm2 restart attendance-backend
pm2 restart attendance-frontend
```

**systemd:**
```bash
sudo systemctl restart attendance-backend
sudo systemctl restart attendance-frontend
```

---

## 📞 기술 지원

### 시스템 정보
- **개발자**: KSA IT 담당
- **버전**: 1.0
- **최종 업데이트**: 2025.11.05

### 로그 파일 위치
- **백엔드**: `backend/server.log` (자동 생성)
- **프론트엔드**: PM2 또는 systemd 로그

### 취약점 점검 체크리스트
- [ ] SQL Injection: N/A (데이터베이스 미사용)
- [ ] XSS: React 자동 이스케이프 처리
- [ ] CSRF: Same-Origin 정책 적용
- [ ] 인증: 비밀번호 기반 세션
- [ ] 데이터 암호화: 필요시 HTTPS 적용
- [ ] 접근 제한: 내부 IP 대역만 허용

---

## 📝 라이선스

이 프로그램은 학교 내부 사용 목적으로 개발되었습니다.
