# 실행 증거

기준 SHA `5c946e074c305907aee1091b1ab5770842a9dc0d`. 운영 배포는 하지 않았다.

| 요구사항 | 레포 | 파일/route | 변경 내용 | 실행 명령 | exit code | 브라우저/기기 | before/after | artifact URL | 상태 | blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | CUSTOMER_WEB | `/me/records` | `isGatedPath`에 기록 경로 포함 | `pnpm exec tsc --noEmit` | 0 | local typecheck | 비로그인 직접 접근이 게이트됨 | 이 브랜치 | PASS | |
| 2-4 | CUSTOMER_WEB | `state.ts` `store.ts` | `clearAccountState` + userId 저장소 | 위와 같음 | 0 | 미실행 | 기기 설정만 남김 | 이 브랜치 | PASS | A/B 실계정 E2E는 미실행 |
| 5-6 | CUSTOMER_WEB | `/me` | 리셀러 ID·발급일 추측 제거 | 위와 같음 | 0 | 미실행 | 빈 안내 | 이 브랜치 | PASS | issuedAt 필드명 런타임 미확인 |
| 7 | CUSTOMER_WEB | `/login` `/signup` | `startGoogle` URL만 이동 | 위와 같음 | 0 | 미실행 | 구글 버튼 복구 | 이 브랜치 | PASS | 콜백 route BLOCKED |
| 10 | CUSTOMER_WEB | `saveProfile` | Stage B DTO만 전송 | 위와 같음 | 0 | 미실행 | gender/birthPrefix 제거 | 이 브랜치 | PASS | |
| 11-12 | CUSTOMER_WEB | `/wallet/deposit` | 가짜 QR 제거, 주소 원문만 | 위와 같음 | 0 | 미실행 | 스캔용 격자 삭제 | 이 브랜치 | BLOCKED | QR 라이브러리 미허가 |
| 16-19 | CUSTOMER_WEB | `/me/kyc` | 서버 상태 4종, 로컬 submitted 제거 | 위와 같음 | 0 | 미실행 | 새로고침 후 서버 상태 | 이 브랜치 | PASS | enum 런타임 미확인 |
| 20-21 | CUSTOMER_WEB | `/wallet/withdraw` | 금액/주소 변경 시 step-up 폐기, 정책 실패 재시도 | 위와 같음 | 0 | 미실행 | 이전 토큰 재사용 방지 | 이 브랜치 | PASS | 실자금 sandbox 없음 |
| 22-23 | CUSTOMER_WEB | `/wallet/history` | type 우선, 0/unknown 중립 | 위와 같음 | 0 | 미실행 | 화살표/부호 추측 제거 | 이 브랜치 | PASS | |
| 24 | CUSTOMER_WEB | 입금·자본 모달 | `KRW_QUICK_AMOUNTS` 공유 | 위와 같음 | 0 | 미실행 | 10/50/100만 | 이 브랜치 | PASS | |
| 31-33 | CUSTOMER_WEB | `/me/membership` `/me/benefits` | 하드코딩 등급·bonusBank 제거 | 위와 같음 | 0 | 미실행 | 정직 빈 상태 | 이 브랜치 | PASS | benefits API 없음 |
| 36 | CUSTOMER_WEB | `MSG.aiBusy` | 바쁨 문구 단일화 | 위와 같음 | 0 | 미실행 | 지정 문장 | 이 브랜치 | PASS | |
| 39-41 | CUSTOMER_WEB | 입금 탭, dvh, safe-area | 탭 계약·셸 그리드 | 위와 같음 | 0 | 미실행 | 100dvh + inset | 이 브랜치 | PASS | 실 Safari 미확인 |
| Turnstile | CUSTOMER_WEB | 로그인/가입/찾기/재설정 | 토큰 연결·실패 시 reset | 위와 같음 | 0 | 미실행 | Guard body로 전달 | 이 브랜치 | PASS | CI 테스트 키 별도 확인 |
| Playwright 등 | CUSTOMER_WEB | scripts | 추가하지 않음 | 없음 | | | | | BLOCKED | ALLOW_NEW_DEPENDENCIES=false |
| BrowserStack | CUSTOMER_WEB | - | 실행하지 않음 | 없음 | | | | | BLOCKED | 키/플랜 없음 |
| 배포 | CUSTOMER_WEB | - | production 미배포 | 없음 | | | | | BLOCKED | ALLOW_PRODUCTION_DEPLOY=false |
