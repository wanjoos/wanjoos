const fs = require('fs');
const path = require('path');

// 파일 경로
const STUDENTS_FILE = path.join(__dirname, '../students.json');
const ABSENCE_FILE = path.join(__dirname, 'data/pre_absence.json');

// 학생 데이터 로드 및 변환 (서버와 동일한 로직)
const rawStudents = JSON.parse(fs.readFileSync(STUDENTS_FILE, 'utf-8'));
const studentsData = rawStudents.map((student, index) => ({
  id: String(index + 1), // 순번
  studentNumber: student.id,
  name: student.name,
  studyRoom: student.location,
  grade: student.grade
}));
console.log(`✅ 학생 데이터 로드: ${studentsData.length}명`);

// 공결 데이터 로드
let absences = JSON.parse(fs.readFileSync(ABSENCE_FILE, 'utf-8'));
console.log(`✅ 공결 데이터 로드: ${absences.length}건`);

let updatedCount = 0;
let notFoundCount = 0;

// 각 공결 데이터에 학생 정보 추가
absences = absences.map(absence => {
  // 이미 필드가 있으면 스킵
  if (absence.studentNumber && absence.studentName && absence.grade) {
    return absence;
  }
  
  // 학생 찾기
  const student = studentsData.find(s => s.id === absence.studentId);
  
  if (student) {
    updatedCount++;
    return {
      ...absence,
      studentNumber: student.studentNumber,
      studentName: student.name,
      grade: student.grade
    };
  } else {
    notFoundCount++;
    console.warn(`⚠️  학생을 찾을 수 없습니다: ID ${absence.studentId}`);
    return absence;
  }
});

// 저장
fs.writeFileSync(ABSENCE_FILE, JSON.stringify(absences, null, 2));

console.log('\n✅ 데이터 업데이트 완료!');
console.log(`   - 업데이트됨: ${updatedCount}건`);
console.log(`   - 학생 못찾음: ${notFoundCount}건`);
console.log(`   - 전체: ${absences.length}건`);
