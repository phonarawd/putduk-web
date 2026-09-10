# P0 자동 QA 기준선 (읽기 전용)

기록 시각: 2026-09-10 로컬. 코드를 고치기 전에 확인한 사실만 적는다.

## Git

| 항목 | 값 |
|---|---|
| remote | `https://github.com/phonarawd/putduk-web.git` (`origin`) |
| 브랜치 | `ui/p0-account-truth` → `origin/ui/p0-account-truth` |
| 작업 전 HEAD | `f9a66517a04d27c7b8a229ae1954453d465cbaf1` |
| 기준 main | `5c946e074c305907aee1091b1ab5770842a9dc0d` |
| PR #1 head | `f9a66517a04d27c7b8a229ae1954453d465cbaf1` (로컬과 일치) |
| PR | https://github.com/phonarawd/putduk-web/pull/1 OPEN |
| working tree | dirty: `.cursorignore`, `src/components/gpt/SiteFooter.tsx` (사용자 변경, 보존) |
| 새 PR/머지/배포 | 하지 않음 |

Git 경계는 고객 웹만. 백엔드 경로 `C:\Users\PC\Desktop\AI_PROFIT_OS` 와 겹치지 않는다.

## 도구

- package manager: `pnpm@11.4.0`
- Node: `v24.19.0`
- Next `16.3.4`, React `19.2.8`
- 기존 테스트: `src/lib/contract-readers.test.ts` (node:test)
- Playwright / axe / Lighthouse / PWA 패키지: 기준선 시점 없음. 이번 작업에서 승인 목록만 추가한다.

## 배포 · 환경변수 이름

- Cloudflare Workers + OpenNext: `wrangler.jsonc` `name=putduk-web`, `main=.open-next/worker.js`
- 스크립트: `preview`, `deploy` (`opennextjs-cloudflare`)
- 환경변수 **이름만**: `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `wrangler.jsonc` vars: `NEXT_PUBLIC_API_BASE` (값 이름은 공개 기본 호스트와 같음)
- 비밀값: 이 문서에 적지 않음
- 기존 GitHub Actions: 없음 (`.github/workflows` 404)
- 브랜치 보호 조회: 저장소 권한으로 확인 불가

## PWA (수정 전)

- `manifest` / service worker / `start_url` 파일 없음
- `layout.tsx` icons = `/putduk-mark.svg`, `themeColor` = `#ffffff`
- `public/_headers`는 `/_next/static`, `/assets`, `/cards`, `/fonts`만 캐시

## 백엔드 읽기 전용

| 기준 | SHA |
|---|---|
| 로컬 `C:\Users\PC\Desktop\AI_PROFIT_OS` | `4c6f22fabc485a8ac910582bd41dcb7bd1b53575` |
| GitHub main (이전 기록) | `c4ebcd870557c74f214735bfc9e6c4dac37aaeac` |
| production deploy 기록 | `3366bbe6cac8b1b188550ba651927ecc58f011bf` |
| `api.hiptk.app` 런타임 SHA | 확인 불가 → BLOCKED_CONTRACT |

백엔드 파일은 수정하지 않는다.

## 고객 웹이 호출하는 API

공통: `NEXT_PUBLIC_API_BASE` 기본 `https://api.hiptk.app`, `credentials: include`, `cache: no-store`.

