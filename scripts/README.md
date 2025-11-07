# 📚 학생 명단 관리 스크립트

## 🎯 목적
매년 새 학년이 시작될 때 학생 명단을 쉽게 업데이트하기 위한 도구입니다.

## 📋 사용 방법

### 1단계: CSV 파일 준비

**Excel에서 작성:**
1. Excel 열기
2. 다음 형식으로 입력:

| 학번 | 이름 | 학년 | 자습공간 |
|------|------|------|----------|
| 26-001 | 김철수 | 1 | 세미나A |
| 26-002 | 이영희 | 1 | 세미나B |
| 26-003 | 박민수 | 2 | 창조관 8층 면학실 A |

3. "다른 이름으로 저장" → CSV 형식 선택
4. 파일명: `students_2026.csv`

**중요 사항:**
- 첫 번째 행은 반드시 헤더(학번,이름,학년,자습공간)
- 쉼표로 구분
- 한글 인코딩은 UTF-8 사용

### 2단계: 변환 스크립트 실행

```bash
# webapp 폴더로 이동
cd /home/user/webapp

# CSV 파일을 webapp 폴더에 복사
# 예: students_2026.csv

# 변환 실행
node scripts/convert-students.js students_2026.csv
```

**출력 예시:**
```
📖 CSV 파일 읽는 중...
✅ 390개의 행 파싱 완료

📊 학년별 학생 수:
   1학년: 132명
   2학년: 131명
   3학년: 127명
   총: 390명

✅ 변환 완료!
📁 출력 파일: /home/user/webapp/students.json

다음 단계:
1. students.json 파일 확인
2. git add students.json
3. git commit -m "학생 명단 업데이트"
4. git push origin main

🚀 배포가 자동으로 시작됩니다!
```

### 3단계: 배포

```bash
# Git에 추가
git add students.json

# 커밋
git commit -m "2026학년도 학생 명단 업데이트"

# GitHub에 푸시 (자동 배포)
git push origin main
```

→ **Netlify가 자동으로 새 명단을 배포합니다!** 🎉

## 📝 자습공간 이름 규칙

### 1학년 자습공간
- 세미나A, 세미나B, 세미나C
- 형설관 206, 207, 302, 303, 304, 305, 306, 307
- 형설관 402, 404, 405

### 2학년 자습공간
- 창조관 8층 면학실 A
- 창조관 8층 면학실 B

### 3학년 자습공간
- 본관3층 도서관 우측 별실
- 창조관 3층 면학실
- 형설관 3층 EOZ
- 형설관 4층 EOZ

**⚠️ 주의:** 자습공간 이름은 정확히 위와 같이 입력해야 합니다!

## 🔧 문제 해결

### 오류: "파일을 찾을 수 없습니다"
**원인:** CSV 파일 경로가 잘못됨  
**해결:** 
```bash
# 현재 위치 확인
pwd

# 파일 목록 확인
ls -la

# webapp 폴더에 CSV 파일이 있는지 확인
ls -la students_*.csv
```

### 오류: "파싱 오류"
**원인:** CSV 형식이 잘못됨  
**해결:**
- Excel에서 CSV 저장 시 "CSV UTF-8" 형식 선택
- 쉼표가 데이터 안에 포함되어 있지 않은지 확인
- 빈 줄이 있는지 확인

### 학년이 이상하게 나옴
**원인:** 학년 컬럼이 비어있음  
**해결:** CSV에서 학년 컬럼을 명시적으로 입력 (1, 2, 3)

## 📅 연간 일정

### 12월
- [ ] 내년도 학생 명단 수집
- [ ] Excel 작성 (학번, 이름, 학년, 자습공간)
- [ ] CSV 변환 테스트

### 1월
- [ ] 기존 데이터 백업
```bash
mkdir -p backup/2025
cp students.json backup/2025/
cp data/attendance.json backup/2025/
```
- [ ] 새 학생 명단 적용
```bash
node scripts/convert-students.js students_2026.csv
git add students.json
git commit -m "2026학년도 학생 명단"
git push origin main
```
- [ ] 출석 데이터 초기화
```bash
echo '[]' > data/attendance.json
echo '[]' > data/pre_absence.json
git add data/
git commit -m "출석 데이터 초기화"
git push origin main
```

### 2월
- [ ] 선생님들께 안내
- [ ] 시범 운영 및 피드백

## 🎓 예제 파일

`example_students.csv` 파일을 참고하세요!

```csv
학번,이름,학년,자습공간
26-001,김철수,1,세미나A
26-002,이영희,1,세미나B
...
```

## 🚀 고급 사용법

### 대량 데이터 처리
학생 수가 많은 경우 (500명 이상):
```bash
# 메모리 제한 증가
NODE_OPTIONS=--max-old-space-size=4096 node scripts/convert-students.js large_students.csv
```

### 특정 학년만 추출
```bash
# 스크립트 수정하거나 Excel에서 필터 사용
```

### 자동화 스크립트
```bash
#!/bin/bash
# update-students.sh

echo "🔄 학생 명단 업데이트 시작..."

# 변환
node scripts/convert-students.js students_new.csv

# Git 커밋
git add students.json
git commit -m "학생 명단 자동 업데이트 $(date +%Y-%m-%d)"
git push origin main

echo "✅ 완료! Netlify가 자동으로 배포합니다."
```

## 📞 지원

문제가 있으면:
1. 이 README를 다시 읽기
2. example_students.csv 파일 참고
3. GitHub Issues 등록
4. 관리자에게 문의

---

**마지막 업데이트:** 2025-11-04  
**버전:** 1.0.0
