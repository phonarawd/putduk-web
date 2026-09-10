# BLOCKED

| 항목 | 상태 | 원인 | 재개 조건 |
|---|---|---|---|
| 운영 백엔드 SHA | BLOCKED_CONTRACT | `4c6f22f` ≠ main `c4ebcd87` ≠ production deploy `3366bbe`. 런타임 SHA 미확인 | `api.hiptk.app` 프로세스 SHA 제공 |
| 신규 구글 약관 | BLOCKED_PRODUCT | callback은 `{code,state}`만 보낸다. 신규는 `TERMS_REQUIRED`인데 prove가 코드 교환 후라 재시도가 불가 | 첫 요청 전 약관 UI를 넣을지 운영자 결정 |
| 성별 저장 | BLOCKED_PRODUCT | Stage B에 gender 없음. `/me` GenderSelect는 로컬만 바꾸고 서버 성공처럼 보이지 않게 두었으나 정책 미정 | 성별을 버릴지, 별도 기기 설정으로 둘지 결정 |
| KYC MIME/크기 | BLOCKED_CONTRACT | 백엔드에 제출 MIME·크기 상한 없음. 임의 제한을 만들지 않음 | 서버 허용 목록 제공 |
| 원장 표시 규칙 | BLOCKED_CONTRACT | `journalType` 한글명·방향 화살표 규칙 없음. 복수 entry는 합산하지 않고 “상세 확인 필요” | 유저용 표시 규칙 확정 |
| Playwright/E2E | BLOCKED_TOOLING | `@playwright/test` 미설치. 새 패키지 금지 | 의존성 추가 허용 |
| axe / Lighthouse | BLOCKED_TOOLING | 패키지 없음 | 의존성 추가 허용 |
| BrowserStack | BLOCKED_ENV | 키/플랜 없음 | 프로젝트 키 제공 |
| PWA 설치·오프라인 | NOT_RUN | manifest/service worker 파일 없음. 동작 실행 안 함 | PWA 범위와 도구 허용 |
| 표준 USDT QR | BLOCKED_TOOLING | QR 라이브러리 미허가 | 의존성 허용 또는 서버 QR URL |
| 계정 A/B 실계정 격리 | BLOCKED_ENV | 실계정·운영 URI 없음 | 테스트 계정 제공 |
| 운영 배포 | BLOCKED_ENV | 배포 금지 | Founder 승인 |
| GitHub Actions | BLOCKED_PRODUCT | 워크플로를 미리 만들지 않음 | 워크플로 추가를 명시 |
