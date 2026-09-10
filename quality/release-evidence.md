# 실행 증거

작업 전 HEAD `7766cbd4244d4642d03f6d0fb0dfc9b447ce798c`. 기준 main `5c946e074c305907aee1091b1ab5770842a9dc0d`. 운영 배포는 하지 않았다.

상태값은 PASS / FAIL / NOT_RUN / BLOCKED_CONTRACT / BLOCKED_ENV / BLOCKED_PRODUCT / BLOCKED_TOOLING만 쓴다. 실행하지 않은 브라우저·E2E는 PASS로 쓰지 않는다.

| 요구사항 | 레포 | 파일/route | 변경 내용 | 실행 명령 | exit code | 브라우저/viewport | 결과 파일 | 상태 | blocker |
|---|---|---|---|---|---|---|---|---|---|
| typecheck | CUSTOMER_WEB | 변경 파일 | 계약 리더·화면 연결 | `pnpm exec tsc --noEmit` | 0 | 없음 | 터미널 출력 | PASS | |
| lint | CUSTOMER_WEB | 변경 ts/tsx | 변경 파일 eslint | `pnpm exec eslint <changed>` | 0 | 없음 | 터미널 출력 | PASS | img warning만 |
| unit | CUSTOMER_WEB | `src/lib/contract-readers.test.ts` | authorizeUrl, onboarding, journal, KYC, membership, benefits, KRW, withdraw intent | `pnpm test` | 0 | 없음 | 8 passed | PASS | |
| build | CUSTOMER_WEB | app routes | `pnpm build` | `pnpm build` | 0 | 없음 | Next route 표 | PASS | |
| 1A Google start | CUSTOMER_WEB | `googleAuthorizeUrl` | `authorizeUrl`만, http(s) 파싱 | `pnpm test` | 0 | 없음 | contract-readers.test.ts | PASS | 실구글 이동 NOT_RUN |
| 1B Google callback | CUSTOMER_WEB | `/auth/oauth/google/callback` | code/state 없으면 API 안 함. body `{code,state}`. 중복 호출 가드 | `pnpm build` | 0 | 없음 | 라우트 생성 확인 | NOT_RUN | Playwright 없음. 브라우저 콜백 미실행 |
| 1C complete-profile | CUSTOMER_WEB | `/auth/complete-profile` | displayName, birthDate, phoneE164, email. gender 미전송 | `pnpm exec tsc --noEmit` | 0 | 없음 | | NOT_RUN | 실계정 없음 |
| 2 email-resend | CUSTOMER_WEB | `/auth/verify-email` | Turnstile action `email-resend`, 토큰 없이 호출 안 함, 실패 시 reset | `pnpm exec eslint` | 0 | 없음 | | NOT_RUN | 위젯 브라우저 미실행 |
| 3 ledger | CUSTOMER_WEB | `/wallet/history` | items[].journalType + entries. 복수 entry는 상세 확인 필요. Number 합산 없음 | `pnpm test` | 0 | 없음 | contract-readers.test.ts | PASS | 표시 한글/화살표 규칙은 BLOCKED_CONTRACT |
| 4 KYC | CUSTOMER_WEB | `/me/kyc` | loading/error/none/pending/verified/rejected. 실패를 none으로 바꾸지 않음 | `pnpm test` | 0 | 없음 | 상태 매핑 단위 테스트 | NOT_RUN | 화면 E2E 없음. MIME 상한 BLOCKED_CONTRACT |
| 5 withdraw | CUSTOMER_WEB | `/wallet/withdraw` | 금액·주소 변경 시 token/challenge 폐기. timeout 재시도는 같은 key | `pnpm test` | 0 | 없음 | intent 단위 테스트 | NOT_RUN | 실자금 sandbox 없음 |
| 6A membership | CUSTOMER_WEB | `/me/membership` | `labelKo`, `dailyUserMatchCap`, `dailyMatchesUsed`만 표시 | `pnpm test` | 0 | 없음 | | NOT_RUN | 로그인 화면 미실행 |
| 6B benefits | CUSTOMER_WEB | `/me/benefits` | `GET /me/benefits`의 titleKo/bodyKo. API 없음이 아님 | `pnpm test` | 0 | 없음 | | NOT_RUN | 로그인 화면 미실행 |
| 7 records gate | CUSTOMER_WEB | `isGatedPath` | `/me/records`는 코드상 gated | 코드 확인 | | 없음 | constants.ts | NOT_RUN | 브라우저 미실행 |
| 7 A/B 격리 | CUSTOMER_WEB | state/store | 기존 userId 저장소 유지. E2E 없음 | 없음 | | | | BLOCKED_ENV | 실계정 없음 |
| 7 header fallback | CUSTOMER_WEB | SiteHeader | `resellerId \|\| displayName` 제거 | 코드 확인 | | 없음 | | NOT_RUN | 브라우저 미실행 |
| 8 KRW guide | CUSTOMER_WEB | `/wallet/deposit` | loading/success/empty/error + 재시도. 전용 계좌 확정 문구 제거 | `pnpm exec tsc --noEmit` | 0 | 없음 | | NOT_RUN | 브라우저 미실행 |
| 8 deposit tabs | CUSTOMER_WEB | `/wallet/deposit` | tablist/tab/tabpanel, aria-*, roving tabIndex, Home/End | 코드 확인 | | 없음 | | NOT_RUN | 키보드 E2E 없음 |
| 8 viewport overflow | CUSTOMER_WEB | 셸 CSS | 100dvh/safe-area 유지. 전 viewport 실측 없음 | 없음 | | | | NOT_RUN | Playwright 없음 |
| Playwright E2E 1-13 | CUSTOMER_WEB | scripts | 작성·실행하지 않음 | 없음 | | | | BLOCKED_TOOLING | `@playwright/test` 미설치 |
| axe/Lighthouse | CUSTOMER_WEB | - | 설치하지 않음 | 없음 | | | | BLOCKED_TOOLING | 새 패키지 금지 |
| visual screenshots | CUSTOMER_WEB | - | 기준 이미지 없음. PASS 안 함 | 없음 | | | | BLOCKED_TOOLING | Playwright 없음 |
| PWA 동작 | CUSTOMER_WEB | layout, `_headers` | 읽기 전용: manifest/SW 없음. 정적 캐시만 assets | 코드 확인 | | 없음 | public/_headers | NOT_RUN | 설치·오프라인 미실행 |
| BrowserStack | CUSTOMER_WEB | - | 실행하지 않음 | 없음 | | | | BLOCKED_ENV | 키/플랜 없음 |
| 배포 | CUSTOMER_WEB | - | production 미배포 | 없음 | | | | BLOCKED_ENV | ALLOW_PRODUCTION_DEPLOY=false |

## PWA 읽기 전용

- manifest / service worker / `start_url` / `display`: 파일 없음
- `layout.tsx` icons = `/putduk-mark.svg`, `themeColor` = `#ffffff`, `viewportFit` = `cover`
- `public/_headers`는 `/_next/static`, `/assets`, `/cards`, `/fonts`만 캐시. HTML·API 응답 캐시 규칙 없음
- 금융/개인정보 SW 캐시는 SW가 없어 해당 없음

## 필요 패키지 (설치하지 않음)

| 패키지 | 이유 | lockfile 영향 | 패키지 없이 대안 |
|---|---|---|---|
| `@playwright/test` + 브라우저 | E2E 1-13, 스크린샷, 가로 넘침 | 큼 (브라우저 바이너리) | 계약 단위 테스트만 실행 |
| `@axe-core/playwright` | 입금 탭 axe | 중간 | 코드 리뷰만 |
| `@lhci/cli` 또는 lighthouse | 성능 | 중간 | 미실행 |
| QR 라이브러리 | USDT QR | 소·중 | 주소 원문 유지 |
