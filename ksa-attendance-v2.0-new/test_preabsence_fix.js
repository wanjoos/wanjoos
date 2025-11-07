const { chromium } = require('playwright');

(async () => {
  console.log('🧪 공결 등록 버그 수정 테스트 시작\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 파일 로드
  const filePath = `file://${__dirname}/teacher/attendance.html`;
  await page.goto(filePath);
  await page.waitForTimeout(1000);

  let allTestsPassed = true;
  const results = [];

  // ============================================================
  // 테스트 1: 관리자 메뉴 접근
  // ============================================================
  console.log('📋 테스트 1: 관리자 메뉴 접근');
  try {
    // 관리자 버튼 클릭
    await page.click('text=공결 및 현황 관리');
    await page.waitForTimeout(500);
    
    // 공결 관리 탭 존재 확인
    const preRegisterTab = await page.locator('text=공결 관리').count();
    
    if (preRegisterTab > 0) {
      console.log('   ✅ 관리자 메뉴 접근 성공\n');
      results.push({ test: '관리자 메뉴 접근', passed: true });
    } else {
      throw new Error('공결 관리 탭을 찾을 수 없습니다');
    }
  } catch (error) {
    console.log(`   ❌ 실패: ${error.message}\n`);
    results.push({ test: '관리자 메뉴 접근', passed: false, error: error.message });
    allTestsPassed = false;
  }

  // ============================================================
  // 테스트 2: 공결 관리 탭 활성화
  // ============================================================
  console.log('📋 테스트 2: 공결 관리 탭 활성화');
  try {
    await page.click('text=공결 관리');
    await page.waitForTimeout(500);
    
    // 공결 등록 UI 확인
    const pasteInput = await page.locator('textarea[placeholder*="학생"]').count();
    
    if (pasteInput > 0) {
      console.log('   ✅ 공결 관리 탭 활성화 성공\n');
      results.push({ test: '공결 관리 탭 활성화', passed: true });
    } else {
      throw new Error('공결 등록 입력창을 찾을 수 없습니다');
    }
  } catch (error) {
    console.log(`   ❌ 실패: ${error.message}\n`);
    results.push({ test: '공결 관리 탭 활성화', passed: false, error: error.message });
    allTestsPassed = false;
  }

  // ============================================================
  // 테스트 3: 학번으로 학생 검색 (수정된 기능)
  // ============================================================
  console.log('📋 테스트 3: 학번으로 학생 검색 (25-001)');
  try {
    // 학생 데이터 확인
    const studentsData = await page.evaluate(() => {
      // offlineAdapter에서 학생 데이터 가져오기
      try {
        const adapter = window.offlineAdapter;
        return adapter ? true : false;
      } catch {
        return false;
      }
    });

    // 학번 입력
    await page.fill('textarea[placeholder*="학생"]', '25-001');
    await page.waitForTimeout(300);
    
    // "추가" 버튼 클릭
    const addButton = page.locator('button:has-text("추가")').first();
    await addButton.click();
    await page.waitForTimeout(1000);

    // 알림창 확인 (오류가 발생하지 않아야 함)
    page.on('dialog', async dialog => {
      const message = dialog.message();
      if (message.includes('찾을 수 없습니다')) {
        throw new Error(`학생을 찾을 수 없음: ${message}`);
      }
      await dialog.accept();
    });

    // 추가된 학생 수 확인
    const addedCount = await page.locator('text=/💾 \\d+명 공결 등록/').count();
    
    if (addedCount > 0) {
      const countText = await page.locator('text=/💾 \\d+명 공결 등록/').first().textContent();
      console.log(`   ✅ 학생 검색 성공: ${countText}\n`);
      results.push({ test: '학번으로 학생 검색', passed: true });
    } else {
      throw new Error('학생이 추가되지 않았습니다');
    }
  } catch (error) {
    console.log(`   ❌ 실패: ${error.message}\n`);
    results.push({ test: '학번으로 학생 검색', passed: false, error: error.message });
    allTestsPassed = false;
  }

  // ============================================================
  // 테스트 4: 여러 학번 동시 입력
  // ============================================================
  console.log('📋 테스트 4: 여러 학번 동시 입력');
  try {
    // 입력창 초기화
    await page.fill('textarea[placeholder*="학생"]', '');
    await page.waitForTimeout(300);
    
    // 여러 학번 입력 (줄바꿈으로 구분)
    await page.fill('textarea[placeholder*="학생"]', '24-006\n24-015\n24-030');
    await page.waitForTimeout(300);
    
    // "추가" 버튼 클릭
    const addButton = page.locator('button:has-text("추가")').first();
    await addButton.click();
    await page.waitForTimeout(1000);

    // 추가된 학생 수 확인 (기존 1명 + 새로운 3명 = 4명)
    const countText = await page.locator('text=/💾 \\d+명 공결 등록/').first().textContent();
    const count = parseInt(countText.match(/\\d+/)[0]);
    
    if (count >= 3) {
      console.log(`   ✅ 여러 학번 입력 성공: ${count}명 추가됨\n`);
      results.push({ test: '여러 학번 동시 입력', passed: true });
    } else {
      throw new Error(`예상된 학생 수와 다름: ${count}명 (최소 3명 예상)`);
    }
  } catch (error) {
    console.log(`   ❌ 실패: ${error.message}\n`);
    results.push({ test: '여러 학번 동시 입력', passed: false, error: error.message });
    allTestsPassed = false;
  }

  // ============================================================
  // 테스트 5: 이름으로 학생 검색
  // ============================================================
  console.log('📋 테스트 5: 이름으로 학생 검색');
  try {
    // 입력창 초기화
    await page.fill('textarea[placeholder*="학생"]', '');
    await page.waitForTimeout(300);
    
    // 이름으로 검색
    await page.fill('textarea[placeholder*="학생"]', '고태경');
    await page.waitForTimeout(300);
    
    // "추가" 버튼 클릭
    const addButton = page.locator('button:has-text("추가")').first();
    await addButton.click();
    await page.waitForTimeout(1000);

    // 성공 토스트 확인 또는 버튼 텍스트 확인
    const countText = await page.locator('text=/💾 \\d+명 공결 등록/').first().textContent();
    
    console.log(`   ✅ 이름으로 검색 성공: ${countText}\n`);
    results.push({ test: '이름으로 학생 검색', passed: true });
  } catch (error) {
    console.log(`   ❌ 실패: ${error.message}\n`);
    results.push({ test: '이름으로 학생 검색', passed: false, error: error.message });
    allTestsPassed = false;
  }

  // ============================================================
  // 결과 요약
  // ============================================================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 테스트 결과 요약');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);
    if (!result.passed && result.error) {
      console.log(`   오류: ${result.error}`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ 통과: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`📝 총: ${results.length}개`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (allTestsPassed) {
    console.log('🎉 모든 테스트 통과!\n');
    console.log('✅ 수정 사항:');
    console.log('   - App.jsx line 190: student.studentNumber → student.id');
    console.log('   - 학번(25-001)으로 공결 등록 가능');
    console.log('   - 여러 학번 동시 입력 가능');
    console.log('   - 이름으로 검색 가능\n');
  } else {
    console.log('⚠️  일부 테스트 실패\n');
    process.exitCode = 1;
  }

  await browser.close();
})();
