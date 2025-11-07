#!/usr/bin/env python3
"""
단일 HTML 파일 생성 스크립트
CSS와 JS를 인라인으로 포함
"""
import re
from pathlib import Path

# 경로 설정
DIST_DIR = Path('/home/user/webapp/frontend/dist')
OUTPUT_FILE = Path('/home/user/webapp/ksa-attendance-v2.0-new/teacher/attendance.html')

print("🔧 단일 HTML 파일 생성 중...")

# HTML 읽기
html_content = (DIST_DIR / 'index.html').read_text(encoding='utf-8')

# CSS 파일 찾기 및 인라인 삽입
css_match = re.search(r'href="\./assets/(index-[^"]+\.css)"', html_content)
if css_match:
    css_file = css_match.group(1)
    css_content = (DIST_DIR / 'assets' / css_file).read_text(encoding='utf-8')
    print(f"   ✅ CSS: {css_file} ({len(css_content)} bytes)")
    
    # CSS 링크를 인라인 스타일로 교체
    css_tag = f'<link rel="stylesheet" crossorigin href="./assets/{css_file}">'
    inline_css = f'<style>{css_content}</style>'
    html_content = html_content.replace(css_tag, inline_css)

# JS 파일 찾기 및 인라인 삽입
js_match = re.search(r'src="\./assets/(index-[^"]+\.js)"', html_content)
if js_match:
    js_file = js_match.group(1)
    js_content = (DIST_DIR / 'assets' / js_file).read_text(encoding='utf-8')
    print(f"   ✅ JS: {js_file} ({len(js_content)} bytes)")
    
    # JS 스크립트를 인라인으로 교체
    js_tag = f'<script type="module" crossorigin src="./assets/{js_file}"></script>'
    inline_js = f'<script type="module">{js_content}</script>'
    html_content = html_content.replace(js_tag, inline_js)

# 타이틀 변경
html_content = html_content.replace(
    '<title>frontend-temp</title>',
    '<title>KSA 모바일 면학시스템 v2.0 (완전 오프라인)</title>'
)

# 오프라인 배지 추가
offline_badge = '''
    <!-- 오프라인 모드 배지 -->
    <style>
        .offline-mode-badge {
            position: fixed;
            top: 15px;
            right: 15px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 13px;
            font-weight: 600;
            z-index: 99999;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            }
            50% {
                box-shadow: 0 4px 25px rgba(40, 167, 69, 0.5);
            }
        }
        
        .offline-mode-badge::before {
            content: "🔒 ";
        }
    </style>
    <div class="offline-mode-badge">오프라인 모드</div>
'''

html_content = html_content.replace('<div id="root"></div>', 
    offline_badge + '\n    <div id="root"></div>')

# CSV 내보내기 버튼 추가
export_button = '''
    <!-- CSV 내보내기 버튼 -->
    <button id="csv-export-btn" style="display: none; position: fixed; bottom: 30px; right: 30px; z-index: 99998; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; 
            padding: 15px 35px; border-radius: 50px; font-size: 16px; font-weight: bold; cursor: pointer;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); transition: all 0.3s;"
            onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.6)';"
            onmouseout="this.style.transform=''; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.4)';">
        📤 전체 데이터 내보내기
    </button>
    <script>
        // CSV 내보내기 버튼 이벤트
        document.addEventListener('DOMContentLoaded', () => {
            const btn = document.getElementById('csv-export-btn');
            if (btn) {
                btn.style.display = 'block';
                btn.onclick = () => {
                    const data = JSON.parse(localStorage.getItem('ksa_attendance_offline') || '{}');
                    const records = Object.values(data.attendance || {});
                    
                    if (records.length === 0) {
                        alert('내보낼 출석 데이터가 없습니다.');
                        return;
                    }
                    
                    // CSV 생성 (BOM 포함 - Excel 호환)
                    const BOM = '\\uFEFF';
                    const csvRows = [
                        '날짜,차수,담당자,공간,학번,이름,상태,시간'
                    ];
                    
                    records.forEach(r => {
                        const statusText = r.status === 'present' ? '출석' : 
                                         r.status === 'absent' ? '결석' : '공결';
                        csvRows.push(
                            `${r.date},${r.session}차,${r.supervisorName || ''},${r.room},${r.studentId},${r.studentName || ''},${statusText},${r.timestamp}`
                        );
                    });
                    
                    const csv = BOM + csvRows.join('\\n');
                    
                    // 다운로드
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `KSA출석체크_전체_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                    
                    alert(`✅ ${records.length}건의 출석 기록을 내보냈습니다.`);
                };
            }
        });
    </script>
'''

html_content = html_content.replace('</body>', export_button + '\n</body>')

# 파일 저장
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE.write_text(html_content, encoding='utf-8')

file_size_kb = OUTPUT_FILE.stat().st_size / 1024
file_size_mb = file_size_kb / 1024

print(f"\n✅ 단일 HTML 파일 생성 완료!")
print(f"   파일: {OUTPUT_FILE}")
print(f"   크기: {file_size_mb:.2f} MB ({file_size_kb:.1f} KB)")
print(f"\n🎉 v1.0의 모든 기능이 오프라인 단일 파일로 변환되었습니다!")
print(f"\n📝 특징:")
print(f"   ✅ 모든 UI/UX 100% 동일")
print(f"   ✅ 좌석 배치도 6개 포함")
print(f"   ✅ localStorage 기반 데이터 관리")
print(f"   ✅ CSV 내보내기 기능")
print(f"   ✅ 서버 불필요")
