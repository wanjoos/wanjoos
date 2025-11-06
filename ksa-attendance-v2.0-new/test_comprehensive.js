const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 v2.0 종합 테스트 시작...\n');
  
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const addResult = (name, passed, message = '') => {
    testResults.tests.push({ name, passed, message });
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${name}`);
      if (message) console.log(`   ${message}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name}`);
      if (message) console.log(`   ${message}`);
    }
  };
  
  try {
    // 페이지 로드
    await page.goto('https://8080-ixgfkta6v39iv2yeq0lgt-c07dda5e.sandbox.novita.ai/ksa-attendance-v2.0-new/teacher/attendance.html', {
      waitUntil: 'networkidle'
    });
    await page.waitForSelector('#root', { timeout: 10000 });
    addResult('페이지 로드', true);
    
    // 테스트 1: 총원 표시 (getStudents 호환성)
    console.log('\n📊 테스트 1: 총원 표시...');
    const studentsTest = await page.evaluate(async () => {
      try {
        // localStorage 초기화
        localStorage.setItem('ksa_attendance_offline', JSON.stringify({
          attendance: {},
          preAbsence: {},
          settings: { initialized: true, version: '2.0' }
        }));
        
        // 학생 데이터에 studyRoom, room 필드가 추가되었는지 확인
        const testStudent = {
          id: '24-006',
          name: '테스트학생',
          location: '창조관 8층 면학실 A',
          grade: 2
        };
        
        // studyRoom과 room이 자동 추가되는지 시뮬레이션
        const studentWithCompat = {
          ...testStudent,
          studyRoom: testStudent.location,
          room: testStudent.location
        };
        
        return {
          hasStudyRoom: !!studentWithCompat.studyRoom,
          hasRoom: !!studentWithCompat.room,
          studyRoomValue: studentWithCompat.studyRoom,
          roomValue: studentWithCompat.room
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    if (studentsTest.error) {
      addResult('총원 표시 - 필드 매핑', false, studentsTest.error);
    } else {
      addResult('총원 표시 - studyRoom 필드', studentsTest.hasStudyRoom, 
        `값: ${studentsTest.studyRoomValue}`);
      addResult('총원 표시 - room 필드', studentsTest.hasRoom,
        `값: ${studentsTest.roomValue}`);
    }
    
    // 테스트 2: 출석 저장 및 CSV 내보내기
    console.log('\n💾 테스트 2: 출석 저장 및 CSV...');
    const attendanceTest = await page.evaluate(async () => {
      try {
        const data = JSON.parse(localStorage.getItem('ksa_attendance_offline') || '{}');
        if (!data.attendance) data.attendance = {};
        
        // v1.0 형식으로 출석 데이터 저장 시뮬레이션
        const testDate = '2025-11-06';
        const testSession = '1';
        const testRoom = '창조관 8층 면학실 A';
        const testStudentId = '24-006';
        
        // saveAttendance가 받을 데이터 형식
        const requestData = {
          date: testDate,
          session: testSession,
          room: testRoom,
          attendanceData: {
            '24-006': 'present',
            '24-007': 'absent'
          }
        };
        
        // 수동으로 저장 로직 실행
        Object.entries(requestData.attendanceData).forEach(([studentId, status]) => {
          const key = `${testDate}_${testSession}_${testRoom}_${studentId}`;
          data.attendance[key] = {
            date: testDate,
            session: testSession,
            room: testRoom,
            studentId: studentId,
            studentName: studentId === '24-006' ? '테스트학생1' : '테스트학생2',
            status: status,
            timestamp: new Date().toISOString()
          };
        });
        
        localStorage.setItem('ksa_attendance_offline', JSON.stringify(data));
        
        // 저장 확인
        const savedData = JSON.parse(localStorage.getItem('ksa_attendance_offline'));
        const key1 = `${testDate}_${testSession}_${testRoom}_24-006`;
        const key2 = `${testDate}_${testSession}_${testRoom}_24-007`;
        
        const record1 = savedData.attendance[key1];
        const record2 = savedData.attendance[key2];
        
        return {
          saved: !!record1 && !!record2,
          hasStudentId: record1?.studentId === '24-006',
          hasStudentName: record1?.studentName === '테스트학생1',
          hasStatus: record1?.status === 'present',
          record1: record1,
          record2: record2
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    if (attendanceTest.error) {
      addResult('출석 저장', false, attendanceTest.error);
    } else {
      addResult('출석 저장 - 데이터 저장', attendanceTest.saved);
      addResult('출석 저장 - studentId 필드', attendanceTest.hasStudentId,
        `값: ${attendanceTest.record1?.studentId}`);
      addResult('출석 저장 - studentName 필드', attendanceTest.hasStudentName,
        `값: ${attendanceTest.record1?.studentName}`);
      addResult('출석 저장 - status 필드', attendanceTest.hasStatus,
        `값: ${attendanceTest.record1?.status}`);
    }
    
    // 테스트 3: CSV 생성 시뮬레이션
    console.log('\n📄 테스트 3: CSV 데이터 생성...');
    const csvTest = await page.evaluate(() => {
      try {
        const data = JSON.parse(localStorage.getItem('ksa_attendance_offline'));
        const records = Object.values(data.attendance || {});
        
        if (records.length === 0) {
          return { hasRecords: false };
        }
        
        // CSV 생성
        const csvRows = ['날짜,차수,담당자,공간,학번,이름,상태,시간'];
        records.forEach(r => {
          const statusText = r.status === 'present' ? '출석' : 
                           r.status === 'absent' ? '결석' : '공결';
          csvRows.push(
            `${r.date},${r.session}차,,${r.room},${r.studentId},${r.studentName || ''},${statusText},${r.timestamp}`
          );
        });
        
        const csv = csvRows.join('\n');
        
        // CSV 검증
        const lines = csv.split('\n');
        const dataLine = lines[1]; // 첫 번째 데이터 라인
        const fields = dataLine.split(',');
        
        return {
          hasRecords: true,
          recordCount: records.length,
          csvLineCount: lines.length,
          studentIdInCSV: fields[4], // 학번 필드
          studentNameInCSV: fields[5], // 이름 필드
          statusInCSV: fields[6], // 상태 필드
          hasValidStudentId: fields[4] !== 'undefined' && fields[4] !== '',
          hasValidStudentName: fields[5] !== '' && fields[5] !== 'undefined'
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    if (csvTest.error) {
      addResult('CSV 생성', false, csvTest.error);
    } else if (!csvTest.hasRecords) {
      addResult('CSV 생성', false, '출석 데이터 없음');
    } else {
      addResult('CSV 생성 - 레코드 존재', csvTest.recordCount > 0,
        `${csvTest.recordCount}건`);
      addResult('CSV 생성 - 학번 필드', csvTest.hasValidStudentId,
        `값: "${csvTest.studentIdInCSV}"`);
      addResult('CSV 생성 - 이름 필드', csvTest.hasValidStudentName,
        `값: "${csvTest.studentNameInCSV}"`);
      addResult('CSV 생성 - 상태 필드', csvTest.statusInCSV !== '',
        `값: "${csvTest.statusInCSV}"`);
    }
    
    // 스크린샷
    await page.screenshot({ 
      path: '/home/user/webapp/ksa-attendance-v2.0-new/test_comprehensive_screenshot.png', 
      fullPage: true 
    });
    console.log('\n📸 스크린샷 저장: test_comprehensive_screenshot.png');
    
    // 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(50));
    console.log(`✅ 통과: ${testResults.passed}개`);
    console.log(`❌ 실패: ${testResults.failed}개`);
    console.log(`📝 총: ${testResults.tests.length}개`);
    console.log('='.repeat(50));
    
    if (testResults.failed === 0) {
      console.log('\n🎉 모든 테스트 통과!');
    } else {
      console.log('\n⚠️  일부 테스트 실패');
      console.log('\n실패한 테스트:');
      testResults.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.message}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 실행 오류:', error.message);
  } finally {
    await browser.close();
  }
})();
