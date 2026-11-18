# 신영회계법인 홈페이지 (syfas.com)

정적 HTML 사이트입니다. GitHub Pages로 무료 호스팅합니다.

- `index.html` 메인 페이지 (회사소개, 서비스, 구성원, 오시는 길, 상담 문의)
- `art.html` 미술품 투자지원센터 첫 화면 + (1) 미술품 과세 (서비스, 과세 핵심 정리, 전문가 그룹, 미술품 소식)
- `art-exhibitions.html` (2) 주요 미술관 전시 정보, 매월 첫째 주 갱신 (`data/exhibitions.json`)
- `art-market.html` (3) 경매 낙찰 · 거래 정보, 매월 첫째 주 갱신 (`data/auctions.json`)
- `art-reports.html` (4) 작가 이야기 목록 (`REPORTS` 표시 사이에 카드 추가), 각 이야기는 `art-story-N.html`
- `news.html`, `support.html` 세무뉴스 · 정부지원금 전체 목록
- `data/*.json` + `scripts/build_news.py` 소식 데이터와 페이지 갱신 스크립트
- `thanks.html` 문의 접수 완료 페이지
- ♥ 좋아요: `assets/main.js`가 `art-story-N.html`, `inherit-newsletter-N.html` 글에 자동으로 버튼을 붙입니다. 숫자는 Supabase에 저장(`supabase/likes.sql`), 접속 주소와 공개 키는 `main.js`의 `LIKES`에 넣습니다.
- `assets/` 스타일, 스크립트, 아이콘, 공유 이미지
- `robots.txt`, `sitemap.xml` 검색포털 등록용

상담 문의 폼은 FormSubmit(formsubmit.co)을 통해 이메일로 전달됩니다.
