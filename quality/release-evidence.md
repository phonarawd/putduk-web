# 실행 증거 (2026-09-10)

작업 전 HEAD `4e94c6c1c733adb3627078b38c5a98ce9be93c5f`. 제품 근거 SHA `cdae756cdafa0613dae6648382434a032e6cafe8`. 계약 근거 백엔드 PR #222 `@0fa38d77`. PR https://github.com/phonarawd/putduk-web/pull/1. MERGED: NO. DEPLOYED: NO.

상태값은 PASS / FAIL / NOT_RUN / BLOCKED_CONTRACT / BLOCKED_ENV / BLOCKED_PRODUCT / BLOCKED_TOOLING만 쓴다. 실행하지 않은 검사는 PASS로 쓰지 않는다.

성별·원장 display·Google complete·KYC 한도는 화면+mock E2E로 연결했다. 실 API는 BLOCKED_ENV.

근거: https://github.com/phonarawd/putduk-web/actions/runs/34475447091 (`b68bf54`). artifact `pr-quality`, `pr-quality-browsers`. 계약 E2E 근거는 같은 코드의 https://github.com/phonarawd/putduk-web/actions/runs/34473966640 (`2a51de6`, Firefox/WebKit PASS).

## 게이트

| 검사 | 명령 | 횟수 | 종료 코드 | 상태 |
|---|---|---|---|---|
| typecheck | `pnpm exec tsc --noEmit` | CI 1 | 0 | PASS |
| lint | `pnpm lint` | CI 1 | 0 | PASS (경고만) |
| unit | `pnpm test` | CI 1 + 로컬 1 | 0 | PASS (11) |
| production build | `pnpm build` | CI 1 | 0 | PASS |

## Playwright

| 검사 | 브라우저 | 횟수 | 상태 |
|---|---|---|---|
| E2E Chromium + Mobile Chrome | Chromium, Pixel 7 | CI `b68bf54` 1 | PASS |
| Firefox | Firefox | CI `2a51de6` PASS. `b68bf54` PWA 오프라인 1건 FAIL | FAIL (HEAD) |
| WebKit | WebKit | CI `2a51de6` PASS. `b68bf54`는 Firefox 실패로 생략 | NOT_RUN (HEAD) |
| 연속 3회 전체 회귀 | - | 0 | NOT_RUN |

Google complete는 pendingToken만 보내고 code/state를 다시 보내지 않는다. 원장은 `display.labelKo`/`amountUsdt`. 성별 PATCH 200 전 성공 없음. KYC 과대 파일·409는 성공으로 보지 않음.

## Lighthouse (CI production, desktop)

명령: `pnpm exec lhci autorun`. 종료 1. 임계값 하향 없음. 홈만 어서션 목록에 없어 ≥0.90.

| 화면 | `cdae756` | `2a51de6` preload 제거 | `b68bf54` preload 복구 | 상태 |
|---|---|---|---|---|
| 로그인 | 0.86 | 0.77 | 0.89 | FAIL |
| 홈 `/` | 0.90 | 0.79 | ≥0.90 | PASS |
| 기회 `/work` | 0.89 | 0.79 | 0.89 | FAIL |
| 입금 | 0.87 | 0.79 | 0.86 | FAIL |
| 나 `/me` | 0.88 | 0.79 | 0.88 | FAIL |

2MB Pretendard·클라이언트 셸은 그대로다. 기능 숨김 없음.

## 기타

| 항목 | 상태 |
|---|---|
| 성별 서버 저장 | 화면+mock PASS. 실 API BLOCKED_ENV |
| Google complete | 화면+mock PASS. 실 API BLOCKED_ENV |
| 원장 display | 화면+mock PASS. 실 API BLOCKED_ENV |
| KYC 한도 | 화면+mock PASS. 실 API BLOCKED_ENV |
| GitHub Actions quality | FAIL (Lighthouse Perf). 게이트·Chromium E2E PASS |
| GitHub Actions browsers HEAD | FAIL (Firefox PWA 1). WebKit NOT_RUN |
| 사용자 dirty `.cursorignore`, `SiteFooter.tsx` | 보존, 커밋 안 함 |
