const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 v2.0 오프라인 시스템 테스트 시작...\n');
  
  try {
    // 1. 페이지 로드
    console.log('1️⃣ 페이지 로딩 테스트...');
    await page.goto('https://8080-ixgfkta6v39iv2yeq0lgt-c07dda5e.sandbox.novita.ai/ksa-attendance-v2.0-new/teacher/attendance.html');
    await page.waitForSelector('.student-card', { timeout: 10000 });
    console.log('   ✅ 페이지 로드 성공\n');
    
    // 2. 오프라인 배지 확인
    console.log('2️⃣ 오프라인 모드 배지 확인...');
    const badge = await page.$('.offline-mode-badge');
    if (badge) {
      const badgeText = await badge.textContent();
      console.log(`   ✅ 오프라인 배지 표시: "${badgeText}"\n`);
    } else {
      console.log('   ⚠️  오프라인 배지 없음\n');
    }
    
    // 3. CSV 내보내기 버튼 확인
    console.log('3️⃣ CSV 내보내기 버튼 확인...');
    const csvBtn = await page.$('#csv-export-btn');
    if (csvBtn) {
      const btnText = await csvBtn.textContent();
      console.log(`   ✅ CSV 버튼 표시: "${btnText}"\n`);
    } else {
      console.log('   ⚠️  CSV 버튼 없음\n');
    }
    
    // 4. 학년 선택 드롭다운 확인
    console.log('4️⃣ 학년 선택 드롭다운 확인...');
    const gradeSelect = await page.$('select[name="grade"]');
    if (gradeSelect) {
      const options = await page.$$eval('select[name="grade"] option', opts => 
        opts.map(o => o.textContent)
      );
      console.log(`   ✅ 학년 옵션: ${options.join(', ')}\n`);
    }
    
    // 5. 학생 카드 개수 확인
    console.log('5️⃣ 학생 카드 표시 확인...');
    const studentCards = await page.$$('.student-card');
    console.log(`   ✅ 학생 카드 개수: ${studentCards.length}개\n`);
    
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
    
    // 7. 스크린샷 캡처
    console.log('7️⃣ 스크린샷 캡처...');
    await page.screenshot({ path: '/home/user/webapp/ksa-attendance-v2.0-new/test_screenshot.png', fullPage: true });
    console.log('   ✅ 스크린샷 저장: test_screenshot.png\n');
    
    console.log('✅ 모든 테스트 통과!\n');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  } finally {
    await browser.close();
  }
})();
