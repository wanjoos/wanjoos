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

    return { data: students };
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

  async saveAttendance(attendanceData) {
    const data = this.getData();
    if (!data.attendance) data.attendance = {};

    attendanceData.forEach(record => {
      const key = `${record.date}_${record.session}_${record.room}_${record.studentId}`;
      data.attendance[key] = {
        ...record,
        timestamp: new Date().toISOString()
      };
    });

    this.saveData(data);
    return { data: { success: true, saved: attendanceData.length } };
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
    return { data: { success: true, count: students.length } };
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
      const roomId = url.split('/').pop();
      return await offlineAdapter.getSeatingChart(roomId);
    } else if (url.includes('/floor-plan')) {
      const roomId = url.split('/').pop();
      return await offlineAdapter.getFloorPlan(roomId);
    }

    throw new Error(`Unknown endpoint: ${url}`);
  },

  post: async (url, data) => {
    if (url.includes('/attendance')) {
      return await offlineAdapter.saveAttendance(data);
    } else if (url.includes('/pre-absence/register')) {
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
