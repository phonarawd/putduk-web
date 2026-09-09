# BLOCKED

| 항목 | 원인 | 재개 조건 |
|---|---|---|
| API contract lock | `API_CONTRACT_SHA` 없음 | 백엔드가 승인한 OpenAPI SHA 제공 |
| Playwright/axe/Lighthouse/PWA 도구 | `ALLOW_NEW_DEPENDENCIES=false` | 의존성 추가를 명시적으로 허용 |
| 표준 USDT QR | QR 라이브러리 미허가 | `ALLOW_NEW_DEPENDENCIES=true` 또는 서버 QR 이미지 URL 계약 |
| Google 콜백 화면 | 등록된 callback path 미확인 | 백엔드 OAuth redirect URI 확인 |
| 퍼뜩AI 서버 대화 복원 | 이 PR 의도 밖, 목록 UI 미연결 | 기존 chips/conversations API를 다음 UI PR에서 연결 |
| BrowserStack | 키/플랜 없음 | 프로젝트 키 제공 |
| 운영 배포 | `ALLOW_PRODUCTION_DEPLOY=false` | Founder 승격 권한 |
| GitHub Actions | 레포 규율상 미리 워크플로를 만들지 않음 | 워크플로 추가를 명시 |
