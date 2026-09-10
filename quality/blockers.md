# BLOCKED

| 항목 | 상태 | 원인 | 재개 조건 |
|---|---|---|---|
| 실 API 성별·원장 display·Google complete·KYC 한도 | BLOCKED_ENV | 백엔드 PR #222 `0fa38d77` MERGED: NO, DEPLOYED: NO. 운영 마이그레이션 미적용 | 운영 SHA + 마이그레이션 적용 후 실호출 |
| 운영 백엔드 SHA | BLOCKED_ENV | `api.hiptk.app` 프로세스 SHA 미확인 | health `gitSha` |
| Lighthouse Perf 90 | FAIL | HEAD `0caf192` run 34479208007: 로그인 0.88, 홈 0.89, 기회 0.88, 입금 ≥0.90, 나 0.89. 임계값 하향 안 함. 2MB 폰트 전면 교체·기능 숨김 안 함 | Perf 90. 게이트 완화 질문 안 함 |
| 연속 3회 회귀 | NOT_RUN | 저사양으로 전 브라우저 3회 불가. CI는 push당 1회 | 여유 기기 |
| BrowserStack | BLOCKED_ENV | 키 없음 | 프로젝트 키 |
| 실계정·실구글·실자금·실 QR 스캔 | BLOCKED_ENV | 운영 파괴 호출 금지 | 샌드박스 계정 |
| 운영 배포·PR 머지 | BLOCKED_ENV | 이번 작업 범위 밖 | Founder 승인 |
