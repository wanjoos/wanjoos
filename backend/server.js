const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 데이터 저장 경로
const DATA_DIR = path.join(__dirname, 'data');
const STUDENTS_FILE = path.join(__dirname, '../students_data.csv');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const ABSENCE_FILE = path.join(DATA_DIR, 'pre_absence.json');

// 디렉토리 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 초기 데이터 파일 생성
if (!fs.existsSync(ATTENDANCE_FILE)) {
  fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(ABSENCE_FILE)) {
  fs.writeFileSync(ABSENCE_FILE, JSON.stringify([], null, 2));
}

// CSV 파싱 및 학생 데이터 로드
let studentsData = [];

function loadStudentsData() {
  return new Promise((resolve, reject) => {
    const students = [];
    fs.createReadStream(STUDENTS_FILE)
      .pipe(csv())
      .on('data', (row) => {
        // BOM 제거
        const keys = Object.keys(row);
        const cleanedRow = {};
        keys.forEach(key => {
          const cleanKey = key.replace(/^\ufeff/, '');
          cleanedRow[cleanKey] = row[key];
        });
        
        // 학년 추출 (입학년도에서 계산: 24=1학년, 23=2학년, 22=3학년)
        const studentNumber = cleanedRow['학번'];
        let grade = null;
        if (studentNumber) {
          const year = parseInt(studentNumber.split('-')[0]);
          if (year === 24) grade = 1;
          else if (year === 23) grade = 2;
          else if (year === 22 || year === 4) grade = 3; // 22 또는 오타인 04
          else grade = 1; // 기본값
        }
        
        students.push({
          id: cleanedRow['연번'],
          studentNumber: studentNumber,
          name: cleanedRow['이름'],
          studyRoom: cleanedRow['자습공간'],
          grade: grade
        });
      })
      .on('end', () => {
        studentsData = students;
        console.log(`✅ 학생 데이터 로드 완료: ${students.length}명`);
        resolve(students);
      })
      .on('error', reject);
  });
}

// 학년별 자습공간 구조
const studyRoomStructure = {
  1: {
    grade: 1,
    rooms: [
      { id: 'small', name: '창조관 8층 작은 면학실', hasSeating: false },
      { id: 'large', name: '창조관 8층 큰 면학실', hasSeating: false }
    ]
  },
  2: {
    grade: 2,
    rooms: [
      { id: 'main', name: '창조관 3층 면학실 (66/72)', hasSeating: true },
      { id: 'extra1', name: '창조관 3층 면학실 추가1', hasSeating: true },
      { id: 'extra2', name: '창조관 3층 면학실 추가2', hasSeating: true }
    ]
  },
  3: {
    grade: 3,
    rooms: [
      { id: 'main', name: '창조관 3층 면학실 (66/72)', hasSeating: true },
      { id: 'extra1', name: '창조관 3층 면학실 추가1', hasSeating: true },
      { id: 'extra2', name: '창조관 3층 면학실 추가2', hasSeating: true }
    ]
  }
};

// API 엔드포인트

// 학년별 구조 조회
app.get('/api/grades', (req, res) => {
  res.json(studyRoomStructure);
});

// 특정 학년의 자습공간 목록
app.get('/api/grades/:grade/rooms', (req, res) => {
  const grade = parseInt(req.params.grade);
  const gradeData = studyRoomStructure[grade];
  
  if (!gradeData) {
    return res.status(404).json({ error: '학년을 찾을 수 없습니다.' });
  }
  
  res.json(gradeData.rooms);
});

// 특정 자습공간의 학생 목록
app.get('/api/students', (req, res) => {
  const { grade, room } = req.query;
  
  let filteredStudents = studentsData;
  
  if (grade) {
    filteredStudents = filteredStudents.filter(s => s.grade === parseInt(grade));
  }
  
  if (room) {
    filteredStudents = filteredStudents.filter(s => s.studyRoom === room);
  }
  
  res.json(filteredStudents);
});

// 출석 데이터 저장
app.post('/api/attendance', (req, res) => {
  try {
    const { date, session, room, attendanceData } = req.body;
    
    if (!date || !session || !room || !attendanceData) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }
    
    // 기존 출석 데이터 로드
    let allAttendance = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf-8'));
    
    // 같은 날짜, 세션, 공간의 기존 데이터 찾기
    const existingIndex = allAttendance.findIndex(
      a => a.date === date && a.session === session && a.room === room
    );
    
    const newRecord = {
      id: existingIndex >= 0 ? allAttendance[existingIndex].id : uuidv4(),
      date,
      session,
      room,
      attendanceData,
      timestamp: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      allAttendance[existingIndex] = newRecord;
    } else {
      allAttendance.push(newRecord);
    }
    
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(allAttendance, null, 2));
    
    res.json({ success: true, message: '출석 데이터가 저장되었습니다.' });
  } catch (error) {
    console.error('출석 저장 오류:', error);
    res.status(500).json({ error: '출석 데이터 저장에 실패했습니다.' });
  }
});

