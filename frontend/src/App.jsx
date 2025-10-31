import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './App.css';

const API_BASE = '/api';

function App() {
  const [currentView, setCurrentView] = useState('home'); // home, attendance, admin
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [preAbsences, setPreAbsences] = useState([]);
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentSession, setCurrentSession] = useState('1');
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);

  // 학년 데이터 로드
  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const response = await axios.get(`${API_BASE}/grades`);
      setGrades(response.data);
    } catch (error) {
      console.error('학년 데이터 로드 오류:', error);
      alert('학년 데이터를 불러오는데 실패했습니다.');
    }
  };

  // 학생 목록 로드
  const loadStudents = async (grade, roomName) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/students`, {
        params: { grade, room: roomName }
      });
      setStudents(response.data);
      
      // 기존 출석 데이터 로드
      const attendanceResponse = await axios.get(`${API_BASE}/attendance`, {
        params: { date: currentDate, session: currentSession, room: roomName }
      });
      
      if (attendanceResponse.data.length > 0) {
        setAttendance(attendanceResponse.data[0].attendanceData);
      } else {
        // 새로운 출석 데이터 초기화
        const newAttendance = {};
        response.data.forEach(student => {
          newAttendance[student.id] = 'present';
        });
        setAttendance(newAttendance);
      }
      
      // 사전 결석 로드
      const absenceResponse = await axios.get(`${API_BASE}/pre-absence`, {
        params: { date: currentDate }
      });
      setPreAbsences(absenceResponse.data);
      
      // 사전 결석 학생들 자동 체크
      absenceResponse.data.forEach(absence => {
        setAttendance(prev => ({
          ...prev,
          [absence.studentId]: absence.reason === '공결' ? 'excused' : 'sick'
        }));
      });
      
    } catch (error) {
      console.error('학생 목록 로드 오류:', error);
      alert('학생 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 출석 체크 토글
  const toggleAttendance = (studentId) => {
    const statuses = ['present', 'absent', 'excused', 'sick'];
    const currentStatus = attendance[studentId] || 'present';
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    
    setAttendance({
      ...attendance,
      [studentId]: statuses[nextIndex]
    });
  };

  // 일괄 출석 처리
  const markAllPresent = () => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = 'present';
    });
    setAttendance(newAttendance);
  };

  // 출석 저장
  const saveAttendance = async () => {
    try {
      await axios.post(`${API_BASE}/attendance`, {
        date: currentDate,
        session: currentSession,
        room: selectedRoomName,
        attendanceData: attendance
      });
      alert('출석이 저장되었습니다!');
    } catch (error) {
      console.error('출석 저장 오류:', error);
      alert('출석 저장에 실패했습니다.');
    }
  };

  // 학년 선택
  const selectGrade = (grade) => {
    setSelectedGrade(grade);
    setCurrentView('roomSelect');
  };

  // 자습공간 선택
  const selectRoom = (roomId, roomName) => {
    setSelectedRoom(roomId);
    setSelectedRoomName(roomName);
    loadStudents(selectedGrade, roomName);
    setCurrentView('attendance');
  };

  // 홈으로 돌아가기
  const goHome = () => {
    setCurrentView('home');
    setSelectedGrade(null);
    setSelectedRoom(null);
    setSelectedRoomName('');
    setStudents([]);
    setAttendance({});
  };

  // 출석 상태 스타일
  const getStatusStyle = (status) => {
    const styles = {
      present: { bg: '#4CAF50', text: '출석' },
      absent: { bg: '#f44336', text: '결석' },
      excused: { bg: '#FF9800', text: '공결' },
      sick: { bg: '#9C27B0', text: '병결' }
    };
    return styles[status] || styles.present;
  };

  // 통계 보기
  const [statistics, setStatistics] = useState(null);
  const [statsFilter, setStatsFilter] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    endDate: currentDate,
    grade: '',
    room: ''
  });

  const loadStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/statistics`, {
        params: statsFilter
      });
      setStatistics(response.data);
    } catch (error) {
      console.error('통계 로드 오류:', error);
      alert('통계를 불러오는데 실패했습니다.');
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await axios.get(`${API_BASE}/export/excel`, {
        params: statsFilter,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `출석현황_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  // 렌더링
  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <div className="header-content">
          <h1>📚 자습실 출석 체크</h1>
          {currentView !== 'home' && (
            <button className="btn-back" onClick={goHome}>
              🏠 홈으로
            </button>
          )}
        </div>
      </header>

      {/* 홈 화면 */}
      {currentView === 'home' && (
        <div className="home-view">
          <div className="welcome-card">
            <h2>환영합니다! 👋</h2>
            <p>자습실 출석 체크 시스템입니다.</p>
          </div>
          
          <div className="menu-cards">
            <div className="menu-card" onClick={() => setCurrentView('gradeSelect')}>
              <div className="menu-icon">✅</div>
              <h3>출석 체크</h3>
              <p>학생 출석을 체크합니다</p>
            </div>
            
            <div className="menu-card" onClick={() => { setCurrentView('admin'); loadStatistics(); }}>
              <div className="menu-icon">📊</div>
              <h3>관리자</h3>
              <p>통계 및 관리</p>
            </div>
          </div>
        </div>
      )}

      {/* 학년 선택 화면 */}
      {currentView === 'gradeSelect' && (
        <div className="grade-select-view">
          <h2>학년을 선택하세요</h2>
          <div className="grade-buttons">
            {Object.keys(grades).map(grade => (
              <button
                key={grade}
                className="grade-btn"
                onClick={() => selectGrade(parseInt(grade))}
              >
                {grade}학년
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 자습공간 선택 화면 */}
      {currentView === 'roomSelect' && selectedGrade && (
        <div className="room-select-view">
          <h2>{selectedGrade}학년 자습공간 선택</h2>
          <div className="room-buttons">
            {grades[selectedGrade]?.rooms.map(room => (
              <button
                key={room.id}
                className="room-btn"
                onClick={() => selectRoom(room.id, room.name)}
              >
                <div className="room-name">{room.name}</div>
                {room.hasSeating && <div className="room-badge">좌석배치 있음</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 출석 체크 화면 */}
      {currentView === 'attendance' && students.length > 0 && (
        <div className="attendance-view">
          <div className="attendance-header">
            <h2>{selectedRoomName}</h2>
            <div className="attendance-controls">
              <div className="date-session">
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="input-date"
                />
                <select
                  value={currentSession}
                  onChange={(e) => setCurrentSession(e.target.value)}
                  className="input-session"
                >
                  <option value="1">1차</option>
                  <option value="2">2차</option>
                </select>
              </div>
              <button className="btn-all-present" onClick={markAllPresent}>
                ✅ 전체 출석
              </button>
              <button className="btn-save" onClick={saveAttendance}>
                💾 저장
              </button>
            </div>
          </div>

          <div className="legend">
            <span className="legend-item" style={{background: '#4CAF50'}}>출석</span>
            <span className="legend-item" style={{background: '#f44336'}}>결석</span>
            <span className="legend-item" style={{background: '#FF9800'}}>공결</span>
            <span className="legend-item" style={{background: '#9C27B0'}}>병결</span>
          </div>

          <div className="students-grid">
            {students.map(student => {
              const status = attendance[student.id] || 'present';
              const style = getStatusStyle(status);
              return (
                <div
                  key={student.id}
                  className="student-card"
                  onClick={() => toggleAttendance(student.id)}
                  style={{ backgroundColor: style.bg }}
                >
                  <div className="student-number">{student.studentNumber}</div>
                  <div className="student-name">{student.name}</div>
                  <div className="student-status">{style.text}</div>
                </div>
              );
            })}
          </div>

          <div className="attendance-summary">
            <div className="summary-item">
              <strong>총 인원:</strong> {students.length}명
            </div>
            <div className="summary-item">
              <strong>출석:</strong> {Object.values(attendance).filter(s => s === 'present').length}명
            </div>
            <div className="summary-item">
              <strong>결석:</strong> {Object.values(attendance).filter(s => s === 'absent').length}명
            </div>
          </div>
        </div>
      )}

      {/* 관리자 화면 */}
      {currentView === 'admin' && (
        <div className="admin-view">
          <h2>📊 관리자 - 통계 및 관리</h2>
          
          <div className="admin-filters">
            <div className="filter-row">
              <label>기간:</label>
              <input
                type="date"
                value={statsFilter.startDate}
                onChange={(e) => setStatsFilter({...statsFilter, startDate: e.target.value})}
              />
              <span>~</span>
              <input
                type="date"
                value={statsFilter.endDate}
                onChange={(e) => setStatsFilter({...statsFilter, endDate: e.target.value})}
              />
            </div>
            <div className="filter-row">
              <label>학년:</label>
              <select
                value={statsFilter.grade}
                onChange={(e) => setStatsFilter({...statsFilter, grade: e.target.value})}
              >
                <option value="">전체</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </div>
            <div className="admin-buttons">
              <button className="btn-primary" onClick={loadStatistics}>
                🔍 조회
              </button>
              <button className="btn-success" onClick={downloadExcel}>
                📥 엑셀 다운로드
              </button>
            </div>
          </div>

          {statistics && (
            <div className="statistics-table">
              <h3>출석 통계 (총 {statistics.totalRecords}회)</h3>
              <table>
                <thead>
                  <tr>
                    <th>학번</th>
                    <th>이름</th>
                    <th>학년</th>
                    <th>자습공간</th>
                    <th>출석</th>
                    <th>결석</th>
                    <th>공결</th>
                    <th>병결</th>
                    <th>결석률</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.statistics.map(stat => (
                    <tr key={stat.student.id}>
                      <td>{stat.student.studentNumber}</td>
                      <td>{stat.student.name}</td>
                      <td>{stat.student.grade}</td>
                      <td className="room-cell">{stat.student.studyRoom}</td>
                      <td className="stat-present">{stat.present}</td>
                      <td className="stat-absent">{stat.absent}</td>
                      <td className="stat-excused">{stat.excused}</td>
                      <td className="stat-sick">{stat.sick}</td>
                      <td className="stat-rate">
                        {stat.total > 0 ? ((stat.absent / stat.total) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">⏳ 로딩 중...</div>
        </div>
      )}
    </div>
  );
}

export default App;