| 함수 | 방법 | 경로 | 백엔드 연결 (4c6f22f) |
|---|---|---|---|
| `login` | POST | `/api/v1/auth/login` | `auth.controller` loginClassic |
| `signup` | POST | `/api/v1/auth/signup/classic` | signupClassic |
| `verifyClassicSignup` | POST | `/api/v1/auth/signup/classic/verify` | signupClassicActivate |
| `resendSignupEmail` | POST | `/api/v1/auth/email/resend` | emailVerifyResend, Turnstile action `email-resend` |
| `findId` | POST | `/api/v1/auth/find-id` | findId |
| `requestPasswordReset` | POST | `/api/v1/auth/password-reset/request` | passwordResetRequest |
| `completePasswordReset` | POST | `/api/v1/auth/password-reset/complete` | passwordResetComplete |
| `startGoogle` | POST | `/api/v1/auth/oauth/google/start` | oauthStart → `authorizeUrl` |
| `googleCallback` | POST | `/api/v1/auth/oauth/google/callback` | oauthCallback body `code`,`state`, 신규는 `termsAcceptedAt`,`privacyAcceptedAt` |
| `saveProfile` | PATCH | `/api/v1/auth/profile` | Stage B: `displayName`,`phoneE164`,`birthDate`,`email?`. gender 금지 |
| `getSession` | GET | `/api/v1/auth/session` | session |
| `logout` | POST | `/api/v1/auth/logout` | logout |
| refresh | POST | `/api/v1/auth/refresh` | refresh |
| `listOpportunities` | GET | `/api/v1/opportunities` | opportunities.user |
| `getOpportunity` | GET | `/api/v1/opportunities/:id` | get |
| `preflightOpportunity` | POST | `/api/v1/opportunities/:id/preflight` | preflight |
| `participateOpportunity` | POST | `/api/v1/opportunities/:id/participate` | participate |
| `getHomeRead` | GET | `/api/v1/me/home-read` | home-read |
| `getHomeMoneyRead` | GET | `/api/v1/me/home-money-read` | home-money-read |
| `approxCurrentFx` | POST | `/api/v1/me/current-fx/approx` | current-fx |
| `getTrialState` | GET | `/api/v1/me/trial-state` | trial-state.user |
| `listTrades` / `getTrade` / `executeTradeTick` | GET/GET/POST | `/api/v1/trades`… | trades.user |
| `getWalletBuckets` | GET | `/api/v1/wallet/buckets` | wallet.controller |
| `getMyDepositAddress` | GET | `/api/v1/wallet/my-deposit-address` | `UserDepositAddressV1`: `userId`,`trc20Address`,`derivationIndex`,`qrPayload`,`createdAt`,`lastSeenTxAt?`. QR 이미지 URL 없음 |
| `getKrwDepositInstructions` | GET | `/api/v1/wallet/krw-deposit-instructions` | 성공 키 `bankName`,`accountNumber`,`accountHolder`,`noticeKo` / 503 `CONFIG_NOT_READY` |
| `requestKrwDeposit` | POST | `/api/v1/wallet/krw-deposit-requests` | `requestedAmountKrw`,`depositorName`,`idempotencyKey` |
| `getLedgerJournals` | GET | `/api/v1/me/ledger/journals` | items[].`journalType`,`entries[]` |
| `requestWithdraw` | POST | `/api/v1/wallet/withdraw` | `idempotencyKey`,`stepUpToken` |
| step-up policy/challenge/verify | GET/POST/POST | `/api/v1/wallet/withdraw/step-up/*` | wallet.controller |
| `getKycStatus` | GET | `/api/v1/compliance/kyc/status` | `kycStatus` none/pending/approved/rejected |
| `submitKyc` | POST | `/api/v1/compliance/kyc/submit` | FormData. MIME/크기 상한 없음 |
| `getMembership` | GET | `/api/v1/me/membership` | `labelKo`,`dailyUserMatchCap`,`dailyMatchesUsed` |
| `getBenefits` | GET | `/api/v1/me/benefits` | items[].`titleKo`,`bodyKo`,`missionId` |
| `getReferralMe` | GET | `/api/v1/referral/me` | referral |
| `streamPeotteokChat` | POST SSE | `/api/v1/me/peotteok/chat` | coach.controller |

`GET /api/v1/me/benefits/summary` 는 백엔드에 있으나 화면은 목록만 쓴다.

## 계약 판정

| 항목 | 상태 | 이유 |
|---|---|---|
| 성별 서버 저장 | BLOCKED_CONTRACT | `FORBIDDEN_USER_AUTH_FIELDS`에 `gender`. Stage B body 금지 |
| 원장 한글/화살표 규칙 | BLOCKED_CONTRACT | `journalType` enum만 있음. 유저 표시명 계약 없음 |
| 신규 구글 약관 후 재호출 | BLOCKED_PRODUCT | `oauthCallback`은 prove 뒤에 약관을 본다. 코드 재사용을 제품에 넣지 않음 |
| KYC MIME/크기 | BLOCKED_CONTRACT | 서버 상한 없음. 프론트 임의 제한 없음 |
| 운영 SHA | BLOCKED_CONTRACT | 런타임 SHA 미확인 |
| 실계정/실구글/실자금/실QR스캔 | BLOCKED_ENV | 키·계정 없음 |
| BrowserStack | BLOCKED_ENV | 키 없음 |

## 유지할 사용자 dirty

- `.cursorignore`
- `src/components/gpt/SiteFooter.tsx`

이 두 파일은 이번 작업에서 되돌리지 않는다.
