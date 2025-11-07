const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Multer 설정 (메모리 저장)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 데이터 저장 경로
const DATA_DIR = path.join(__dirname, 'data');
const STUDENTS_FILE = path.join(__dirname, '../students.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const ABSENCE_FILE = path.join(DATA_DIR, 'pre_absence.json');
const SEATING_FILE = path.join(__dirname, 'seating_charts.json');
const FLOOR_PLANS_FILE = path.join(__dirname, 'floor_plans.json');

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

// JSON 파일에서 학생 데이터 로드
let studentsData = [];

function loadStudentsData() {
  return new Promise((resolve, reject) => {
    try {
      const rawData = fs.readFileSync(STUDENTS_FILE, 'utf-8');
      const students = JSON.parse(rawData);
      
      // 데이터 구조 변환 (id를 studentNumber로 사용)
      studentsData = students.map((student, index) => ({
        id: String(index + 1), // 순번
        studentNumber: student.id,
        name: student.name,
        studyRoom: student.location,
        grade: student.grade
      }));
      
      console.log(`✅ 학생 데이터 로드 완료: ${studentsData.length}명`);
      
      // 학년별 통계
      const gradeStats = {};
      studentsData.forEach(s => {
        gradeStats[s.grade] = (gradeStats[s.grade] || 0) + 1;
      });
      console.log('📊 학년별 분포:', gradeStats);
      
      resolve(studentsData);
    } catch (error) {
      reject(error);
    }
  });
}

// 좌석배치 데이터 로드
let seatingData = {};

function loadSeatingData() {
  try {
    if (fs.existsSync(SEATING_FILE)) {
      seatingData = JSON.parse(fs.readFileSync(SEATING_FILE, 'utf-8'));
      console.log(`✅ 좌석배치 데이터 로드: ${Object.keys(seatingData).length}개 공간`);
    } else {
      console.log('⚠️  좌석배치 파일 없음');
    }
  } catch (error) {
    console.error('❌ 좌석배치 로드 실패:', error);
    seatingData = {};
  }
}

// 학년별 자습공간 구조 (동적 생성)
let studyRoomStructure = {};

function buildStudyRoomStructure() {
  const gradeRooms = { 1: new Set(), 2: new Set(), 3: new Set() };
  
  // 공백/개행문자 정규화 함수
  const normalizeRoomName = (name) => name ? name.replace(/\s+/g, ' ').trim() : '';
  
  // 학생 데이터에서 자습공간 추출 (정규화 적용)
  studentsData.forEach(student => {
    if (gradeRooms[student.grade]) {
      const normalizedRoom = normalizeRoomName(student.studyRoom);
      if (normalizedRoom) {
        gradeRooms[student.grade].add(normalizedRoom);
      }
    }
  });
  
  // 구조 생성
  studyRoomStructure = {};
  [1, 2, 3].forEach(grade => {
    const rooms = Array.from(gradeRooms[grade]).sort().map((roomName, index) => {
      // 좌석배치 확인 (2, 3학년)
      const hasSeating = grade >= 2 && seatingData && seatingData[roomName];
      
      return {
        id: `room_${index}`,
        name: roomName,
        hasSeating: hasSeating
      };
    });
    
    studyRoomStructure[grade] = {
      grade: grade,
      rooms: rooms
    };
  });
  
  console.log('📍 자습공간 구조 생성 완료');
  [1, 2, 3].forEach(grade => {
    console.log(`  ${grade}학년: ${studyRoomStructure[grade].rooms.length}개 공간`);
  });
}

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
  
  // 공백/개행문자 정규화 함수
  const normalizeRoomName = (name) => name ? name.replace(/\s+/g, ' ').trim() : '';
  
  let filteredStudents = studentsData;
  
  if (grade) {
    filteredStudents = filteredStudents.filter(s => s.grade === parseInt(grade));
  }
  
  if (room) {
    const normalizedRequestRoom = normalizeRoomName(room);
    filteredStudents = filteredStudents.filter(s => 
      normalizeRoomName(s.studyRoom) === normalizedRequestRoom
    );
  }
  
  // 프론트엔드 호환성을 위해 room 필드 추가 및 studyRoom 정규화
  const studentsWithRoom = filteredStudents.map(s => ({
    ...s,
    studyRoom: normalizeRoomName(s.studyRoom), // 정규화된 studyRoom
    room: normalizeRoomName(s.studyRoom)  // studyRoom을 room으로도 제공
  }));
  
  res.json(studentsWithRoom);
});

