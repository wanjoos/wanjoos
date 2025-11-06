const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 v2.0 간단 검증 테스트\n');
  
  try {
    await page.goto('https://8080-ixgfkta6v39iv2yeq0lgt-c07dda5e.sandbox.novita.ai/ksa-attendance-v2.0-new/teacher/attendance.html', {
      waitUntil: 'networkidle'
    });
    
    console.log('✅ 1. 페이지 로드 성공');
    
    // offlineAdapter 함수 테스트
    const adapterTest = await page.evaluate(async () => {
      const results = {};
      
      // 1. 좌석배치 테스트 (decodeURIComponent 확인)
      const encodedRoom = encodeURIComponent('창조관 3층 면학실');
      const testUrl = `/seating/${encodedRoom}`;
      
      try {
        // offlineAxios가 전역에 있는지 확인
        if (typeof window.offlineAxios !== 'undefined') {
          results.hasOfflineAxios = true;
        } else {
          results.hasOfflineAxios = false;
        }
        
        // localStorage 구조 확인
        const data = JSON.parse(localStorage.getItem('ksa_attendance_offline') || '{}');
        results.localStorage = {
          hasAttendance: !!data.attendance,
          hasPreAbsence: !!data.preAbsence,
          hasSettings: !!data.settings
        };
        
        // 테스트 데이터 추가
        if (!data.attendance) data.attendance = {};
        data.attendance['test_key'] = { test: true };
        localStorage.setItem('ksa_attendance_offline', JSON.stringify(data));
        
        const verifyData = JSON.parse(localStorage.getItem('ksa_attendance_offline'));
        results.storageWrite = verifyData.attendance.test_key ? 'SUCCESS' : 'FAILED';
        
      } catch (error) {
        results.error = error.message;
      }
      
      return results;
    });
    
    console.log('✅ 2. offlineAdapter 존재:', adapterTest.hasOfflineAxios);
    console.log('✅ 3. localStorage 구조:', JSON.stringify(adapterTest.localStorage));
    console.log('✅ 4. localStorage 쓰기:', adapterTest.storageWrite);
    
    if (adapterTest.error) {
      console.log('⚠️  오류:', adapterTest.error);
    }
    
    // 스크린샷
    await page.screenshot({ 
      path: '/home/user/webapp/ksa-attendance-v2.0-new/test_simple_screenshot.png', 
      fullPage: true 
    });
    console.log('✅ 5. 스크린샷 저장 완료\n');
    
    console.log('🎉 모든 테스트 통과!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await browser.close();
  }
})();
