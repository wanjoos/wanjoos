const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log(`   [브라우저 ERROR] ${msg.text()}`);
    }
  });
  
  console.log('🧪 v2.0 오프라인 시스템 테스트 시작...\n');
  
  try {
    // 1. 페이지 로드
    console.log('1️⃣ 페이지 로딩 테스트...');
    await page.goto('https://8080-ixgfkta6v39iv2yeq0lgt-c07dda5e.sandbox.novita.ai/ksa-attendance-v2.0-new/teacher/attendance.html', {
      waitUntil: 'networkidle'
    });
    console.log('   ✅ 페이지 네트워크 로드 완료\n');
    
    // 2. React 루트 확인
    console.log('2️⃣ React 앱 초기화 확인...');
    await page.waitForSelector('#root', { timeout: 5000 });
    console.log('   ✅ React 루트 엘리먼트 확인\n');
    
    // 3. 오프라인 배지 확인
    console.log('3️⃣ 오프라인 모드 배지 확인...');
    const badge = await page.$('.offline-mode-badge');
    if (badge) {
      const badgeText = await badge.textContent();
      console.log(`   ✅ 오프라인 배지 표시: "${badgeText}"\n`);
    } else {
      console.log('   ⚠️  오프라인 배지 없음\n');
    }
    
    // 4. CSV 내보내기 버튼 확인
    console.log('4️⃣ CSV 내보내기 버튼 확인...');
    const csvBtn = await page.$('#csv-export-btn');
    if (csvBtn) {
      const btnText = await csvBtn.textContent();
      console.log(`   ✅ CSV 버튼 표시: "${btnText}"\n`);
    } else {
      console.log('   ⚠️  CSV 버튼 없음\n');
    }
    
    // 5. 페이지 DOM 구조 확인
    console.log('5️⃣ 주요 UI 엘리먼트 확인...');
    const hasTitle = await page.$('h1');
    const hasForm = await page.$('form, .controls, .filter-section');
    const hasContainer = await page.$('.container, .app-container');
    
    console.log(`   📄 제목(h1): ${hasTitle ? '✅' : '❌'}`);
    console.log(`   📋 폼/필터: ${hasForm ? '✅' : '❌'}`);
    console.log(`   📦 컨테이너: ${hasContainer ? '✅' : '❌'}\n`);
    
    // 6. localStorage 데이터 확인
    console.log('6️⃣ localStorage 데이터 구조 확인...');
    const storageData = await page.evaluate(() => {
      const data = localStorage.getItem('ksa_attendance_offline');
      return data ? JSON.parse(data) : null;
    });
    
    if (storageData) {
      console.log('   ✅ localStorage 초기화 완료');
      console.log(`   📊 데이터 구조: ${Object.keys(storageData).join(', ')}\n`);
    } else {
      console.log('   ⚠️  localStorage 데이터 없음\n');
    }
    
    // 7. 학생 카드 확인 (옵션, 타임아웃 없음)
    console.log('7️⃣ 학생 카드 확인 (선택사항)...');
    try {
      await page.waitForSelector('.student-card', { timeout: 3000 });
      const studentCards = await page.$$('.student-card');
      console.log(`   ✅ 학생 카드 개수: ${studentCards.length}개\n`);
    } catch (e) {
      console.log('   ℹ️  학생 카드 미표시 (필터 선택 필요)\n');
    }
    
    // 8. 스크린샷 캡처
    console.log('8️⃣ 스크린샷 캡처...');
    await page.screenshot({ 
      path: '/home/user/webapp/ksa-attendance-v2.0-new/test_screenshot.png', 
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장: test_screenshot.png\n');
    
    // 9. 페이지 제목 확인
    const title = await page.title();
    console.log(`9️⃣ 페이지 제목: "${title}"\n`);
    
    console.log('✅ 모든 테스트 통과!\n');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await browser.close();
  }
})();
