# P0 후속 검사 (읽기 전용)

기록 시각: 2026-09-10 로컬. 이 문서는 수정 전 기준선이다.

## Git

- 브랜치: `ui/p0-account-truth` → `origin/ui/p0-account-truth`
- 작업 전 HEAD: `7766cbd4244d4642d03f6d0fb0dfc9b447ce798c`
- 기준 main: `5c946e074c305907aee1091b1ab5770842a9dc0d`
- working tree: dirty 없음
- PR: https://github.com/phonarawd/putduk-web/pull/1 OPEN
- 새 PR/머지/배포/main 수정: 하지 않음

## 백엔드 SHA

우선 SHA `4c6f22fabc485a8ac910582bd41dcb7bd1b53575`는 운영 계약과 **같지 않다.**

| 기준 | SHA |
|---|---|
| 지정 | `4c6f22fabc485a8ac910582bd41dcb7bd1b53575` |
| GitHub `main` | `c4ebcd870557c74f214735bfc9e6c4dac37aaeac` |
| GitHub production deploy 기록 | `3366bbe6cac8b1b188550ba651927ecc58f011bf` |
| `api.hiptk.app` 실제 프로세스 | 확인 불가 → BLOCKED_CONTRACT |

로컬 읽기 전용 클론: `C:\Users\PC\Desktop\AI_PROFIT_OS` HEAD = 지정 SHA.
아래 계약은 `4c6f22f` 소스. ledger/KYC/membership/benefits/Stage B/withdraw 키는 `main`과 동일. Turnstile `email-resend` policy 파일은 `4c6f22f`에만 있다.

## 유지할 기존 변경

계정 userId 저장소 분리, clearAccountState, `/me/records` 게이트, 로그인·가입·찾기·재설정 Turnstile, Stage B에서 gender/birthPrefix 미전송, 가짜 QR 제거, 하드코딩 등급·bonusBank 제거, 출금 정책 실패 재시도, 원장 0/unknown 화살표 억제, KRW_QUICK_AMOUNTS, 100dvh+safe-area, 카카오/매직링크/패스키 없음.

## 결함 (코드에서 확인)

1. Google start가 `authorizeUrl`을 안 읽고 `url/redirectUrl/authorizationUrl` fallback을 쓴다. 콜백 페이지 없음. body에 `state` 없음.
2. complete-profile이 `phoneE164`를 안 보내고 GenderSelect를 로컬 저장한다.
3. `/auth/verify-email` 재전송에 Turnstile 없음.
4. 원장이 `journalType`/`entries[]`를 안 읽고 type 정규식·Number 변환을 쓴다.
5. KYC 조회 실패를 `none`으로 바꿔 폼을 연다.
6. 출금이 클릭마다 새 idempotency key를 만들고 제출 직전 잠금값을 안 본다.
7. 멤버십이 `labelKo`를 안 읽는다. 혜택 API는 백엔드에 있는데 화면이 미연결. evidence가 “API 없음”으로 잘못 적음.
8. `SiteHeader`가 `resellerId || displayName`을 쓴다.
9. 원화 안내가 loading/error/empty를 구분하지 않고 전용 계좌를 확정한다. 입금 탭 ARIA가 불완전.
10. `quality/release-evidence.md`가 미실행 항목을 PASS로 적는다. `route-inventory.json`이 `/`와 `/auth/complete-profile`을 gated로 적는다.

## 도구

- package.json: next/react/eslint/typescript/wrangler. **테스트 러너·Playwright·axe·Lighthouse 없음.**
- 테스트 파일 0개. `pnpm test` 스크립트 없음.
- PWA manifest/service worker 없음.

## 수정 시 추측 금지

- `needsCompleteProfile` 필드 없음. `onboarding` / `onboardingStage`만 사용.
- gender/birthPrefix/resellerId 전송·생성 금지.
- KYC MIME/크기 상한은 백엔드에 없음 → 임의 제한 금지.
- 원장 한글 유형명·화살표 규칙 없음 → 확정 전 “상세 확인 필요”.
- Playwright 등 새 패키지 설치 금지.
