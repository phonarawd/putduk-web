# 실행 증거 (2026-09-10)

작업 전 HEAD `5029d1a8dfc4dc2209c4c5f56c92a49494d85926`. 지금 HEAD `0caf192abe880918996bb2b9bc3ddc0882bae11c`. 제품 근거 SHA `cdae756cdafa0613dae6648382434a032e6cafe8`. 계약 근거 백엔드 PR #222 `@0fa38d77`. PR https://github.com/phonarawd/putduk-web/pull/1. MERGED: NO. DEPLOYED: NO.

상태값은 PASS / FAIL / NOT_RUN / BLOCKED_CONTRACT / BLOCKED_ENV / BLOCKED_PRODUCT / BLOCKED_TOOLING만 쓴다. 실행하지 않은 검사는 PASS로 쓰지 않는다.

Firefox PWA 오프라인 실패 원인: `5029d1a`는 `b68bf54`와 제품 코드가 같다. Firefox에서 오프라인 `goto("/wallet/deposit")`가 문서 이동을 끝내면 `AuthGate`가 세션 실패를 로그인/대기 화면으로 그려 `MSG.offlineFinance`가 사라졌다. Chromium은 같은 `goto`가 실패해 `/offline`에 남아 PASS. 계약 연결과 무관. preload 복구는 SW를 바꾸지 않았고, 게이트가 오프라인을 가린 것이 직접 원인.

근거: https://github.com/phonarawd/putduk-web/actions/runs/34479208007 (`0caf192`). artifact `pr-quality`, `pr-quality-browsers`. 중간 `37e8206` run 34477108102도 Firefox/WebKit E2E PASS, Lighthouse만 FAIL.

## 게이트

| 검사 | 명령 | 횟수 | 종료 코드 | 상태 |
|---|---|---|---|---|
| typecheck | `pnpm exec tsc --noEmit` | CI 1 + 로컬 1 | 0 | PASS |
| lint | `pnpm lint` | CI 1 | 0 | PASS (경고만) |
| unit | `pnpm test` | CI 1 + 로컬 1 | 0 | PASS (11) |
| production build | `pnpm build` | CI 1 | 0 | PASS |

## Playwright

| 검사 | 브라우저 | 횟수 | 상태 |
|---|---|---|---|
| E2E Chromium + Mobile Chrome | Chromium, Pixel 7 | CI `0caf192` 1 | PASS |
| Firefox | Firefox | CI `0caf192` 1 | PASS |
| WebKit | WebKit | CI `0caf192` 1 (`--project=webkit`) | PASS |
| Mobile Safari | WebKit iPhone | CI `0caf192` 1 (같은 단계 `--project=mobile-safari`) | PASS |
| 연속 3회 전체 회귀 | - | 0 | NOT_RUN |

PWA 오프라인은 잔액 셀렉터와 `12.50 USDT|18,000원` 0개, `MSG.offlineFinance`만. skip/only 없음.

## Lighthouse (CI production, desktop)

명령: `pnpm exec lhci autorun`. 종료 1. 임계값 하향 없음.

| 화면 | `b68bf54` | `37e8206` | `0caf192` | 상태 |
|---|---|---|---|---|
| 로그인 | 0.89 | 0.88 | 0.88 | FAIL |
| 홈 `/` | ≥0.90 | ≥0.90 | 0.89 | FAIL |
| 기회 `/work` | 0.89 | 0.88 | 0.88 | FAIL |
| 입금 | 0.86 | ≥0.90 | ≥0.90 | PASS |
| 나 `/me` | 0.88 | 0.88 | 0.89 | FAIL |

CLS는 `37e8206` 측정에서 0에 가깝다. 로그인 콘솔 401은 로그아웃 세션 거절. 2MB Pretendard 전면 교체·기능 숨김 없음.

## 기타

| 항목 | 상태 |
|---|---|
| 성별 서버 저장 | 화면+mock PASS. 실 API BLOCKED_ENV |
| Google complete | 화면+mock PASS. 실 API BLOCKED_ENV |
| 원장 display | 화면+mock PASS. 실 API BLOCKED_ENV |
| KYC 한도 | 화면+mock PASS. 실 API BLOCKED_ENV |
| GitHub Actions quality | FAIL (Lighthouse Perf). 게이트·Chromium E2E PASS |
| GitHub Actions browsers HEAD | PASS (Firefox + WebKit + Mobile Safari) |
| 사용자 dirty `.cursorignore`, `SiteFooter.tsx` | 보존, 커밋 안 함 |
