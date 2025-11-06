import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './App.css';

const API_BASE = '/api';

// 관리자 패널 컴포넌트
function AdminPanel({ grades, currentDate: propCurrentDate, currentSession: propCurrentSession, supervisorName, onNavigateToAttendance }) {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'statistics', 'preRegister'
  const [statistics, setStatistics] = useState(null);
  const [statsFilter, setStatsFilter] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    grade: '',
    room: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'studentNumber', direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState([]);
  const [preRegisterStudents, setPreRegisterStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [registeredPreAbsences, setRegisteredPreAbsences] = useState([]); // 등록된 공결 목록
  const [preAbsenceViewDate, setPreAbsenceViewDate] = useState(format(new Date(), 'yyyy-MM-dd')); // 공결 조회 날짜
  const [pasteInput, setPasteInput] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [manualStartDate, setManualStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualEndDate, setManualEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualReason, setManualReason] = useState('공결');
  const [selectedAbsences, setSelectedAbsences] = useState([]); // 선택된 공결 ID 목록
  
  // 실시간 출석체크 현황 탭용 날짜/차수 필터
  const [statusDate, setStatusDate] = useState(propCurrentDate || format(new Date(), 'yyyy-MM-dd'));
  const [statusSession, setStatusSession] = useState(propCurrentSession || '1');

  // prop 변경 시 상태 업데이트
  useEffect(() => {
    if (propCurrentDate) setStatusDate(propCurrentDate);
    if (propCurrentSession) setStatusSession(propCurrentSession);
  }, [propCurrentDate, propCurrentSession]);

  // 출석 현황 조회
  const loadAttendanceStatus = async () => {
    setLoading(true);
    try {
      const statusList = [];
      for (const grade in grades) {
        for (const room of grades[grade].rooms) {
          const response = await axios.get(`${API_BASE}/attendance`, {
            params: { 
              date: statusDate, 
              session: statusSession, 
              room: room.name 
            }
          });
          statusList.push({
            grade,
            roomId: room.id,
            roomName: room.name,
            hasData: response.data.length > 0,
            timestamp: response.data[0]?.timestamp
          });
        }
      }
      setAttendanceStatus(statusList);
    } catch (error) {
      console.error('출석 현황 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/statistics`, {
        params: statsFilter
      });
      setStatistics(response.data);
    } catch (error) {
      console.error('통계 로드 오류:', error);
      alert('통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 소팅 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬된 통계 데이터
  const getSortedStatistics = () => {
    if (!statistics || !statistics.statistics) return [];
    
    const sorted = [...statistics.statistics].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'studentNumber') {
        aValue = a.student.studentNumber;
        bValue = b.student.studentNumber;
      } else if (sortConfig.key === 'name') {
        aValue = a.student.name;
        bValue = b.student.name;
      } else if (sortConfig.key === 'grade') {
        aValue = a.student.grade;
        bValue = b.student.grade;
      } else if (['present', 'absent', 'excused', 'absentRate'].includes(sortConfig.key)) {
        if (sortConfig.key === 'absentRate') {
          aValue = a.total > 0 ? (a.absent / a.total) * 100 : 0;
          bValue = b.total > 0 ? (b.absent / b.total) * 100 : 0;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  // 전체 학생 목록 로드
  const loadAllStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE}/students`);
      setAllStudents(response.data);
    } catch (error) {
      console.error('학생 목록 로드 오류:', error);
    }
  };

  // 등록된 공결 목록 조회
  const loadRegisteredPreAbsences = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pre-absence`, {
        params: { date: preAbsenceViewDate }
      });
      setRegisteredPreAbsences(response.data);
    } catch (error) {
      console.error('공결 목록 로드 오류:', error);
    }
  };

  // 공결 사전등록 토글
  const togglePreRegister = (studentId) => {
    setPreRegisterStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // 붙여넣기로 학생 추가
  const handlePasteInput = (e) => {
    const text = e.target.value;
    setPasteInput(text);
  };

  const processPastedNames = () => {
    if (!pasteInput.trim()) {
      alert('학생 이름이나 학번을 입력해주세요.');
      return;
    }

    // 줄바꿈, 쉼표, 공백 등으로 분리
    const inputLines = pasteInput
      .split(/[\n,\t]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const matchedIds = [];
    const notFoundNames = [];

    inputLines.forEach(input => {
      // 이름 또는 학번으로 검색
      const found = allStudents.find(student => 
        student.name === input || 
        student.studentNumber === input ||
        student.name.includes(input) ||
        input.includes(student.name)
      );

      if (found) {
        if (!preRegisterStudents.includes(found.id)) {
          matchedIds.push(found.id);
        }
      } else {
        notFoundNames.push(input);
      }
    });

    if (matchedIds.length > 0) {
      setPreRegisterStudents(prev => [...prev, ...matchedIds]);
      
      const successMsg = document.createElement('div');
      successMsg.className = 'toast-success';
      successMsg.textContent = `✓ ${matchedIds.length}명 추가됨`;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
    }

    if (notFoundNames.length > 0) {
      alert(`다음 학생을 찾을 수 없습니다:\n${notFoundNames.join(', ')}`);
    }

    setPasteInput('');
  };

  // 공결 사전등록 저장
  const savePreRegistration = async () => {
    try {
      const response = await axios.post(`${API_BASE}/pre-register`, {
        startDate: manualStartDate,
        endDate: manualEndDate,
        studentIds: preRegisterStudents,
        reason: manualReason
      });
      
      const successMsg = document.createElement('div');
      successMsg.className = 'toast-success';
      successMsg.textContent = `✓ ${response.data.count}건 공결 사전등록 완료!`;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
      
      setPreRegisterStudents([]);
      setPasteInput('');
      
      // 공결 목록 새로고침
      loadRegisteredPreAbsences();
    } catch (error) {
      console.error('공결 사전등록 오류:', error);
      alert('공결 사전등록에 실패했습니다.');
    }
  };

  // Excel 파일 업로드 처리
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 형식 검증
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('[Excel Upload] 파일 업로드 시작:', file.name);
      
      const response = await axios.post(`${API_BASE}/pre-register/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('[Excel Upload] 업로드 성공:', response.data);

      let message = `✓ ${response.data.count}건 공결 등록 완료!`;
      if (response.data.skipped > 0) {
        message += ` (${response.data.skipped}건 건너뜀)`;
      }

      const successMsg = document.createElement('div');
      successMsg.className = 'toast-success';
      successMsg.textContent = message;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      // 상세 정보가 있으면 콘솔에 출력
      if (response.data.skippedDetails && response.data.skippedDetails.length > 0) {
        console.warn('[Excel Upload] 건너뛴 행:', response.data.skippedDetails);
      }

      e.target.value = ''; // 파일 입력 초기화
      
      // 공결 목록 새로고침 (오늘 날짜로 설정)
      setPreAbsenceViewDate(format(new Date(), 'yyyy-MM-dd'));
      setTimeout(() => loadRegisteredPreAbsences(), 100);
      
    } catch (error) {
      console.error('[Excel Upload] 업로드 오류:', error);
      
      let errorMessage = 'Excel 파일 업로드에 실패했습니다.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      e.target.value = '';
    }
  };

  // 공결 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedAbsences.length === registeredPreAbsences.length) {
      setSelectedAbsences([]);
    } else {
      setSelectedAbsences(registeredPreAbsences.map(a => a.id));
    }
  };

  // 공결 개별 선택/해제
  const toggleSelectAbsence = (id) => {
    setSelectedAbsences(prev => {
      if (prev.includes(id)) {
        return prev.filter(absenceId => absenceId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 선택된 공결 삭제
  const deleteSelectedAbsences = async () => {
    if (selectedAbsences.length === 0) {
      alert('삭제할 공결을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedAbsences.length}건의 공결을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 각 공결 삭제 요청
      await Promise.all(
        selectedAbsences.map(id => axios.delete(`${API_BASE}/pre-absence/${id}`))
      );

      alert(`${selectedAbsences.length}건의 공결이 삭제되었습니다.`);
      setSelectedAbsences([]);
      loadRegisteredPreAbsences();
    } catch (error) {
      console.error('공결 삭제 오류:', error);
      alert('공결 삭제에 실패했습니다.');
    }
  };

  // Excel 샘플 파일 다운로드
  const downloadSampleExcel = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pre-register/sample`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '공결등록_샘플.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('샘플 파일 다운로드 오류:', error);
      alert('샘플 파일 다운로드에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceStatus();
    } else if (activeTab === 'preRegister') {
      loadAllStudents();
      loadRegisteredPreAbsences();
    }
  }, [activeTab]);

  // 공결 조회 날짜 변경 시 자동 새로고침
  useEffect(() => {
    if (activeTab === 'preRegister' && preAbsenceViewDate) {
      loadRegisteredPreAbsences();
    }
  }, [preAbsenceViewDate]);

  const downloadExcel = async () => {
    try {
      const response = await axios.get(`${API_BASE}/export/excel`, {
        params: { ...statsFilter, supervisorName },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `출석현황_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // 성공 알림
      const successMsg = document.createElement('div');
      successMsg.className = 'toast-success';
      successMsg.textContent = '✓ 다운로드 완료!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  return (
    <div className="admin-panel">
      {/* 탭 메뉴 */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          📋 실시간 출석체크 현황
        </button>
        <button 
          className={`admin-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📊 통계
        </button>
        <button 
          className={`admin-tab ${activeTab === 'preRegister' ? 'active' : ''}`}
          onClick={() => setActiveTab('preRegister')}
        >
          📋 공결등록
        </button>

      </div>

      {/* 출석 현황 탭 */}
      {activeTab === 'attendance' && (
        <div className="tab-content">
          <div className="status-filter-card">
            <div className="filter-row">
              <input
                type="date"
                value={statusDate}
                onChange={(e) => setStatusDate(e.target.value)}
                className="input-control"
              />
              <select
                value={statusSession}
                onChange={(e) => setStatusSession(e.target.value)}
                className="input-control session-select"
              >
                <option value="1">1차 체크</option>
                <option value="2">2차 체크</option>
              </select>
              <button className="btn-search" onClick={loadAttendanceStatus}>
                🔍 조회
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-card">
              <div className="spinner-small"></div>
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : (
            <div className="attendance-status-list">
              {Object.keys(grades).map(grade => (
                <div key={grade} className="grade-status-group">
                  <h4 className="grade-status-title">{grade}학년</h4>
                  <div className="room-status-grid">
                    {grades[grade].rooms.map(room => {
                      const status = attendanceStatus.find(
                        s => s.grade === grade && s.roomName === room.name
                      );
                      return (
                        <div 
                          key={room.id} 
                          className={`room-status-card ${status?.hasData ? 'completed' : 'pending'} ${!status?.hasData ? 'clickable' : ''}`}
                          onClick={() => {
                            if (!status?.hasData && onNavigateToAttendance) {
                              onNavigateToAttendance(grade, room.id, room.name, statusDate, statusSession);
                            }
                          }}
                        >
                          <div className="room-status-icon">
                            {status?.hasData ? '✅' : '⏳'}
                          </div>
                          <div className="room-status-name">{room.name}</div>
                          <div className="room-status-label">
                            {status?.hasData ? '완료' : '미실시'}
                          </div>
                          {status?.timestamp && (
                            <div className="room-status-time">
                              {new Date(status.timestamp).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                          {!status?.hasData && (
                            <div className="room-status-action">
                              👉 출석체크
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 통계 탭 */}
      {activeTab === 'statistics' && (
        <div className="tab-content">
          <div className="filter-card">
        <div className="filter-row">
          <div className="date-range-compact">
            <input
              type="date"
              value={statsFilter.startDate}
              onChange={(e) => setStatsFilter({...statsFilter, startDate: e.target.value})}
              className="input-control"
            />
            <span className="date-separator">~</span>
            <input
              type="date"
              value={statsFilter.endDate}
              onChange={(e) => setStatsFilter({...statsFilter, endDate: e.target.value})}
              className="input-control"
            />
          </div>

          <select
            value={statsFilter.grade}
            onChange={(e) => setStatsFilter({...statsFilter, grade: e.target.value})}
            className="input-control grade-select"
          >
            <option value="">전체 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
        </div>

        <div className="admin-actions">
          <button className="btn-action btn-search" onClick={loadStatistics}>
            🔍 조회
          </button>
          <button className="btn-action btn-download" onClick={downloadExcel}>
            📥 엑셀
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-card">
          <div className="spinner-small"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      )}

      {statistics && !loading && (
        <div className="stats-result">
          <div className="stats-summary">
            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <div className="summary-label">총 조회 기록</div>
                <div className="summary-value">{statistics.totalRecords}회</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-content">
                <div className="summary-label">학생 수</div>
                <div className="summary-value">{statistics.statistics.length}명</div>
              </div>
            </div>
          </div>

          <div className="stats-table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('studentNumber')} className="sortable">
                    학번 {sortConfig.key === 'studentNumber' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    이름 {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('grade')} className="sortable">
                    학년 {sortConfig.key === 'grade' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('present')} className="stat-col sortable">
                    출석 {sortConfig.key === 'present' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('absent')} className="stat-col sortable">
                    결석 {sortConfig.key === 'absent' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('excused')} className="stat-col sortable">
                    공결 {sortConfig.key === 'excused' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('absentRate')} className="rate-col sortable">
                    결석률 {sortConfig.key === 'absentRate' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedStatistics().map(stat => (
                  <tr key={stat.student.id}>
                    <td className="student-number">{stat.student.studentNumber}</td>
                    <td className="student-name">{stat.student.name}</td>
                    <td className="grade-cell">{stat.student.grade}</td>
                    <td className="stat-present">{stat.present}</td>
                    <td className="stat-absent">{stat.absent}</td>
                    <td className="stat-excused">{stat.excused}</td>
                    <td className="stat-rate">
                      {stat.total > 0 ? ((stat.absent / stat.total) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!statistics && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>조회 버튼을 눌러 통계를 확인하세요</p>
        </div>
      )}
        </div>
      )}

      {/* 공결 사전등록 탭 */}
      {activeTab === 'preRegister' && (
        <div className="tab-content">
          <div className="pre-register-header">
            <h3>{propCurrentDate} - {propCurrentSession}차수 공결 사전등록</h3>
            <div 
              className="selected-count clickable" 
              onClick={() => {
                if (preRegisterStudents.length > 0) {
                  const studentNames = preRegisterStudents.map(id => {
                    const student = allStudents.find(s => s.id === id);
                    return student ? `${student.name} (${student.studentNumber})` : '';
                  }).filter(Boolean).join('\n');
                  alert(`선택된 학생 (${preRegisterStudents.length}명):\n\n${studentNames}`);
                }
              }}
              title="클릭하여 선택된 학생 명단 보기"
            >
              선택: {preRegisterStudents.length}명 {preRegisterStudents.length > 0 && '👥'}
            </div>
          </div>

          {/* Excel 대량 등록 영역 */}
          <div className="excel-upload-card">
            <div className="excel-header">
              <div className="excel-title-group">
                <span className="excel-icon">📊</span>
                <span className="excel-title">Excel 대량 등록</span>
              </div>
              <button className="btn-sample-download" onClick={downloadSampleExcel}>
                📥 샘플 다운로드
              </button>
            </div>
            <div className="excel-upload-info">
              <p>💡 기간, 학번, 사유를 Excel 파일로 일괄 등록할 수 있습니다.</p>
              <p className="excel-format-info">형식: 시작일 | 종료일 | 학번 | 사유</p>
            </div>
            <label className="btn-excel-upload">
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleExcelUpload}
                style={{display: 'none'}}
              />
              📂 Excel 파일 선택
            </label>
          </div>

          {/* 붙여넣기 입력 영역 */}
          <div className="paste-input-card">
            <div className="paste-input-header">
              <span className="paste-icon">📋</span>
              <span className="paste-title">소수 명단 입력</span>
            </div>
            
            <div className="manual-input-fields">
              <div className="input-row">
                <div className="input-field">
                  <label>시작일</label>
                  <input 
                    type="date" 
                    value={manualStartDate} 
                    onChange={(e) => setManualStartDate(e.target.value)}
                  />
                </div>
                <div className="input-field">
                  <label>종료일</label>
                  <input 
                    type="date" 
                    value={manualEndDate} 
                    onChange={(e) => setManualEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="input-row">
                <div className="input-field" style={{flex: 1}}>
                  <label>사유</label>
                  <input 
                    type="text" 
                    value={manualReason} 
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="예: 병원 진료"
                  />
                </div>
              </div>
            </div>
            
            <textarea
              className="paste-textarea"
              placeholder="학생 이름이나 학번을 입력하세요&#10;(여러 명은 엔터, 쉼표, 탭으로 구분)&#10;&#10;예시:&#10;홍길동&#10;김철수, 이영희&#10;24-001"
              value={pasteInput}
              onChange={handlePasteInput}
              rows={4}
            />
            <button 
              className="btn-paste-add" 
              onClick={processPastedNames}
              disabled={!pasteInput.trim()}
            >
              ➕ 명단 추가
            </button>
          </div>

          {/* 선택된 학생 명단 표시 */}
          {preRegisterStudents.length > 0 && (
            <div className="selected-students-card">
              <div className="selected-students-header">
                <h4>✅ 선택된 학생 ({preRegisterStudents.length}명)</h4>
                <button 
                  className="btn-clear-all"
                  onClick={() => setPreRegisterStudents([])}
                  title="전체 선택 해제"
                >
                  ✕ 전체 해제
                </button>
              </div>
              <div className="selected-students-list">
                {preRegisterStudents.map(studentId => {
                  const student = allStudents.find(s => s.id === studentId);
                  if (!student) return null;
                  return (
                    <div key={studentId} className="selected-student-item">
                      <div className="student-info">
                        <span className="student-name">{student.name}</span>
                        <span className="student-number">{student.studentNumber}</span>
                        <span className="student-grade">{student.grade}학년</span>
                      </div>
                      <button 
                        className="btn-remove-student"
                        onClick={() => togglePreRegister(studentId)}
                        title="제거"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {preRegisterStudents.length > 0 && (
            <div className="pre-register-footer">
              <button className="btn-save-preregister" onClick={savePreRegistration}>
                💾 {preRegisterStudents.length}명 공결 등록
              </button>
            </div>
          )}

          {/* 등록된 공결 명단 조회 */}
          <div className="registered-absences-card">
            <div className="registered-header">
              <h3>📋 등록된 공결 명단</h3>
              <div className="date-filter-group">
                <input 
                  type="date" 
                  value={preAbsenceViewDate} 
                  onChange={(e) => setPreAbsenceViewDate(e.target.value)}
                  className="date-filter-input"
                />
                <button className="btn-load-absences" onClick={loadRegisteredPreAbsences}>
                  🔍 조회
                </button>
              </div>
            </div>
            
            {registeredPreAbsences.length > 0 && (
              <div className="absences-actions">
                <button 
                  className="btn-select-all"
                  onClick={toggleSelectAll}
                >
                  {selectedAbsences.length === registeredPreAbsences.length ? '✓ 전체 해제' : '☐ 전체 선택'}
                </button>
                {selectedAbsences.length > 0 && (
                  <button 
                    className="btn-delete-selected"
                    onClick={deleteSelectedAbsences}
                  >
                    🗑️ 선택 삭제 ({(() => {
                      // 선택된 absence ID들에 해당하는 고유 학생 수 계산
                      const selectedStudentIds = new Set(
                        registeredPreAbsences
                          .filter(a => selectedAbsences.includes(a.id))
                          .map(a => a.studentId)
                      );
                      return selectedStudentIds.size;
                    })()}명)
                  </button>
                )}
              </div>
            )}
            
            {registeredPreAbsences.length > 0 ? (
              <div className="registered-absences-list">
                <div className="absences-summary">
                  총 <strong>{(() => {
                    // 학생별로 그룹화하여 고유 학생 수 계산
                    const uniqueStudents = new Set(registeredPreAbsences.map(a => a.studentId));
                    return uniqueStudents.size;
                  })()}명</strong>의 학생이 공결 등록되어 있습니다.
                </div>
                {(() => {
                  // 학생별로 그룹화
                  const studentGroups = {};
                  registeredPreAbsences.forEach(absence => {
                    if (!studentGroups[absence.studentId]) {
                      studentGroups[absence.studentId] = {
                        studentId: absence.studentId,
                        studentName: absence.studentName,
                        studentNumber: absence.studentNumber,
                        grade: absence.grade,
                        reason: absence.reason || '공결',
                        // 학생의 자습실 위치 찾기
                        room: allStudents.find(s => s.id === absence.studentId)?.room || '미지정',
                        absenceIds: [] // 이 학생의 모든 공결 ID 목록
                      };
                    }
                    studentGroups[absence.studentId].absenceIds.push(absence.id);
                  });
                  
                  return Object.values(studentGroups).map((student, index) => {
                    // 이 학생의 모든 공결이 선택되었는지 확인
                    const allSelected = student.absenceIds.every(id => selectedAbsences.includes(id));
                    const someSelected = student.absenceIds.some(id => selectedAbsences.includes(id));
                    
                    return (
                      <div key={student.studentId || index} className="absence-item">
                        <input 
                          type="checkbox"
                          className="absence-checkbox"
                          checked={allSelected}
                          onChange={() => {
                            if (allSelected) {
                              // 이 학생의 모든 공결 선택 해제
                              setSelectedAbsences(prev => prev.filter(id => !student.absenceIds.includes(id)));
                            } else {
                              // 이 학생의 모든 공결 선택
                              setSelectedAbsences(prev => [...new Set([...prev, ...student.absenceIds])]);
                            }
                          }}
                        />
                        <div className="absence-content">
                          <div className="absence-student-info">
                            <span className="absence-name">{student.studentName}</span>
                            <span className="absence-number">{student.studentNumber}</span>
                            <span className="absence-room">{student.room}</span>
                          </div>
                          <div className="absence-details">
                            <span className="absence-reason">{student.reason}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="no-absences-message">
                {preAbsenceViewDate === format(new Date(), 'yyyy-MM-dd') 
                  ? '오늘 등록된 공결이 없습니다.' 
                  : `${preAbsenceViewDate}에 등록된 공결이 없습니다.`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  // 🔐 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [currentView, setCurrentView] = useState('home');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentSession, setCurrentSession] = useState('1');
  const [grades, setGrades] = useState({});
  const [gradeAbsenceCounts, setGradeAbsenceCounts] = useState({});
  const [roomStats, setRoomStats] = useState({}); // 자습공간별 총원/공결 정보
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'seating'
  const [showNextRoomModal, setShowNextRoomModal] = useState(false);
  const [supervisorName, setSupervisorName] = useState(localStorage.getItem('supervisorName') || '');
  const [showNameInput, setShowNameInput] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedRooms, setCompletedRooms] = useState(new Set());
  const [seatingData, setSeatingData] = useState(null);
  const [hasSeatingChart, setHasSeatingChart] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 기본값 100%
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const seatingWrapperRef = useRef(null);
  
  // 터치 제스처 상태
  const touchStateRef = useRef({
    isDragging: false,
    isPinching: false,
    startPos: null,
    startPan: null,
    startDistance: null,
    startZoom: null,
    lastTouchCount: 0,
    hasMoved: false,
    startTarget: null
  });

  // 🔐 컴포넌트 마운트 시 세션 확인
  useEffect(() => {
    const auth = sessionStorage.getItem('ksa_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    loadGrades();
  }, []);

  // 좌석배치 로드 시 자동 fit-to-screen
  useEffect(() => {
    if (seatingData && hasSeatingChart && seatingWrapperRef.current && viewMode === 'seating') {
      // 약간의 딘레이를 주어 DOM이 렌더링되기를 기다림
      setTimeout(() => {
        const wrapper = seatingWrapperRef.current;
        if (!wrapper) return;
        
        const container = wrapper.parentElement;
        if (!container) return;
        
        const wrapperWidth = wrapper.scrollWidth;
        const wrapperHeight = wrapper.scrollHeight;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 컸테이너에 맞게 줌 계산 (여백 10px 고려)
        const scaleX = (containerWidth - 20) / wrapperWidth;
        const scaleY = (containerHeight - 20) / wrapperHeight;
        const initialZoom = Math.min(scaleX, scaleY, 1); // 최대 100%
        
        setZoomLevel(initialZoom);
        setPanPosition({ x: 0, y: 0 }); // 초기 위치
      }, 100);
    }
  }, [seatingData, hasSeatingChart, viewMode]);

  // 줌 레벨 변경 시 경계 재조정
  useEffect(() => {
    if (seatingWrapperRef.current) {
      setPanPosition(prev => constrainPanPosition(prev, zoomLevel));
    }
  }, [zoomLevel]);

  // 실시간 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 날짜/세션 변경 시 공결 데이터 다시 로드
  useEffect(() => {
    const reloadPreAbsence = async () => {
      if (!students.length || !selectedRoomName) {
        console.log('[Pre-Absence] Skipping: students.length=', students.length, 'selectedRoomName=', selectedRoomName);
        return;
      }
      
      console.log('[Pre-Absence] Loading for:', { 
        date: currentDate, 
        session: currentSession, 
        viewMode,
        studentsCount: students.length 
      });
      
      try {
        // 공결 데이터 로드
        const preAbsenceResponse = await axios.get(`${API_BASE}/pre-absence`, {
          params: { date: currentDate }
        });
        
        console.log('[Pre-Absence] Received data:', preAbsenceResponse.data);
        
        // 공결 등록된 학생은 excused로 설정
        setAttendance(prevAttendance => {
          const updatedAttendance = { ...prevAttendance };
          
          // 공결 등록된 학생은 excused로 강제 설정 (모든 기존 상태 오버라이드)
          let excusedCount = 0;
          preAbsenceResponse.data.forEach(absence => {
            if (absence.session === currentSession && updatedAttendance.hasOwnProperty(absence.studentId)) {
              console.log('[Pre-Absence] Setting excused (override):', absence.studentId, absence.studentName, 'from', updatedAttendance[absence.studentId]);
              updatedAttendance[absence.studentId] = 'excused';
              excusedCount++;
            }
          });
          
          console.log('[Pre-Absence] Applied excused status to', excusedCount, 'students');
          
          return updatedAttendance;
        });
      } catch (error) {
        console.error('공결 데이터 로드 오류:', error);
      }
    };
    
    reloadPreAbsence();
  }, [currentDate, currentSession, students.length, selectedRoomName, viewMode]);

  // 감독 이름 저장
  const saveSupervisorName = (name) => {
    setSupervisorName(name);
    localStorage.setItem('supervisorName', name);
    setShowNameInput(false);
  };

  const loadGrades = async () => {
    try {
      const response = await axios.get(`${API_BASE}/grades`);
      setGrades(response.data);
      
      // 당일 공결 학생 수 로드
      const today = format(new Date(), 'yyyy-MM-dd');
      const preAbsenceResponse = await axios.get(`${API_BASE}/pre-absence`, {
        params: { date: today }
      });
      
      // 학년별로 공결 학생 수 계산 (중복 제거)
      const absenceCounts = {};
      const studentsByGrade = {};
      
      preAbsenceResponse.data.forEach(absence => {
        const grade = absence.grade;
        if (!studentsByGrade[grade]) {
          studentsByGrade[grade] = new Set();
        }
        studentsByGrade[grade].add(absence.studentId);
      });
      
      Object.keys(studentsByGrade).forEach(grade => {
        absenceCounts[grade] = studentsByGrade[grade].size;
      });
      
      setGradeAbsenceCounts(absenceCounts);
      console.log('[loadGrades] Absence counts:', absenceCounts);
    } catch (error) {
      console.error('학년 데이터 로드 오류:', error);
    }
  };

  const loadStudents = async (grade, roomName) => {
    // 이미 로딩 중이면 중복 요청 방지
    if (loading) {
      console.log('[loadStudents] Already loading, skipping...');
      return;
    }
    
    setLoading(true);
    console.log('[loadStudents] Starting load for:', { grade, roomName, date: currentDate, session: currentSession });
    
    try {
      // 학생 목록 로드
      const response = await axios.get(`${API_BASE}/students`, {
        params: { grade, room: roomName }
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('학생 목록이 비어있습니다.');
      }
      
      setStudents(response.data);
      console.log('[loadStudents] Loaded students:', response.data.length);
      
      // 좌석 배치 데이터 로드 시도 (2, 3학년 전용)
      if (grade >= 2) {
        try {
          const seatingResponse = await axios.get(`${API_BASE}/seating/${encodeURIComponent(roomName)}`);
          // rows, layout (배열), columns 중 하나라도 있으면 좌석 배치 데이터가 있는 것으로 판단
          const hasValidSeating = seatingResponse.data && (
            (seatingResponse.data.rows && Array.isArray(seatingResponse.data.rows)) ||
            (seatingResponse.data.layout && Array.isArray(seatingResponse.data.layout)) ||
            (seatingResponse.data.columns && Array.isArray(seatingResponse.data.columns))
          );
          
          if (hasValidSeating) {
            setSeatingData(seatingResponse.data);
            setHasSeatingChart(true);
            // 좌석배치가 기본 화면, 목록보기 버튼으로 전환 가능
            setViewMode('seating');
            console.log('[loadStudents] Loaded seating chart - seating view is default');
          } else {
            throw new Error('좌석 데이터 형식 오류');
          }
        } catch (error) {
          console.log('[loadStudents] 좌석 배치 없음:', roomName, error.message);
          setSeatingData(null);
          setHasSeatingChart(false);
          setViewMode('grid');
        }
      } else {
        setSeatingData(null);
        setHasSeatingChart(false);
        setViewMode('grid');
      }
      
      // 출석 데이터 로드
      const attendanceResponse = await axios.get(`${API_BASE}/attendance`, {
        params: { date: currentDate, session: currentSession, room: roomName }
      });
      console.log('[loadStudents] Attendance data:', attendanceResponse.data.length, 'records');
      
      // 공결 데이터 로드
      const preAbsenceResponse = await axios.get(`${API_BASE}/pre-absence`, {
        params: { date: currentDate }
      });
      console.log('[loadStudents] Pre-absence data:', preAbsenceResponse.data.length, 'records');
      
      // 출석 상태 초기화
      const newAttendance = {};
      response.data.forEach(student => {
        newAttendance[student.id] = 'present';
      });
      
      // 기존 출석 데이터가 있으면 먼저 로드
      if (attendanceResponse.data.length > 0 && attendanceResponse.data[0].attendanceData) {
        Object.assign(newAttendance, attendanceResponse.data[0].attendanceData);
        console.log('[loadStudents] Loaded existing attendance');
      }
      
      // 공결 등록된 학생은 excused로 설정 (출석 데이터보다 우선)
      let excusedCount = 0;
      preAbsenceResponse.data.forEach(absence => {
        if (absence.session === currentSession && newAttendance.hasOwnProperty(absence.studentId)) {
          newAttendance[absence.studentId] = 'excused';
          excusedCount++;
        }
      });
      console.log('[loadStudents] Applied', excusedCount, 'excused statuses');
      
      setAttendance(newAttendance);
      console.log('[loadStudents] Load complete!');
      
    } catch (error) {
      console.error('[loadStudents] 오류 발생:', error);
      
      // 사용자 친화적 오류 메시지
      let errorMessage = '학생 목록을 불러오는데 실패했습니다.';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `${roomName}의 학생 정보를 찾을 수 없습니다.`;
        } else if (error.response.status === 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      
      // 오류 발생 시 초기화
      setStudents([]);
      setSeatingData(null);
      setHasSeatingChart(false);
      setAttendance({});
      
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId) => {
    // 공결 학생은 클릭해도 상태 변경 안됨
    const currentStatus = attendance[studentId] || 'present';
    if (currentStatus === 'excused') {
      console.log('[toggleAttendance] 공결 학생은 변경 불가:', studentId);
      return; // 공결 학생은 토글 불가
    }
    
    // 출석 <-> 결석만 토글
    const statuses = ['present', 'absent'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    
    console.log('[toggleAttendance]', {
      studentId,
      currentStatus,
      nextStatus: statuses[nextIndex]
    });
    
    setAttendance(prevAttendance => ({
      ...prevAttendance,
      [studentId]: statuses[nextIndex]
    }));
  };

  const markAllPresent = async () => {
    try {
      // 공결 데이터 다시 로드
      const preAbsenceResponse = await axios.get(`${API_BASE}/pre-absence`, {
        params: { date: currentDate }
      });
      
      const newAttendance = {};
      students.forEach(student => {
        newAttendance[student.id] = 'present';
      });
      
      // 공결 등록된 학생은 excused 유지
      preAbsenceResponse.data.forEach(absence => {
        if (absence.session === currentSession && newAttendance.hasOwnProperty(absence.studentId)) {
          newAttendance[absence.studentId] = 'excused';
        }
      });
      
      setAttendance(newAttendance);
    } catch (error) {
      console.error('전체 출석 처리 오류:', error);
      // 오류 발생 시에도 기본 처리
      const newAttendance = {};
      students.forEach(student => {
        newAttendance[student.id] = 'present';
      });
      setAttendance(newAttendance);
    }
  };

  const resetAttendance = async () => {
    if (window.confirm('현재 출결 상황을 모두 초기화하시겠습니까?\n\n저장된 출석 데이터가 삭제됩니다.')) {
      try {
        // 서버에서 해당 날짜/차수의 출석 데이터 삭제
        await axios.delete(`${API_BASE}/attendance`, {
          params: { 
            date: currentDate, 
            session: currentSession, 
            room: selectedRoomName 
          }
        });
        
        // 공결 데이터 다시 로드
        const preAbsenceResponse = await axios.get(`${API_BASE}/pre-absence`, {
          params: { date: currentDate }
        });
        
        const newAttendance = {};
        students.forEach(student => {
          newAttendance[student.id] = 'present';
        });
        
        // 공결 등록된 학생은 excused로 설정
        preAbsenceResponse.data.forEach(absence => {
          if (absence.session === currentSession && newAttendance.hasOwnProperty(absence.studentId)) {
            newAttendance[absence.studentId] = 'excused';
          }
        });
        
        setAttendance(newAttendance);
        
        // 초기화 알림
        const successMsg = document.createElement('div');
        successMsg.className = 'toast-success';
        successMsg.textContent = '✓ 출결 초기화 완료! (서버 데이터 삭제됨)';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      } catch (error) {
        console.error('초기화 오류:', error);
        alert('초기화 중 오류가 발생했습니다.');
      }
    }
  };

  const saveAttendance = async () => {
    try {
      await axios.post(`${API_BASE}/attendance`, {
        date: currentDate,
        session: currentSession,
        room: selectedRoomName,
        attendanceData: attendance
      });
      
      // 완료된 장소에 추가
      setCompletedRooms(prev => new Set([...prev, selectedRoom]));
      
      // 성공 알림
      const successMsg = document.createElement('div');
      successMsg.className = 'toast-success';
      successMsg.textContent = '✓ 저장 완료!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
      
      // 다음 장소 선택 모달 표시
      setShowNextRoomModal(true);
    } catch (error) {
      console.error('출석 저장 오류:', error);
      alert('출석 저장에 실패했습니다.');
    }
  };

  const selectGrade = async (grade) => {
    setSelectedGrade(grade);
    setCurrentView('roomSelect');
    
    // 자습공간별 총원 및 공결 정보 로드
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // 해당 학년의 모든 학생 정보 가져오기
      const studentsResponse = await axios.get(`${API_BASE}/students`, {
        params: { grade }
      });
      
      // 당일 공결 정보 가져오기
      const preAbsenceResponse = await axios.get(`${API_BASE}/pre-absence`, {
        params: { date: today }
      });
      
      // 자습공간별로 그룹화
      const stats = {};
      const gradeRooms = grades[grade]?.rooms || [];
      
      // 정규화 함수
      const normalizeRoomName = (name) => name?.replace(/\s+/g, ' ').trim();
      
      // 각 방별 학생 수와 공결 수를 먼저 계산 (즉시 표시)
      for (const room of gradeRooms) {
        // 해당 공간의 학생 수 (개행문자와 공백 제거하여 비교)
        const roomStudents = studentsResponse.data.filter(s => 
          normalizeRoomName(s.studyRoom) === normalizeRoomName(room.name) || 
          normalizeRoomName(s.room) === normalizeRoomName(room.name)
        );
        const totalCount = roomStudents.length;
        
        // 해당 공간의 공결 학생 수 (중복 제거)
        const roomStudentIds = new Set(roomStudents.map(s => s.id));
        const absenceCount = preAbsenceResponse.data
          .filter(a => roomStudentIds.has(a.studentId))
          .reduce((acc, a) => {
            acc.add(a.studentId);
            return acc;
          }, new Set()).size;
        
        // 즉시 기본 통계 설정 (체크 상태는 아직 false)
        stats[room.name] = {
          total: totalCount,
          absence: absenceCount,
          session1Checked: false,
          session2Checked: false
        };
      }
      
      // 먼저 기본 통계를 즉시 표시
      setRoomStats(stats);
      console.log('[selectGrade] Initial stats:', stats);
      
      // 이제 모든 출석 체크 상태를 병렬로 로드 (백그라운드)
      const attendanceChecks = gradeRooms.map(async (room) => {
        try {
          const [session1Response, session2Response] = await Promise.all([
            axios.get(`${API_BASE}/attendance`, {
              params: { date: today, session: '1', room: room.name }
            }),
            axios.get(`${API_BASE}/attendance`, {
              params: { date: today, session: '2', room: room.name }
            })
          ]);
          
          return {
            roomName: room.name,
            session1Checked: session1Response.data.length > 0,
            session2Checked: session2Response.data.length > 0
          };
        } catch (err) {
          console.warn(`[selectGrade] 출석 데이터 확인 오류 (${room.name}):`, err);
          return {
            roomName: room.name,
            session1Checked: false,
            session2Checked: false
          };
        }
      });
      
      // 모든 출석 체크 완료 대기
      const checkResults = await Promise.all(attendanceChecks);
      
      // 출석 체크 상태 업데이트
      checkResults.forEach(result => {
        if (stats[result.roomName]) {
          stats[result.roomName].session1Checked = result.session1Checked;
          stats[result.roomName].session2Checked = result.session2Checked;
        }
      });
      
      // 최종 통계 업데이트
      setRoomStats({...stats});
      console.log('[selectGrade] Final stats with checks:', stats);
    } catch (error) {
      console.error('자습공간 통계 로드 오류:', error);
    }
  };

  const selectRoom = async (roomId, roomName) => {
    console.log('[selectRoom] Selecting:', roomId, roomName);
    
    // 상태 업데이트 먼저 수행
    setSelectedRoom(roomId);
    setSelectedRoomName(roomName);
    setShowNextRoomModal(false);
    
    // 로딩 시작 전에 뷰 전환 (사용자 경험 개선)
    setCurrentView('attendance');
    
    // 약간의 지연 후 로드 (상태 업데이트 완료 보장)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 학생 데이터 로드
    await loadStudents(selectedGrade, roomName);
  };

  const goBack = () => {
    // 계층적 네비게이션
    if (currentView === 'attendance') {
      // 출석체크 → 교실 선택
      setCurrentView('roomSelect');
      setSelectedRoom(null);
      setSelectedRoomName('');
      setStudents([]);
      setAttendance({});
    } else if (currentView === 'roomSelect') {
      // 교실 선택 → 홈
      setCurrentView('home');
      setSelectedGrade(null);
    } else {
      // 기타 → 홈
      goHome();
    }
  };

  const goHome = () => {
    setCurrentView('home');
    setSelectedGrade(null);
    setSelectedRoom(null);
    setSelectedRoomName('');
    setStudents([]);
    setAttendance({});
    setShowNextRoomModal(false);
    
    // 모든 체크 완료 후 감독자 이름 리셋
    setSupervisorName('');
    localStorage.removeItem('supervisorName');
    setCompletedRooms(new Set());
  };

  const getRemainingRooms = () => {
    if (!selectedGrade || !grades[selectedGrade]) return [];
    return grades[selectedGrade].rooms.filter(room => room.id !== selectedRoom);
  };

  const goToNextRoom = (roomId, roomName) => {
    selectRoom(roomId, roomName);
  };

  const stayCurrentRoom = () => {
    setShowNextRoomModal(false);
  };

  const getStatusStyle = (status) => {
    const styles = {
      present: { bg: '#10b981', text: '출석', icon: '✓' },
      absent: { bg: '#ef4444', text: '결석', icon: '✗' },
      excused: { bg: '#f59e0b', text: '공결', icon: '○' }
    };
    return styles[status] || styles.present;
  };

  const getAttendanceStats = () => {
    const stats = {
      total: students.length,
      present: 0,
      absent: 0,
      excused: 0
    };
    
    Object.values(attendance).forEach(status => {
      if (stats[status] !== undefined) stats[status]++;
    });
    
    return stats;
  };

  // 확대/축소 핸들러
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3)); // 최대 300%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.3)); // 최소 30%
  };

  const handleResetZoom = () => {
    setZoomLevel(1); // 기본 100%
    setPanPosition({ x: 0, y: 0 });
  };

  // 더블클릭 줌 핸들러
  const handleDoubleClick = (e) => {
    // 버튼 클릭은 제외
    if (e.target.closest('.seat-btn')) {
      return;
    }
    
    if (zoomLevel < 1.5) {
      setZoomLevel(2);
    } else if (zoomLevel < 2.5) {
      setZoomLevel(3);
    } else {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  // 터치 제스처 헬퍼 함수
  const getTouchDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  // 좌석 버튼 전용 터치 핸들러 (탭과 드래그 구분)
  const handleSeatTouchStart = (studentId, e) => {
    // 멀티터치는 무시 (핀치 줌)
    if (e.touches.length > 1) {
      return;
    }
    
    const touchState = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startTime: Date.now(),
      hasMoved: false,
      cancelled: false
    };
    
    const handleMove = (moveEvent) => {
      if (touchState.cancelled || !moveEvent.touches[0]) return;
      
      const deltaX = moveEvent.touches[0].clientX - touchState.startX;
      const deltaY = moveEvent.touches[0].clientY - touchState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // 10px 이상 이동하면 드래그로 인식
      if (distance > 10) {
        touchState.hasMoved = true;
      }
    };
    
    const handleEnd = (endEvent) => {
      if (touchState.cancelled) return;
      
      const duration = Date.now() - touchState.startTime;
      
      // 짧은 시간(300ms 이하)이고 거의 움직이지 않았으면 탭으로 인식
      if (!touchState.hasMoved && duration < 300) {
        // 약간의 지연으로 더블탭 방지
        requestAnimationFrame(() => {
          toggleAttendance(studentId);
        });
      }
      
      cleanup();
    };
    
    const handleCancel = () => {
      touchState.cancelled = true;
      cleanup();
    };
    
    const cleanup = () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleCancel);
    };
    
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd, { once: true });
    document.addEventListener('touchcancel', handleCancel, { once: true });
  };

  // 터치 제스처 핸들러 (버튼 위에서도 드래그 가능)
  const handleTouchStart = (e) => {
    const touchCount = e.touches.length;
    const state = touchStateRef.current;

    if (touchCount === 1) {
      // 단일 터치: 드래그 준비 (버튼 포함)
      state.isDragging = false; // 아직 드래그가 아님
      state.isPinching = false;
      state.hasMoved = false;
      state.startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      state.startPan = { ...panPosition };
      state.startTarget = e.target; // 시작 타겟 기록
    } else if (touchCount === 2) {
      // 두 손가락: 핀치 줌 시작 (버튼 위에서도 작동)
      e.preventDefault(); // 기본 동작 방지
      state.isDragging = false;
      state.isPinching = true;
      state.hasMoved = false;
      state.startDistance = getTouchDistance(e.touches[0], e.touches[1]);
      state.startZoom = zoomLevel;
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      state.startPos = center;
      state.startPan = { ...panPosition };
    }
    
    state.lastTouchCount = touchCount;
  };

  // 드래그 경계 제한 계산
  const constrainPanPosition = (newPan, currentZoom) => {
    if (!seatingWrapperRef.current) return newPan;
    
    const wrapper = seatingWrapperRef.current;
    const container = wrapper.parentElement;
    if (!container) return newPan;
    
    const wrapperWidth = wrapper.scrollWidth * currentZoom;
    const wrapperHeight = wrapper.scrollHeight * currentZoom;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // 최대/최소 이동 범위 계산 (여백 제거)
    const maxX = 0;
    const minX = Math.min(0, containerWidth - wrapperWidth);
    const maxY = 0;
    const minY = Math.min(0, containerHeight - wrapperHeight);
    
    return {
      x: Math.max(minX, Math.min(maxX, newPan.x)),
      y: Math.max(minY, Math.min(maxY, newPan.y))
    };
  };

  const handleTouchMove = (e) => {
    const state = touchStateRef.current;
    const touchCount = e.touches.length;

    if (touchCount === 1 && state.startPos && state.startPan) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - state.startPos.x;
      const deltaY = touch.clientY - state.startPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // 5px 이상 이동하면 드래그로 인식
      if (!state.hasMoved && distance > 5) {
        state.hasMoved = true;
        state.isDragging = true;
        e.preventDefault(); // 드래그 시작 시 기본 동작 방지
      }
      
      // 드래그 중일 때
      if (state.isDragging) {
        e.preventDefault();
        
        const newPan = {
          x: state.startPan.x + deltaX,
          y: state.startPan.y + deltaY
        };
        
        setPanPosition(constrainPanPosition(newPan, zoomLevel));
      }
    } else if (touchCount === 2 && state.isPinching && state.startDistance && state.startZoom) {
      // 핀치 줌 (버튼 위에서도 작동)
      e.preventDefault();
      state.hasMoved = true;
      
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);
      
      // 줌 배율 계산
      const scale = currentDistance / state.startDistance;
      const newZoom = Math.max(0.3, Math.min(3, state.startZoom * scale));
      
      // 핀치 중심점 이동량 계산
      const centerDeltaX = currentCenter.x - state.startPos.x;
      const centerDeltaY = currentCenter.y - state.startPos.y;
      
      const newPan = {
        x: state.startPan.x + centerDeltaX,
        y: state.startPan.y + centerDeltaY
      };
      
      setZoomLevel(newZoom);
      setPanPosition(constrainPanPosition(newPan, newZoom));
    }
  };

  const handleTouchEnd = (e) => {
    const state = touchStateRef.current;
    const touchCount = e.touches.length;

    if (touchCount === 0) {
      // 모든 터치 끝
      // 드래그하지 않았고 버튼 위였다면 클릭 발생시키기
      if (!state.hasMoved && state.startTarget && state.startTarget.closest('.seat-btn')) {
        const button = state.startTarget.closest('.seat-btn');
        button.click(); // 프로그래매틱하게 클릭 이벤트 발생
      }
      
      // 초기화
      state.isDragging = false;
      state.isPinching = false;
      state.hasMoved = false;
      state.startPos = null;
      state.startPan = null;
      state.startDistance = null;
      state.startZoom = null;
      state.startTarget = null;
    } else if (touchCount === 1 && state.lastTouchCount === 2) {
      // 핀치에서 단일 터치로 전환
      state.isDragging = false;
      state.isPinching = false;
      state.hasMoved = false;
      state.startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      state.startPan = { ...panPosition };
      state.startDistance = null;
      state.startZoom = null;
    }
    
    state.lastTouchCount = touchCount;
  };

  // 마우스 휠로 줌 조절 (Shift 키 또는 Ctrl 키)
  const handleWheel = (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoomLevel(prev => Math.max(0.3, Math.min(3, prev + delta)));
    }
  };

  // 마우스 드래그로 팬 (이동) 조절
  const handleMouseDown = (e) => {
    // 버튼 클릭은 제외 (seat-btn 클래스 체크)
    if (e.target.closest('.seat-btn')) {
      return;
    }
    
    if (e.button === 0) { // 왼쪽 버튼만
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setLastPanPosition(panPosition);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 전역 이벤트 리스너로 처리 (wrapper 밖에서도 작동)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        const newPan = {
          x: lastPanPosition.x + deltaX,
          y: lastPanPosition.y + deltaY
        };
        setPanPosition(constrainPanPosition(newPan, zoomLevel));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart, lastPanPosition, zoomLevel]);

  // 좌석 배치도 렌더링 (2, 3학년용) - 버튼 기반
  const renderSeatingChart = () => {
    if (!seatingData || !seatingData.layout) {
      return renderGridView();
    }

    // 창조관 8층 A - 9개 행 레이아웃 (빈 공간 포함)
    if (selectedRoomName === '창조관 8층 면학실 A') {
      return (
        <div className="seating-chart room-8a">
          <div className="seating-rows">
            {seatingData.layout.map((row, rIdx) => (
              <div key={rIdx} className="seating-row">
                {row.seats.map((seat, sIdx) => {
                  if (!seat) {
                    // 빈 공간 (이동 통로)
                    return <div key={`empty-${rIdx}-${sIdx}`} className="seat-empty"></div>;
                  }
                  const status = attendance[seat.id] || 'present';
                  const style = getStatusStyle(status);
                  return (
                    <div
                      key={seat.id}
                      className="seat-btn"
                      onClick={() => toggleAttendance(seat.id)}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleSeatTouchStart(seat.id, e);
                      }}
                      style={{ backgroundColor: style.bg }}
                    >
                      <div className="seat-icon">{style.icon}</div>
                      <div className="seat-name">{seat.name}</div>
                      <div className="seat-number">{seat.studentNumber}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 창조관 8층 B - row.seats 배열 형식
    if (selectedRoomName === '창조관 8층 면학실 B') {
      return (
        <div className="seating-chart room-8b">
          <div className="seating-rows">
            {seatingData.layout.map((row, rIdx) => (
              <div key={rIdx} className="seating-row">
                {row.seats.map((seat, sIdx) => {
                  if (!seat) {
                    // 빈 공간 (이동 통로)
                    return <div key={`empty-${rIdx}-${sIdx}`} className="seat-empty"></div>;
                  }
                  const status = attendance[seat.id] || 'present';
                  const style = getStatusStyle(status);
                  return (
                    <div
                      key={seat.id}
                      className="seat-btn"
                      onClick={() => toggleAttendance(seat.id)}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleSeatTouchStart(seat.id, e);
                      }}
                      style={{ backgroundColor: style.bg }}
                    >
                      <div className="seat-icon">{style.icon}</div>
                      <div className="seat-name">{seat.name}</div>
                      <div className="seat-number">{seat.studentNumber}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 본관3층 도서관 우측 별실 - 세로 열 배치
    if (selectedRoomName === '본관3층 도서관 우측 별실' && seatingData.columns) {
      return (
        <div className="seating-chart room-library">
          <div className="seating-columns">
            {seatingData.columns.map((column, cIdx) => {
              // 빈 컬럼(통로)인 경우
              if (column.seats && column.seats.length === 0) {
                return <div key={cIdx} className="aisle-column"></div>;
              }
              
              return (
                <div key={cIdx} className="seating-column">
                  {column.seats.map((seat, sIdx) => {
                    if (!seat) {
                      // 빈 공간
                      return <div key={`empty-${cIdx}-${sIdx}`} className="seat-empty"></div>;
                    }
                    const status = attendance[seat.id] || 'present';
                    const style = getStatusStyle(status);
                    return (
                      <div
                        key={seat.id}
                        className="seat-btn"
                        onClick={() => toggleAttendance(seat.id)}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          handleSeatTouchStart(seat.id, e);
                        }}
                        style={{ backgroundColor: style.bg }}
                      >
                        <div className="seat-icon">{style.icon}</div>
                        <div className="seat-name">{seat.name}</div>
                        <div className="seat-number">{seat.studentNumber}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 기타 공간 - 그리드 형태
    return (
      <div className="seating-chart">
        <div className="seating-grid-layout">
          {seatingData.layout.map((row, rIdx) => {
            // 빈 행(통로)인 경우
            if (row.seats && row.seats.length === 0) {
              return <div key={rIdx} className="aisle-row"></div>;
            }
            
            return (
            <div key={rIdx} className="seating-row">
              {row.seats ? row.seats.map((seat, sIdx) => {
                if (!seat) return <div key={`empty-${sIdx}`} className="seat-empty"></div>;
                const status = attendance[seat.id] || 'present';
                const style = getStatusStyle(status);
                return (
                  <div
                    key={seat.id}
                    className="seat-btn"
                    onClick={() => toggleAttendance(seat.id)}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleSeatTouchStart(seat.id, e);
                    }}
                    style={{ backgroundColor: style.bg }}
                  >
                    <div className="seat-icon">{style.icon}</div>
                    <div className="seat-name">{seat.name}</div>
                    <div className="seat-number">{seat.studentNumber}</div>
                  </div>
                );
              }) : (
                // 형설관 2열 배치
                <>
                  {row.leftSeat && (() => {
                    const status = attendance[row.leftSeat.id] || 'present';
                    const style = getStatusStyle(status);
                    return (
                      <div
                        className="seat-btn"
                        onClick={() => toggleAttendance(row.leftSeat.id)}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          handleSeatTouchStart(row.leftSeat.id, e);
                        }}
                        style={{ backgroundColor: style.bg }}
                      >
                        <div className="seat-icon">{style.icon}</div>
                        <div className="seat-name">{row.leftSeat.name}</div>
                        <div className="seat-number">{row.leftSeat.studentNumber}</div>
                      </div>
                    );
                  })()}
                  {row.rightSeat && (() => {
                    const status = attendance[row.rightSeat.id] || 'present';
                    const style = getStatusStyle(status);
                    return (
                      <div
                        className="seat-btn"
                        onClick={() => toggleAttendance(row.rightSeat.id)}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          handleSeatTouchStart(row.rightSeat.id, e);
                        }}
                        style={{ backgroundColor: style.bg }}
                      >
                        <div className="seat-icon">{style.icon}</div>
                        <div className="seat-name">{row.rightSeat.name}</div>
                        <div className="seat-number">{row.rightSeat.studentNumber}</div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 그리드 뷰 렌더링
  const renderGridView = () => {
    return (
      <div className="students-grid">
        {students.map(student => {
          const status = attendance[student.id] || 'present';
          const style = getStatusStyle(status);
          return (
            <div
              key={student.id}
              className="student-card"
              onClick={() => toggleAttendance(student.id)}
              onTouchStart={(e) => {
                e.stopPropagation();
                handleSeatTouchStart(student.id, e);
              }}
              style={{ backgroundColor: style.bg }}
            >
              <div className="card-icon">{style.icon}</div>
              <div className="card-name">{student.name}</div>
              <div className="card-number">{student.studentNumber}</div>
              <div className="card-status">{style.text}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // 🔐 로그인 처리
  const handleLogin = (e) => {
    e.preventDefault();
    const CORRECT_PASSWORD = 'ksa2025'; // 비밀번호 설정 (원하시는 대로 변경 가능)
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('ksa_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('비밀번호가 틀렸습니다.');
      setPassword('');
    }
  };

  // 🔐 로그아웃 처리
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ksa_auth');
    setPassword('');
    setAuthError('');
  };

  const stats = currentView === 'attendance' ? getAttendanceStats() : null;

  // 🔐 인증되지 않은 경우 로그인 화면 표시
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>🔒 KSA 면학 지도시스템</h1>
            <p>선생님 전용 로그인</p>
          </div>
          
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="password"
              className="login-input"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAuthError('');
              }}
              autoFocus
            />
            {authError && <div className="login-error">{authError}</div>}
            <button 
              type="submit"
              className="login-button"
            >
              로그인
            </button>
          </form>
          
          <div className="login-footer">
            <p>비밀번호를 모르시면 관리자에게 문의하세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <div className="header-content">
          {currentView !== 'home' && (
            <button className="btn-back" onClick={goBack}>
              ← 뒤로
            </button>
          )}
          <h1 className="header-title">📱 출석체크</h1>
          {currentView !== 'home' ? (
            <button className="btn-home" onClick={goHome}>
              🏠 홈
            </button>
          ) : (
            <button 
              className="btn-logout"
              onClick={handleLogout}
              title="로그아웃"
            >
              🚪 로그아웃
            </button>
          )}
        </div>
      </header>

      {/* 홈 화면 */}
      {currentView === 'home' && (
        <div className="home-view">
          {/* 시스템 제목 */}
          <div className="hero-section">
            <h1 className="main-title">KSA 면학 지도시스템</h1>
            <p className="main-subtitle">학년을 선택하여 출석체크를 시작하세요</p>
          </div>
          
          {/* 대시보드 카드들 */}
          <div className="info-cards">
            {/* 날짜 및 시간 */}
            <div className="info-card time-card">
              <div className="card-icon-header">⏰</div>
              <div className="date-display">
                {currentTime.getFullYear()}년 {currentTime.getMonth() + 1}월 {currentTime.getDate()}일 ({['일', '월', '화', '수', '목', '금', '토'][currentTime.getDay()]})
              </div>
              <div className="time-display">
                <div className="time-main">
                  {currentTime.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </div>
                <div className="time-seconds">
                  {currentTime.toLocaleTimeString('ko-KR', { second: '2-digit' }).split(':')[2]}
                </div>
              </div>
            </div>

            {/* 자습감독 */}
            <div className="info-card supervisor-card" onClick={() => !supervisorName && setShowNameInput(true)}>
              <div className="card-icon-header">👤</div>
              {supervisorName ? (
                <>
                  <div className="supervisor-name">{supervisorName}</div>
                  <button 
                    className="btn-edit-inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNameInput(true);
                    }}
                  >
                    변경하기
                  </button>
                </>
              ) : (
                <div className="supervisor-placeholder">
                  <div className="placeholder-text">자습감독</div>
                  <div className="placeholder-hint">클릭하여 입력</div>
                </div>
              )}
            </div>
          </div>

          {/* 이름 입력 모달 */}
          {showNameInput && (
            <div className="name-input-overlay" onClick={() => setShowNameInput(false)}>
              <div className="name-input-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="name-input-title">자습감독 이름</h3>
                <input
                  type="text"
                  className="name-input-field"
                  placeholder="이름을 입력하세요"
                  defaultValue={supervisorName}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      saveSupervisorName(e.target.value.trim());
                    }
                  }}
                />
                <div className="name-input-actions">
                  <button 
                    className="name-input-btn btn-cancel-name"
                    onClick={() => setShowNameInput(false)}
                  >
                    취소
                  </button>
                  <button 
                    className="name-input-btn btn-confirm-name"
                    onClick={(e) => {
                      const input = e.target.parentElement.previousElementSibling;
                      if (input.value.trim()) {
                        saveSupervisorName(input.value.trim());
                      }
                    }}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="grade-cards">
            {Object.keys(grades).map(grade => {
              const gradeInfo = grades[grade];
              const absenceCount = gradeAbsenceCounts[grade] || 0;
              return (
                <div
                  key={grade}
                  className={`grade-card grade-${grade}`}
                  onClick={() => selectGrade(parseInt(grade))}
                >
                  <div className="grade-number">{grade}</div>
                  <div className="grade-label">학년</div>
                  <div className="grade-rooms">{gradeInfo.rooms.length}개 공간</div>
                  {absenceCount > 0 && (
                    <div className="grade-absence">공결 {absenceCount}명</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="admin-section">
            <button 
              className="admin-btn"
              onClick={() => setCurrentView('admin')}
            >
              <span className="admin-icon">📊</span>
              <span>공결 및 현황 관리</span>
            </button>
          </div>
        </div>
      )}

      {/* 자습공간 선택 */}
      {currentView === 'roomSelect' && selectedGrade && (
        <div className="room-select-view">
          <div className="section-header">
            <h2>{selectedGrade}학년 자습공간</h2>
            <p>출석체크할 공간을 선택하세요</p>
          </div>
          
          <div className="room-list">
            {grades[selectedGrade]?.rooms.map(room => {
              const stats = roomStats[room.name] || { total: 0, absence: 0, session1Checked: false, session2Checked: false };
              return (
                <div
                  key={room.id}
                  className="room-item"
                  onClick={() => selectRoom(room.id, room.name)}
                >
                  <div className="room-icon">
                    {room.hasSeating ? '🪑' : '📖'}
                  </div>
                  <div className="room-info">
                    <div className="room-name">{room.name}</div>
                    <div className="room-stats">
                      <span className="stat-item">총원: {stats.total}명</span>
                      <span className="stat-separator">|</span>
                      <span className="stat-item stat-absence">공결: {stats.absence}명</span>
                    </div>
                    <div className="room-badges">
                      {room.hasSeating && (
                        <div className="room-badge badge-seating">좌석배치</div>
                      )}
                      {stats.session1Checked && (
                        <div className="room-badge badge-check badge-session1">1차✓</div>
                      )}
                      {stats.session2Checked && (
                        <div className="room-badge badge-check badge-session2">2차✓</div>
                      )}
                    </div>
                  </div>
                  <div className="room-arrow">›</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 출석 체크 화면 */}
      {currentView === 'attendance' && students.length > 0 && (
        <div className="attendance-view">
          {/* 컨트롤 패널 */}
          <div className="control-panel">
            <div className="control-row">
              <div className="control-group">
                <label>날짜</label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="input-control"
                />
              </div>
              <div className="control-group">
                <label>차수</label>
                <select
                  value={currentSession}
                  onChange={(e) => setCurrentSession(e.target.value)}
                  className="input-control"
                >
                  <option value="1">1차 체크</option>
                  <option value="2">2차 체크</option>
                </select>
              </div>
            </div>

            <div className="room-title">{selectedRoomName}</div>

            {/* 통계 바 */}
            {stats && (
              <div className="stats-bar">
                <div className="stat-item stat-total">
                  <span className="stat-label">전체</span>
                  <span className="stat-value">{stats.total}</span>
                </div>
                <div className="stat-item stat-present">
                  <span className="stat-label">출석</span>
                  <span className="stat-value">{stats.present}</span>
                </div>
                <div className="stat-item stat-absent">
                  <span className="stat-label">결석</span>
                  <span className="stat-value">{stats.absent}</span>
                </div>
                <div className="stat-item stat-excused">
                  <span className="stat-label">공결</span>
                  <span className="stat-value">{stats.excused}</span>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="action-buttons">
              <button className="btn-action btn-all" onClick={markAllPresent}>
                ✓ 전체 출석
              </button>
              <button className="btn-action btn-reset" onClick={resetAttendance}>
                🔄 초기화
              </button>
              {hasSeatingChart && (
                <button 
                  className="btn-action btn-view" 
                  onClick={() => setViewMode(viewMode === 'grid' ? 'seating' : 'grid')}
                >
                  {viewMode === 'grid' ? '🪑 좌석배치' : '📋 목록보기'}
                </button>
              )}
              <button className="btn-action btn-save" onClick={saveAttendance}>
                💾 저장
              </button>
            </div>

            {/* 확대/축소 컨트롤 - 좌석배치 모드에서만 표시 */}
            {viewMode === 'seating' && hasSeatingChart && (
              <div className="zoom-controls">
                <button className="zoom-btn zoom-out" onClick={handleZoomOut} title="축소">
                  🔍−
                </button>
                <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                <button className="zoom-btn zoom-in" onClick={handleZoomIn} title="확대">
                  🔍+
                </button>
                <button className="zoom-btn zoom-reset" onClick={handleResetZoom} title="초기화">
                  ⟲
                </button>
              </div>
            )}
          </div>

          {/* 학생 목록/좌석배치 */}
          <div 
            className="students-container" 
            style={{
              overflow: viewMode === 'seating' && hasSeatingChart ? 'hidden' : 'visible',
              position: 'relative',
              height: viewMode === 'seating' && hasSeatingChart ? '70vh' : 'auto'
            }}
          >
            {viewMode === 'seating' && hasSeatingChart ? (
              <div 
                ref={seatingWrapperRef}
                className="seating-wrapper"
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  transition: (touchStateRef.current?.isPinching || touchStateRef.current?.isDragging || isDragging) ? 'none' : 'transform 0.15s ease-out',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  willChange: 'transform'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
              >
                {renderSeatingChart()}
              </div>
            ) : renderGridView()}
          </div>
        </div>
      )}

      {/* 관리자 화면 */}
      {currentView === 'admin' && (
        <div className="admin-view">
          <div className="section-header">
            <h2>📊 공결 및 현황 관리</h2>
            <p>공결 등록 및 출석 현황을 확인하고 데이터를 다운로드하세요</p>
          </div>
          
          <AdminPanel 
            grades={grades}
            currentDate={currentDate}
            currentSession={currentSession}
            supervisorName={supervisorName}
            onNavigateToAttendance={(grade, roomId, roomName, date, session) => {
              setSelectedGrade(grade);
              setSelectedRoom(roomId);
              setSelectedRoomName(roomName);
              setCurrentDate(date);
              setCurrentSession(session);
              loadStudents(grade, roomName);
              setCurrentView('attendance');
            }}
          />
        </div>
      )}

      {/* 다음 장소 선택 모달 */}
      {showNextRoomModal && (
        <div className="modal-overlay" onClick={stayCurrentRoom}>
          <div className="next-room-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✓ 저장 완료!</h3>
              <p>다음 장소로 이동하시겠습니까?</p>
            </div>
            
            <div className="modal-body">
              <div className="current-room-info">
                <span className="info-label">현재 위치:</span>
                <span className="info-value">{selectedRoomName}</span>
              </div>
              
              {getRemainingRooms().length > 0 ? (
                <>
                  <div className="next-rooms-label">다음 장소 선택</div>
                  <div className="next-rooms-list">
                    {getRemainingRooms().map(room => {
                      const isCompleted = completedRooms.has(room.id);
                      return (
                        <button
                          key={room.id}
                          className={`next-room-btn ${isCompleted ? 'completed' : 'pending'}`}
                          onClick={() => goToNextRoom(room.id, room.name)}
                        >
                          <span className="next-room-icon">
                            {isCompleted ? '✅' : (room.hasSeating ? '🪑' : '📖')}
                          </span>
                          <span className="next-room-name">
                            {room.name}
                            {isCompleted && <span className="completed-badge">완료</span>}
                          </span>
                          <span className="next-room-arrow">→</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="all-done-message">
                  <div className="done-icon">🎉</div>
                  <p>모든 공간의 출석체크가 완료되었습니다!</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="modal-btn btn-stay" onClick={stayCurrentRoom}>
                현재 위치 유지
              </button>
              <button className="modal-btn btn-home" onClick={goHome}>
                홈으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
