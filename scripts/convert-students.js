#!/usr/bin/env node

/**
 * 학생 CSV 파일을 JSON으로 변환하는 스크립트
 * 
 * 사용법:
 *   node convert-students.js students.csv
 *   node convert-students.js students_2026.csv
 * 
 * CSV 형식:
 *   학번,이름,학년,자습공간
 *   26-001,김철수,1,세미나A
 *   26-002,이영희,1,세미나B
 */

const fs = require('fs');
const path = require('path');

// CSV 파서 (간단한 구현)
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return data;
}

// 메인 함수
function main() {
  // 파일 경로 확인
  const csvFile = process.argv[2];
  
  if (!csvFile) {
    console.error('❌ 사용법: node convert-students.js <CSV파일>');
    console.error('예: node convert-students.js students_2026.csv');
    process.exit(1);
  }

  const inputPath = path.resolve(csvFile);
  
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
  }

  console.log('📖 CSV 파일 읽는 중...');
  
  try {
    // CSV 파일 읽기
    const content = fs.readFileSync(inputPath, 'utf-8');
    const rows = parseCSV(content);
    
    console.log(`✅ ${rows.length}개의 행 파싱 완료`);

    // JSON 형식으로 변환
    const students = rows.map((row, index) => {
      // 학년 추출 (학번에서 또는 별도 컬럼에서)
      let grade = parseInt(row.학년);
      if (isNaN(grade) && row.학번) {
        // 학번에서 학년 추출 (예: 26-001 → 1학년으로 가정)
        const year = parseInt(row.학번.split('-')[0]);
        const currentYear = new Date().getFullYear() % 100;
        grade = currentYear - year + 1;
      }

      return {
        연번: index + 1,
        학번: row.학번 || '',
        이름: row.이름 || '',
        학년: grade || 1,
        자습공간: row.자습공간 || ''
      };
    });

    // 학년별 통계
    const gradeStats = students.reduce((acc, student) => {
      acc[student.학년] = (acc[student.학년] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 학년별 학생 수:');
    Object.keys(gradeStats).sort().forEach(grade => {
      console.log(`   ${grade}학년: ${gradeStats[grade]}명`);
    });
    console.log(`   총: ${students.length}명\n`);

    // JSON 파일로 저장
    const outputPath = path.resolve('students.json');
    fs.writeFileSync(outputPath, JSON.stringify(students, null, 2), 'utf-8');
    
    console.log(`✅ 변환 완료!`);
    console.log(`📁 출력 파일: ${outputPath}`);
    console.log('\n다음 단계:');
    console.log('1. students.json 파일 확인');
    console.log('2. git add students.json');
    console.log('3. git commit -m "학생 명단 업데이트"');
    console.log('4. git push origin main');
    console.log('\n🚀 배포가 자동으로 시작됩니다!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
main();