// 좌석 배치 조회 (버튼 기반)
app.get('/api/seating/:room', (req, res) => {
  try {
    const roomName = decodeURIComponent(req.params.room);
    
    const seatingData = JSON.parse(fs.readFileSync(SEATING_FILE, 'utf-8'));
    
    if (!seatingData[roomName]) {
      return res.status(404).json({ error: '해당 공간의 좌석 배치가 없습니다.' });
    }
    
    // 좌석 배치의 ID를 studentNumber에서 sequential ID로 변환
    const transformSeatingIds = (data) => {
      const transformed = { ...data };
      
      const transformSeat = (seat) => {
        if (!seat) return null;
        const student = studentsData.find(s => s.studentNumber === seat.studentNumber);
        if (student) {
          return {
            ...seat,
            id: student.id  // studentNumber에서 sequential ID로 변경
          };
        }
        return seat;
      };
      
      // rows 형식 처리
      if (transformed.rows && Array.isArray(transformed.rows)) {
        transformed.rows = transformed.rows.map(row => ({
          ...row,
          leftSeat: transformSeat(row.leftSeat),
          rightSeat: transformSeat(row.rightSeat)
        }));
      }
      
      // layout 형식 처리 (seats 배열)
      if (transformed.layout && Array.isArray(transformed.layout)) {
        transformed.layout = transformed.layout.map(row => ({
          ...row,
          seats: row.seats ? row.seats.map(transformSeat) : undefined,
          leftSeat: row.leftSeat ? transformSeat(row.leftSeat) : undefined,
          rightSeat: row.rightSeat ? transformSeat(row.rightSeat) : undefined
        }));
      }
      
      // columns 형식 처리 (도서관 우측 별실)
      if (transformed.columns && Array.isArray(transformed.columns)) {
        transformed.columns = transformed.columns.map(column => ({
          ...column,
          seats: column.seats && Array.isArray(column.seats) ? column.seats.map(transformSeat) : []
        }));
      }
      
      return transformed;
    };
    
    const transformedData = transformSeatingIds(seatingData[roomName]);
    res.json(transformedData);
  } catch (error) {
    console.error('좌석 배치 조회 오류:', error);
    res.status(500).json({ error: '좌석 배치 조회에 실패했습니다.' });
  }
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

// 출석 데이터 삭제 (초기화)
app.delete('/api/attendance', (req, res) => {
  try {
    const { date, session, room } = req.query;
    
    if (!date || !session || !room) {
      return res.status(400).json({ error: '날짜, 차수, 자습실 정보가 필요합니다.' });
    }
    
    let attendance = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf-8'));
    const beforeCount = attendance.length;
    
    // 해당 날짜/차수/자습실의 데이터 삭제
    attendance = attendance.filter(a => 
      !(a.date === date && a.session === session && a.room === room)
    );
    
    const deletedCount = beforeCount - attendance.length;
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(attendance, null, 2));
    
    console.log(`[Attendance Delete] ${date} ${session}차 ${room}: ${deletedCount}건 삭제`);
    res.json({ 
      success: true, 
      deletedCount,
      message: `${deletedCount}건의 출석 데이터가 삭제되었습니다.` 
    });
  } catch (error) {
    console.error('출석 데이터 삭제 오류:', error);
    res.status(500).json({ error: '출석 데이터 삭제에 실패했습니다.' });
  }
});

// 사전 결석 관리
// 공결 사전등록 (다중 학생, 날짜 범위 지원)
app.post('/api/pre-register', (req, res) => {
  try {
    const { startDate, endDate, studentIds, reason } = req.body;
    
    if (!startDate || !endDate || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }
    
    let absences = JSON.parse(fs.readFileSync(ABSENCE_FILE, 'utf-8'));
    
    // 날짜 범위 생성
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(format(d, 'yyyy-MM-dd'));
    }
    
    let count = 0;
    // 각 날짜, 각 차수, 각 학생에 대해 등록 (공결은 하루 전체)
    dates.forEach(date => {
      ['1', '2'].forEach(session => {
        studentIds.forEach(studentId => {
          // 학생 정보 찾기
          const student = studentsData.find(s => s.id === studentId);
          if (!student) {
            console.warn(`학생을 찾을 수 없습니다: ${studentId}`);
            return;
          }
          
          // 중복 체크
          const exists = absences.some(a => 
            a.date === date && 
            a.session === session && 
            a.studentId === studentId
          );
          
          if (!exists) {
            const newAbsence = {
              id: uuidv4(),
              date,
              session,
              studentId,
              studentNumber: student.studentNumber,
              studentName: student.name,
              grade: student.grade,
              reason: reason || '공결',
              timestamp: new Date().toISOString()
            };
            absences.push(newAbsence);
            count++;
          }
        });
      });
    });
    
    fs.writeFileSync(ABSENCE_FILE, JSON.stringify(absences, null, 2));
    
    res.json({ success: true, count, message: `${count}건의 공결이 사전등록되었습니다.` });
  } catch (error) {
    console.error('공결 사전등록 오류:', error);
    res.status(500).json({ error: '공결 사전등록에 실패했습니다.' });
  }
});

