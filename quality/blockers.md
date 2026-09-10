# BLOCKED

| 항목 | 상태 | 원인 | 재개 조건 |
|---|---|---|---|
| 운영 백엔드 SHA | BLOCKED_CONTRACT | 로컬 `4c6f22f` ≠ 런타임 미확인 | `api.hiptk.app` 프로세스 SHA |
| 신규 구글 약관 재호출 | BLOCKED_PRODUCT | 코드 재사용을 제품에 넣지 않음. TERMS_REQUIRED는 안내만 | 첫 요청 전 약관 UI를 둘지 운영자 결정 |
| 성별 서버 저장 | BLOCKED_CONTRACT | Stage B·FORBIDDEN에 gender 없음 | 서버 필드·PATCH 계약 |
| 원장 한글/화살표 | BLOCKED_CONTRACT | `journalType` 표시 맵 없음 | 유저용 표시 규칙 |
| KYC MIME/크기 | BLOCKED_CONTRACT | 서버 상한 없음. 프론트 임의 제한 안 함 | 서버 허용 목록 |
| Lighthouse Perf 90 | FAIL | CI: 로그인 0.86, 홈 0.90, 기회 0.89, 입금 0.87, 나 0.88. A11y/SEO 1.00, CLS<0.1. 로그인 콘솔 오류 있음. 임계값 하향 안 함 | 2MB 한글 폰트·클라이언트 셸 축소. Founder 성능 허용 여부 |
| 연속 3회 회귀 | NOT_RUN | 저사양으로 전 브라우저 3회 불가. CI는 push당 1회 | 여유 기기 |
| BrowserStack | BLOCKED_ENV | 키 없음 | 프로젝트 키 |
| 실계정·실구글·실자금·실 QR 스캔 | BLOCKED_ENV | 운영 파괴 호출 금지 | 샌드박스 계정 |
| 운영 배포·PR 머지 | BLOCKED_ENV | 이번 작업 범위 밖 | Founder 승인 |
| GitHub Actions quality | FAIL | Lighthouse Perf 미달. typecheck/lint/unit/build/E2E는 PASS | Perf 90 또는 Founder가 별도 게이트 |
