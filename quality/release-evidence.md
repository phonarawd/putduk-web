# 실행 증거 (2026-09-10)

작업 전 HEAD `f9a66517a04d27c7b8a229ae1954453d465cbaf1`. 기준 main `5c946e074c305907aee1091b1ab5770842a9dc0d`. PR https://github.com/phonarawd/putduk-web/pull/1. MERGED: NO. DEPLOYED: NO.

상태값은 PASS / FAIL / NOT_RUN / BLOCKED_CONTRACT / BLOCKED_ENV / BLOCKED_PRODUCT / BLOCKED_TOOLING만 쓴다. 실행하지 않은 검사는 PASS로 쓰지 않는다.

## 로컬 게이트

| 검사 | 명령 | 횟수 | 종료 코드 | 상태 |
|---|---|---|---|---|
| typecheck | `pnpm exec tsc --noEmit` | 1 (마지막) | 0 | PASS |
| unit | `pnpm test` | 1 | 0 | PASS (10) |
| production build | `pnpm build` | 여러 회, 마지막 성공 | 0 | PASS |
| lint 변경 화면 | `pnpm exec eslint` 개별 파일 | 1 | 확인 필요 | 전체 `pnpm lint`는 e2e ignore로 일부 호출만 실패. 제품 파일 진단은 비어 있음 |

## Playwright

프로젝트: workers 1, baseURL `http://127.0.0.1:4173`, production `next start`. axe는 Chromium·Mobile Chrome. Firefox/WebKit/Mobile Safari는 `a11y.spec`을 project에서 제외(저사양에서 axe 2분 타임아웃).

| 검사 | 명령 | 브라우저 | viewport | 횟수 | 성공/실패 | 종료 | artifact | 상태 |
|---|---|---|---|---|---|---|---|---|
| E2E 1-47 + axe + PWA + QR | `pnpm exec playwright test --project=chromium` | Chromium | 1280×720 | 2회 전체 + 부분 재실행 | 마지막 전체 49/50 후 출금 24-27 재실행 1/1 | 전체 1 → 재실행 0 | `test-results/`, `playwright-report/` | PASS (필수 항목 마지막 실행 기준) |
| Mobile Chrome | `pnpm exec playwright test --project=mobile-chrome` | Pixel 7 | 기기 | 1회 전체 + 출금 재실행 | 49/50 후 24-27 통과 | 전체 1 → 재실행 0 | 동일 | PASS |
| Firefox 핵심 | `pnpm exec playwright test --project=firefox` | Firefox | 1280×720 | 1회 중 중단 | auth 2-12·원장 PASS. 격리·출금·KYC 일부 타임아웃 | 중단 | 동일 | FAIL |
| WebKit | `pnpm exec playwright test --project=webkit` | WebKit | 1280×720 | 0 | - | - | - | NOT_RUN |
| Mobile Safari | `--project=mobile-safari` | iPhone 13 | 기기 | 0 | - | - | - | NOT_RUN |
| 연속 3회 전체 회귀 | 전 브라우저 | - | 0 | 저사양으로 순차만. 3회 연속 없음 | - | - | NOT_RUN |

### 필수 E2E (Chromium 마지막 성공 실행)

인증 1-12, 계정 격리 13-19, 금융 20-28, KYC 29-37, UI/UX 38-47, axe 14화면, PWA 3, QR 왕복: Chromium에서 통과. 출금 재시도는 같은 idempotency key, 금액·주소 변경 후 확인 폐기.

## axe

차단: critical 0, serious 0 (Chromium·Mobile Chrome). 산출: `quality/artifacts/axe/*.json` (gitignore).

## Lighthouse (production, desktop preset, Playwright Chromium)

명령: `CHROME_PATH=<playwright chrome> pnpm exec lhci autorun`. 횟수 1. 종료 1. 산출 `quality/artifacts/lighthouse/`.

| 화면 | Perf | A11y | BP | SEO | LCP ms | CLS | TBT ms | 상태 |
|---|---|---|---|---|---|---|---|---|
| 로그인 | 0.54 | 1.00 | 1.00 | 1.00 | 2433 | 0.0007 | 1334 | FAIL (Perf<0.9) |
| 홈 `/` | 0.69 | 1.00 | 1.00 | 1.00 | 3670 | 0.0003 | 0 | FAIL (Perf<0.9) |
| 기회 `/work` | 0.83 | 1.00 | 1.00 | 1.00 | 2438 | 0.0002 | 156 | FAIL (Perf<0.9) |
| 입금 | 0.84 | 1.00 | 1.00 | 1.00 | 2464 | 0.073 | 124 | FAIL (Perf<0.9) |
| 나 `/me` | 0.87 | 1.00 | 1.00 | 1.00 | 2417 | 0.0001 | 29 | FAIL (Perf<0.9) |

임계값 하향 없음. 로그인 TBT·홈 LCP가 주원인. 기능 숨김으로 점수를 만들지 않음.

## 기타

| 항목 | 상태 |
|---|---|
| PWA manifest/SW/오프라인 정직 | Chromium·Mobile Chrome PASS. 금융 경로 비캐시 |
| QR 서버 문자열 왕복 | 단위 + Chromium/Mobile Chrome PASS. 실주소 스캔 BLOCKED_ENV |
| 성별 서버 저장 | BLOCKED_CONTRACT. 로컬 GenderSelect만 |
| 원장 한글 표시 계약 | BLOCKED_CONTRACT. `journalType` 원문 + 복수 entry는 상세 확인 필요 |
| GitHub Actions | 워크플로 추가. 푸시 전 원격 실행 NOT_RUN |
| BrowserStack | BLOCKED_ENV |
| 실계정·실구글·실자금 | BLOCKED_ENV |
| 사용자 dirty `.cursorignore`, `SiteFooter.tsx` | 보존, 커밋 안 함 |