app.post('/api/pre-absence', (req, res) => {
  try {
    const { date, studentId, reason } = req.body;
    
    if (!date || !studentId || !reason) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }
    
    // 학생 정보 찾기
    const student = studentsData.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
    }
    
    let absences = JSON.parse(fs.readFileSync(ABSENCE_FILE, 'utf-8'));
    
    const newAbsence = {
      id: uuidv4(),
      date,
      studentId,
      studentNumber: student.studentNumber,
      studentName: student.name,
      grade: student.grade,
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

// 통계 조회 (최적화됨)
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
    
    // 학생 필터링 및 Map으로 변환 (O(1) 조회를 위해)
    const studentMap = new Map();
    studentsData.forEach(student => {
      if (grade && student.grade !== parseInt(grade)) return;
      if (room && student.studyRoom !== room) return;
      
      studentMap.set(student.id, {
        student: student,
        present: 0,
        absent: 0,
        excused: 0,
        sick: 0,
        total: 0,
        dateMap: new Map() // 날짜별 출석 상태 저장
      });
    });
    
    // 출석 데이터를 날짜별로 수집
    for (const record of attendance) {
      for (const [studentId, status] of Object.entries(record.attendanceData)) {
        const stats = studentMap.get(studentId);
        if (stats) {
          if (!stats.dateMap.has(record.date)) {
            stats.dateMap.set(record.date, []);
          }
          stats.dateMap.get(record.date).push(status);
        }
      }
    }
    
    // 날짜별로 출석 집계: 하루에 한 번이라도 결석이면 결석 1회, 모두 출석해야 출석 1회
    for (const stats of studentMap.values()) {
      for (const [date, statuses] of stats.dateMap.entries()) {
        stats.total++; // 날짜 카운트
        
        // 해당 날짜의 모든 체크에서 결석이 하나라도 있으면 결석으로 집계
        if (statuses.includes('absent')) {
          stats.absent++;
        }
        // 해당 날짜의 모든 체크가 출석이면 출석으로 집계
        else if (statuses.every(s => s === 'present')) {
          stats.present++;
        }
        // 공결이 하나라도 있으면 공결로 집계
        else if (statuses.includes('excused')) {
          stats.excused++;
        }
        // 병결이 하나라도 있으면 병결로 집계
        else if (statuses.includes('sick')) {
          stats.sick++;
        }
      }
      
      // dateMap 제거 (응답에서 불필요)
      delete stats.dateMap;
    }
    
    res.json({
      statistics: Array.from(studentMap.values()),
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
    const { startDate, endDate, grade, room, supervisorName } = req.query;
    let attendance = JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf-8'));
    
    // 필터링
    if (startDate && endDate) {
      attendance = attendance.filter(a => a.date >= startDate && a.date <= endDate);
    }
    if (room) {
      attendance = attendance.filter(a => a.room === room);
    }
    
    // 엑셀 데이터 준비 (최적화됨)
    // 1단계: 학생 데이터를 Map으로 변환
    const studentDataMap = new Map();
    studentsData.forEach(student => {
      if (grade && student.grade !== parseInt(grade)) return;
      if (room && student.studyRoom !== room) return;
      
      studentDataMap.set(student.id, {
        '학번': student.studentNumber,
        '이름': student.name,
        '학년': student.grade,
        '자습공간': student.studyRoom,
        '출석': 0,
        '결석': 0,
        '공결': 0,
        '병결': 0
      });
    });
    
    // 2단계: 출석 데이터 단일 패스로 집계
    for (const record of attendance) {
      for (const [studentId, status] of Object.entries(record.attendanceData)) {
        const row = studentDataMap.get(studentId);
        if (row) {
          if (status === 'present') row['출석']++;
          else if (status === 'absent') row['결석']++;
          else if (status === 'excused') row['공결']++;
          else if (status === 'sick') row['병결']++;
        }
      }
    }
    
    const excelData = Array.from(studentDataMap.values());
    
    // 엑셀 생성
    const wb = XLSX.utils.book_new();
    
    // 헤더 정보 추가 (날짜와 감독 선생님)
    const headerData = [
      ['조회 기간', `${startDate || '전체'} ~ ${endDate || '전체'}`],
      ['자습감독', supervisorName || '-'],
      [] // 빈 행
    ];
    
    // 워크시트 생성 (헤더 + 데이터)
    const ws = XLSX.utils.aoa_to_sheet(headerData);
    XLSX.utils.sheet_add_json(ws, excelData, { origin: -1 });
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 12 }, // 학번
      { wch: 10 }, // 이름
      { wch: 8 },  // 학년
      { wch: 20 }, // 자습공간
      { wch: 8 },  // 출석
      { wch: 8 },  // 결석
      { wch: 8 },  // 공결
      { wch: 8 }   // 병결
    ];
    
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

// Excel 대량 공결 등록
app.post('/api/pre-register/bulk', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel 파일이 없습니다.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`[Excel Upload] 파싱된 데이터 개수: ${data.length}행`);
    if (data.length > 0) {
      console.log('[Excel Upload] 첫 번째 행:', data[0]);
      console.log('[Excel Upload] 컬럼명:', Object.keys(data[0]));
    }

    let absences = JSON.parse(fs.readFileSync(ABSENCE_FILE, 'utf-8'));
    let count = 0;
    let skippedRows = [];

    data.forEach((row, index) => {
      const startDate = row['시작일'] || row['startDate'];
      const endDate = row['종료일'] || row['endDate'];
      const studentNumber = row['학번'] || row['studentNumber'];
      const reason = row['사유'] || row['reason'] || '공결';

      if (!startDate || !endDate || !studentNumber) {
        skippedRows.push({
          index: index + 2, // Excel 행 번호 (헤더 제외)
          reason: '필수 데이터 누락',
          data: { startDate, endDate, studentNumber }
        });
        return;
      }

      // 학번으로 학생 찾기
      const student = studentsData.find(s => s.studentNumber === String(studentNumber));
      if (!student) {
        console.warn(`[Excel Upload] 학생을 찾을 수 없습니다: ${studentNumber}`);
        skippedRows.push({
          index: index + 2,
          reason: '학생 정보 없음',
          studentNumber
        });
        return;
      }

      // 날짜 변환 함수 (Excel serial number 또는 Date 객체 처리)
      const parseExcelDate = (value) => {
        if (typeof value === 'number') {
          // Excel serial number (1 = 1900-01-01)
          const excelEpoch = new Date(1899, 11, 30); // Excel epoch is Dec 30, 1899
          const date = new Date(excelEpoch.getTime() + value * 86400000);
          return date;
        } else if (typeof value === 'string') {
          return new Date(value);
        } else if (value instanceof Date) {
          return value;
        }
        return null;
      };

      // 날짜 범위 생성
      const start = parseExcelDate(startDate);
      const end = parseExcelDate(endDate);
      
      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        skippedRows.push({
          index: index + 2,
          reason: '날짜 형식 오류',
          data: { startDate, endDate }
        });
        return;
      }
      
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(format(d, 'yyyy-MM-dd'));
      }

      // 각 날짜, 각 차수에 대해 등록
      dates.forEach(date => {
        ['1', '2'].forEach(session => {
          // 중복 체크
          const exists = absences.some(a => 
            a.date === date && 
            a.session === session && 
            a.studentId === student.id
          );

          if (!exists) {
            absences.push({
              id: uuidv4(),
              date,
              session,
              studentId: student.id,
              studentNumber: student.studentNumber,
              studentName: student.name,
              grade: student.grade,
              reason,
              timestamp: new Date().toISOString()
            });
            count++;
          }
        });
      });
    });

    fs.writeFileSync(ABSENCE_FILE, JSON.stringify(absences, null, 2));
    
    console.log(`[Excel Upload] 등록 완료: ${count}건, 건너뛴 행: ${skippedRows.length}개`);
    if (skippedRows.length > 0) {
      console.log('[Excel Upload] 건너뛴 행 상세:', skippedRows);
    }
    
    res.json({ 
      success: true, 
      count,
      total: data.length,
      skipped: skippedRows.length,
      skippedDetails: skippedRows,
      message: `${count}건의 공결이 등록되었습니다.` 
    });
  } catch (error) {
    console.error('Excel 대량 등록 오류:', error);
    res.status(500).json({ error: 'Excel 파일 처리에 실패했습니다.' });
  }
});

