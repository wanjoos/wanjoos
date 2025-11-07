/**
 * Offline Adapter - localStorage 기반 데이터 관리
 * v1.0의 모든 API 호출을 localStorage로 대체
 */

// 내장 데이터 (빌드 시 주입됨)
import studentsData from '../../backend/students.json';
import seatingData from '../../backend/seating_charts.json';
import floorPlansData from '../../backend/floor_plans.json';

class OfflineAdapter {
  constructor() {
    this.STORAGE_KEY = 'ksa_attendance_offline';
    this.initializeData();
  }

  initializeData() {
    // 초기 데이터 구조
    const defaultData = {
      attendance: {},
      preAbsence: {},
      settings: {
        initialized: true,
        version: '2.0'
      }
    };

    // 기존 데이터가 없으면 초기화
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultData));
    }
  }

  getData() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
  }

  saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // ========================================
  // Students API
  // ========================================
  async getStudents(params = {}) {
    let students = studentsData;

    // 학년 필터
    if (params.grade) {
      students = students.filter(s => s.grade === parseInt(params.grade));
    }

    // 공간 필터 (공백 정규화)
    if (params.room) {
      const normalizedRoom = params.room.replace(/\s+/g, ' ').trim();
      students = students.filter(s => {
        const studentRoom = (s.location || s.studyRoom || s.room || '').replace(/\s+/g, ' ').trim();
        return studentRoom === normalizedRoom;
      });
    }

    // v1.0 호환성을 위해 studyRoom과 room 필드 추가
    const studentsWithCompatibility = students.map(s => ({
      ...s,
      studyRoom: s.location || s.studyRoom || s.room || '',
      room: s.location || s.room || s.studyRoom || ''
    }));

    return { data: studentsWithCompatibility };
  }

  // ========================================
  // Attendance API
  // ========================================
  async getAttendance(params) {
    const { date, session, room } = params;
    const data = this.getData();
    const normalizedRoom = room.replace(/\s+/g, ' ').trim();

    const records = Object.values(data.attendance || {}).filter(a =>
      a.date === date &&
      a.session === session &&
      (a.room || '').replace(/\s+/g, ' ').trim() === normalizedRoom
    );

    return { data: records };
  }

  async saveAttendance(requestData) {
    const data = this.getData();
    if (!data.attendance) data.attendance = {};

    // v1.0 형식: { date, session, room, attendanceData: { studentId: status, ... } }
    const { date, session, room, attendanceData } = requestData;
    
    if (!date || !session || !room || !attendanceData) {
      throw new Error('필수 데이터가 누락되었습니다.');
    }

    // attendanceData는 객체 { studentId: status, ... }
    let savedCount = 0;
    Object.entries(attendanceData).forEach(([studentId, status]) => {
      // 학생 정보 찾기
      const student = studentsData.find(s => s.id === studentId);
      
      const key = `${date}_${session}_${room}_${studentId}`;
      data.attendance[key] = {
        date,
        session,
        room,
        studentId,
        studentName: student ? student.name : '',
        status,
        timestamp: new Date().toISOString()
      };
      savedCount++;
    });

    this.saveData(data);
    return { status: 200, data: { success: true, saved: savedCount, message: '출석 데이터가 저장되었습니다.' } };
  }

  // ========================================
  // Pre-Absence (공결) API
  // ========================================
  async getPreAbsence(params) {
    const { date } = params;
    const data = this.getData();
    const records = (data.preAbsence && data.preAbsence[date]) || [];
    return { data: records };
  }

  async savePreAbsence(date, students) {
    const data = this.getData();
    if (!data.preAbsence) data.preAbsence = {};
    data.preAbsence[date] = students;
    this.saveData(data);
    return { status: 200, data: { success: true, count: students.length } };
  }

  async preRegister(startDate, endDate, studentIds, reason = '공결') {
    const data = this.getData();
    if (!data.preAbsence) data.preAbsence = {};
    
    // 날짜 범위 생성
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
    }
    
    let count = 0;
    // 각 날짜에 대해 공결 등록
    dates.forEach(date => {
      if (!data.preAbsence[date]) {
        data.preAbsence[date] = [];
      }
      
      studentIds.forEach(studentId => {
        // 학생 정보 찾기
        const student = studentsData.find(s => s.id === studentId);
        if (!student) {
          console.warn(`학생을 찾을 수 없습니다: ${studentId}`);
          return;
        }
        
        // 중복 체크
        const exists = data.preAbsence[date].some(a => a.studentId === studentId);
        
        if (!exists) {
          data.preAbsence[date].push({
            id: `pre_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date,
            studentId,
            studentName: student.name,
            grade: student.grade,
            reason,
            timestamp: new Date().toISOString()
          });
          count++;
        }
      });
    });
    
    this.saveData(data);
    return { status: 200, data: { success: true, count, message: `${count}건의 공결이 사전등록되었습니다.` } };
  }

  async deletePreAbsence(ids) {
    const data = this.getData();
    // Pre-absence 데이터에서 해당 ID들 제거
    Object.keys(data.preAbsence || {}).forEach(date => {
      data.preAbsence[date] = data.preAbsence[date].filter(
        pa => !ids.includes(pa.id)
      );
    });
    this.saveData(data);
    return { data: { success: true } };
  }

  // ========================================
  // Statistics API
  // ========================================
  async getStatistics(params) {
    const { startDate, endDate, grade, room } = params;
    const data = this.getData();
    
    // 날짜 범위 필터
    let records = Object.values(data.attendance || {}).filter(a => {
      const recordDate = new Date(a.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return recordDate >= start && recordDate <= end;
    });

    // 학년 필터
    if (grade) {
      records = records.filter(a => {
        const student = studentsData.find(s => s.id === a.studentId);
        return student && student.grade === parseInt(grade);
      });
    }

    // 공간 필터
    if (room) {
      const normalizedRoom = room.replace(/\s+/g, ' ').trim();
      records = records.filter(a =>
        (a.room || '').replace(/\s+/g, ' ').trim() === normalizedRoom
      );
    }

    // 학생별 통계 계산
    const studentStats = {};
    records.forEach(record => {
      if (!studentStats[record.studentId]) {
        const student = studentsData.find(s => s.id === record.studentId);
        studentStats[record.studentId] = {
          studentNumber: record.studentId,
          studentName: student ? student.name : record.studentId,
          grade: student ? student.grade : null,
          room: student ? student.location : null,
          present: 0,
          absent: 0,
          excused: 0,
          total: 0
        };
      }

      const stats = studentStats[record.studentId];
      stats.total++;
      if (record.status === 'present') stats.present++;
      else if (record.status === 'absent') stats.absent++;
      else if (record.status === 'excused') stats.excused++;
    });

    return {
      data: {
        statistics: Object.values(studentStats),
        summary: {
          totalRecords: records.length,
          totalStudents: Object.keys(studentStats).length
        }
      }
    };
  }

  // ========================================
  // Grades & Rooms Structure
  // ========================================
  async getGrades() {
    // 학생 데이터에서 학년별 공간 구조 생성
    const gradeRooms = { 1: new Set(), 2: new Set(), 3: new Set() };
    
    studentsData.forEach(student => {
      if (gradeRooms[student.grade]) {
        const normalizedRoom = (student.location || student.studyRoom || student.room || '').replace(/\s+/g, ' ').trim();
        if (normalizedRoom) {
          gradeRooms[student.grade].add(normalizedRoom);
        }
      }
    });
    
    // 구조 생성
    const studyRoomStructure = {};
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
    
    return { data: studyRoomStructure };
  }

  // ========================================
  // Seating & Floor Plans
  // ========================================
  async getSeatingChart(roomId) {
    return { data: seatingData[roomId] || null };
  }

  async getFloorPlan(roomId) {
    return { data: floorPlansData[roomId] || null };
  }

  // ========================================
  // CSV Export
  // ========================================
  exportToCSV(startDate, endDate) {
    const data = this.getData();
    const records = Object.values(data.attendance || {}).filter(a => {
      const recordDate = new Date(a.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return recordDate >= start && recordDate <= end;
    });

    // CSV 헤더
    const csvRows = [
      '날짜,차수,담당자,학년,공간,학번,이름,상태,시간'
    ];

    // CSV 데이터
    records.forEach(record => {
      const student = studentsData.find(s => s.id === record.studentId);
      const statusText = {
        present: '출석',
        absent: '결석',
        excused: '공결'
      }[record.status] || record.status;

      csvRows.push([
        record.date,
        `${record.session}차`,
        record.supervisorName || '',
        student ? `${student.grade}학년` : '',
        record.room,
        record.studentId,
        student ? student.name : '',
        statusText,
        record.timestamp
      ].join(','));
    });

    return csvRows.join('\n');
  }

  // ========================================
  // Data Management
  // ========================================
  clearAllData() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeData();
  }

  getStorageSize() {
    const data = localStorage.getItem(this.STORAGE_KEY) || '';
    return (data.length / 1024).toFixed(2) + ' KB';
  }
}

// 싱글톤 인스턴스
const offlineAdapter = new OfflineAdapter();

// axios 호환 인터페이스
export const offlineAxios = {
  get: async (url, config = {}) => {
    const params = config.params || {};
    
    if (url.includes('/grades')) {
      return await offlineAdapter.getGrades();
    } else if (url.includes('/students')) {
      return await offlineAdapter.getStudents(params);
    } else if (url.includes('/attendance')) {
      return await offlineAdapter.getAttendance(params);
    } else if (url.includes('/pre-absence')) {
      if (params.date) {
        return await offlineAdapter.getPreAbsence(params);
      }
    } else if (url.includes('/statistics')) {
      return await offlineAdapter.getStatistics(params);
    } else if (url.includes('/seating')) {
      const roomId = decodeURIComponent(url.split('/').pop());
      return await offlineAdapter.getSeatingChart(roomId);
    } else if (url.includes('/floor-plan')) {
      const roomId = decodeURIComponent(url.split('/').pop());
      return await offlineAdapter.getFloorPlan(roomId);
    }

    throw new Error(`Unknown endpoint: ${url}`);
  },

  post: async (url, data) => {
    if (url.includes('/attendance')) {
      return await offlineAdapter.saveAttendance(data);
    } else if (url.includes('/pre-register/bulk')) {
      // Excel 업로드는 오프라인에서 지원하지 않음
      throw new Error('Excel 업로드는 오프라인 모드에서 지원되지 않습니다. 수동 입력을 사용해주세요.');
    } else if (url.includes('/pre-register')) {
      return await offlineAdapter.preRegister(data.startDate, data.endDate, data.studentIds, data.reason);
    } else if (url.includes('/pre-absence')) {
      // /pre-absence/register 또는 /pre-absence 둘 다 처리
      return await offlineAdapter.savePreAbsence(data.date, data.students);
    }

    throw new Error(`Unknown endpoint: ${url}`);
  },

  delete: async (url) => {
    if (url.includes('/pre-absence')) {
      const ids = url.split('ids=')[1].split(',');
      return await offlineAdapter.deletePreAbsence(ids);
    }

    throw new Error(`Unknown endpoint: ${url}`);
  }
};

export default offlineAdapter;
