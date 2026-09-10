# 실행 증거 (2026-09-10)

작업 전 HEAD `f9a66517a04d27c7b8a229ae1954453d465cbaf1`. 기준 main `5c946e074c305907aee1091b1ab5770842a9dc0d`. 작업 후 HEAD `cdae756cdafa0613dae6648382434a032e6cafe8`. PR https://github.com/phonarawd/putduk-web/pull/1. MERGED: NO. DEPLOYED: NO.

상태값은 PASS / FAIL / NOT_RUN / BLOCKED_CONTRACT / BLOCKED_ENV / BLOCKED_PRODUCT / BLOCKED_TOOLING만 쓴다. 실행하지 않은 검사는 PASS로 쓰지 않는다.

근거 run: https://github.com/phonarawd/putduk-web/actions/runs/34469740629 (`cdae756`). artifact `pr-quality`, `pr-quality-browsers`.

## 게이트

| 검사 | 명령 | 횟수 | 종료 코드 | 상태 |
|---|---|---|---|---|
| typecheck | `pnpm exec tsc --noEmit` (빌드 후) | CI 1 | 0 | PASS |
| lint | `pnpm lint` | CI 1 | 0 | PASS |
| unit | `pnpm test` | CI 1 | 0 | PASS (10) |
| production build | `pnpm build` | CI 1 | 0 | PASS |

## Playwright

workers 1, baseURL `http://127.0.0.1:4173`, production `next start`. Firefox/WebKit/Mobile Safari는 `a11y.spec`을 project에서 제외(axe는 Chromium·Mobile Chrome).

| 검사 | 명령 | 브라우저 | viewport | 횟수 | 성공/실패 | 종료 | artifact | 상태 |
|---|---|---|---|---|---|---|---|---|
| E2E 1-47 + axe + PWA + QR | `playwright test --project=chromium --project=mobile-chrome` | Chromium, Mobile Chrome | 1280×720, Pixel 7 | CI 1 (최신) | CI 최신 통과 | 0 | Actions `pr-quality` | PASS |
| Firefox | `--project=firefox` | Firefox | 1280×720 | CI 1 | 통과 | 0 | `pr-quality-browsers` | PASS |
| WebKit | `--project=webkit --project=mobile-safari` | WebKit, iPhone 13 | 1280×720, 기기 | CI 1 | 통과 | 0 | `pr-quality-browsers` | PASS |
| 연속 3회 전체 회귀 | 전 브라우저 | - | 0 | 저사양·CI는 push당 1회 | - | - | NOT_RUN |

필수 E2E(인증 1-12, 격리 13-19, 금융 20-28, KYC 29-37, UI/UX 38-47): CI Chromium·Mobile Chrome·Firefox·WebKit에서 통과. Google start는 검증된 authorizeUrl만. email-resend Turnstile 포함. 출금 재시도는 같은 idempotency key.

## axe

차단: critical 0, serious 0 (CI Chromium·Mobile Chrome artifact).

## Lighthouse (CI production, desktop, Playwright Chromium)

명령: `CHROME_PATH=ms-playwright chrome` + `puppeteerLaunchOptions --no-sandbox`. 횟수 1. 종료 1. 임계값 하향 없음.

| 화면 | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms | 콘솔 | 상태 |
|---|---|---|---|---|---|---|---|---|---|
| 로그인 | 0.86 | 1.00 | 0.96 | 1.00 | 2591 | 0 | 0 | errors-in-console 0 | FAIL (Perf<0.9) |
| 홈 `/` | 0.90 | 1.00 | 1.00 | 1.00 | 2141 | 0.0001 | 15 | 1 | PASS |
| 기회 `/work` | 0.89 | 1.00 | 1.00 | 1.00 | 2272 | 0.0001 | 24 | 1 | FAIL (Perf<0.9) |
| 입금 | 0.87 | 1.00 | 1.00 | 1.00 | 2459 | 0.0001 | 5 | 1 | FAIL (Perf<0.9) |
| 나 `/me` | 0.88 | 1.00 | 1.00 | 1.00 | 2376 | 0.0001 | 0 | 1 | FAIL (Perf<0.9) |

수정 전 로컬: 로그인 0.54 / 홈 0.69 / 기회 0.83 / 입금 0.84 / 나 0.87. 남은 병목은 약 2MB Pretendard와 클라이언트 셸. 기능 숨김으로 점수를 만들지 않음.

## 기타

| 항목 | 상태 |
|---|---|
| PWA manifest/SW/오프라인 정직 | CI Chromium·Mobile Chrome PASS. 금융 경로 비캐시 |
| QR 서버 문자열 왕복 | CI Chromium·Mobile Chrome PASS. 실주소 스캔 BLOCKED_ENV |
| 성별 서버 저장 | BLOCKED_CONTRACT |
| 원장 한글 표시 계약 | BLOCKED_CONTRACT |
| GitHub Actions quality | FAIL (Lighthouse Perf만). 그 앞 게이트·E2E PASS |
| GitHub Actions browsers | PASS |
| BrowserStack | BLOCKED_ENV |
| 실계정·실구글·실자금 | BLOCKED_ENV |
| 사용자 dirty `.cursorignore`, `SiteFooter.tsx` | 보존, 커밋 안 함 |