// Excel 샘플 파일 다운로드
app.get('/api/pre-register/sample', (req, res) => {
  try {
    // 샘플 데이터 생성
    const sampleData = [
      {
        '시작일': '2025-11-01',
        '종료일': '2025-11-03',
        '학번': '24-001',
        '사유': '병원 진료'
      },
      {
        '시작일': '2025-11-05',
        '종료일': '2025-11-05',
        '학번': '24-002',
        '사유': '가족 행사'
      },
      {
        '시작일': '2025-11-10',
        '종료일': '2025-11-15',
        '학번': '23-050',
        '사유': '현장 실습'
      }
    ];

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 12 }, // 시작일
      { wch: 12 }, // 종료일
      { wch: 10 }, // 학번
      { wch: 20 }  // 사유
    ];

    XLSX.utils.book_append_sheet(wb, ws, '공결등록');

    // 버퍼로 변환
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 한글 파일명을 UTF-8로 인코딩
    const filename = encodeURIComponent('공결등록_샘플.xlsx');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('샘플 파일 생성 오류:', error);
    res.status(500).json({ error: '샘플 파일 생성에 실패했습니다.' });
  }
});

// COMMAND_HISTORY.txt 다운로드
app.get('/api/download/command-history', (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'COMMAND_HISTORY.txt');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }
    
    const filename = encodeURIComponent('모바일출석체크_명령이력.txt');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(filePath);
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    res.status(500).json({ error: '파일 다운로드에 실패했습니다.' });
  }
});

// 서버 시작
async function startServer() {
  try {
    await loadStudentsData();
    loadSeatingData();  // 좌석배치 데이터 로드
    buildStudyRoomStructure();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작 오류:', error);
    process.exit(1);
  }
}

startServer();