// 출석 데이터 조회
app.get('/api/attendance', (req, res) => {
  try {
    const { date, session, room } = req.query;
    let attendance = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf-8'));
    
    if (date) {
      attendance = attendance.filter(a => a.date === date);
    }
    if (session) {
      attendance = attendance.filter(a => a.session === session);
    }
    if (room) {
      attendance = attendance.filter(a => a.room === room);
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('출석 조회 오류:', error);
    res.status(500).json({ error: '출석 데이터 조회에 실패했습니다.' });
  }
});

// 사전 결석 관리
app.post('/api/pre-absence', (req, res) => {
  try {
    const { date, studentId, reason } = req.body;
    
    if (!date || !studentId || !reason) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }
    
    let absences = JSON.parse(fs.readFileSync(ABSENCE_FILE, 'utf-8'));
    
    const newAbsence = {
      id: uuidv4(),
      date,
      studentId,
      reason,
      timestamp: new Date().toISOString()
    };
    
    absences.push(newAbsence);
    fs.writeFileSync(ABSENCE_FILE, JSON.stringify(absences, null, 2));
    
    res.json({ success: true, message: '사전 결석이 등록되었습니다.' });
  } catch (error) {
    console.error('사전 결석 등록 오류:', error);
    res.status(500).json({ error: '사전 결석 등록에 실패했습니다.' });
  }
});

// 사전 결석 조회
app.get('/api/pre-absence', (req, res) => {
  try {
    const { date, studentId } = req.query;
    let absences = JSON.parse(fs.readFileSync(ABSENCE_FILE, 'utf-8'));
    
    if (date) {
      absences = absences.filter(a => a.date === date);
    }
    if (studentId) {
      absences = absences.filter(a => a.studentId === studentId);
    }
    
    res.json(absences);
  } catch (error) {
    console.error('사전 결석 조회 오류:', error);
    res.status(500).json({ error: '사전 결석 조회에 실패했습니다.' });
  }
});

// 사전 결석 삭제
app.delete('/api/pre-absence/:id', (req, res) => {
  try {
    const { id } = req.params;
    let absences = JSON.parse(fs.readFileSync(ABSENCE_FILE, 'utf-8'));
    
    absences = absences.filter(a => a.id !== id);
    fs.writeFileSync(ABSENCE_FILE, JSON.stringify(absences, null, 2));
    
    res.json({ success: true, message: '사전 결석이 삭제되었습니다.' });
  } catch (error) {
    console.error('사전 결석 삭제 오류:', error);
    res.status(500).json({ error: '사전 결석 삭제에 실패했습니다.' });
  }
});

// 통계 조회
app.get('/api/statistics', (req, res) => {
  try {
    const { startDate, endDate, grade, room } = req.query;
    let attendance = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf-8'));
    
    // 필터링
    if (startDate && endDate) {
      attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
    }
    if (room) {
      attendance = attendance.filter(a => a.room === room);
    }
    
    // 학생별 출석 통계 계산
    const studentStats = {};
    
    studentsData.forEach(student => {
      if (grade && student.grade !== parseInt(grade)) return;
      if (room && student.studyRoom !== room) return;
      
      studentStats[student.id] = {
        student: student,
        present: 0,
        absent: 0,
        excused: 0,
        sick: 0,
        total: 0
      };
    });
    
    // 출석 데이터 집계
    attendance.forEach(record => {
      Object.entries(record.attendanceData).forEach(([studentId, status]) => {
        if (studentStats[studentId]) {
          studentStats[studentId].total++;
          
          if (status === 'present') studentStats[studentId].present++;
          else if (status === 'absent') studentStats[studentId].absent++;
          else if (status === 'excused') studentStats[studentId].excused++;
          else if (status === 'sick') studentStats[studentId].sick++;
        }
      });
    });
    
    res.json({
      statistics: Object.values(studentStats),
      totalRecords: attendance.length
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({ error: '통계 조회에 실패했습니다.' });
  }
});

// 엑셀 다운로드
app.get('/api/export/excel', (req, res) => {
  try {
    const { startDate, endDate, grade, room } = req.query;
    let attendance = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf-8'));
    
    // 필터링
    if (startDate && endDate) {
      attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
    }
    if (room) {
      attendance = attendance.filter(a => a.room === room);
    }
    
    // 엑셀 데이터 준비
    const excelData = [];
    
    studentsData.forEach(student => {
      if (grade && student.grade !== parseInt(grade)) return;
      if (room && student.studyRoom !== room) return;
      
      const row = {
        '학번': student.studentNumber,
        '이름': student.name,
        '학년': student.grade,
        '자습공간': student.studyRoom,
        '출석': 0,
        '결석': 0,
        '공결': 0,
        '병결': 0
      };
      
      // 출석 데이터 집계
      attendance.forEach(record => {
        const status = record.attendanceData[student.id];
        if (status === 'present') row['출석']++;
        else if (status === 'absent') row['결석']++;
        else if (status === 'excused') row['공결']++;
        else if (status === 'sick') row['병결']++;
      });
      
      excelData.push(row);
    });
    
    // 엑셀 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, '출석현황');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    res.status(500).json({ error: '엑셀 다운로드에 실패했습니다.' });
  }
});

// 서버 시작
async function startServer() {
  try {
    await loadStudentsData();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작 오류:', error);
    process.exit(1);
  }
}

startServer();
