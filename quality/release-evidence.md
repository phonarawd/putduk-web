# 실행 증거 (2026-09-10)

작업 전 HEAD `4e94c6c1c733adb3627078b38c5a98ce9be93c5f`. 제품 근거 SHA `cdae756cdafa0613dae6648382434a032e6cafe8`. 계약 근거 백엔드 PR #222 `@0fa38d77`. PR https://github.com/phonarawd/putduk-web/pull/1. MERGED: NO. DEPLOYED: NO.

상태값은 PASS / FAIL / NOT_RUN / BLOCKED_CONTRACT / BLOCKED_ENV / BLOCKED_PRODUCT / BLOCKED_TOOLING만 쓴다. 실행하지 않은 검사는 PASS로 쓰지 않는다.

성별·원장 display·Google complete·KYC 한도는 화면+mock E2E로 연결했다. 실 API는 BLOCKED_ENV.

## 게이트

| 검사 | 명령 | 횟수 | 종료 코드 | 상태 |
|---|---|---|---|---|
| typecheck | `pnpm exec tsc --noEmit` | 로컬 1 | 0 | PASS |
| unit | `pnpm test` | 로컬 1 | 0 | PASS (11) |
| lint | `pnpm lint` | 0 | — | NOT_RUN |
| production build | `pnpm build` | 0 | — | NOT_RUN |

## Playwright

| 검사 | 명령 | 브라우저 | 횟수 | 상태 |
|---|---|---|---|---|
| 계약 연결 E2E | 로컬 전 브라우저 | - | 0 | NOT_RUN (저사양). CI push 1회 대기 |
| 연속 3회 전체 회귀 | 전 브라우저 | - | 0 | NOT_RUN |

직전 CI (`cdae756`, run 34469740629) E2E는 그때 코드 기준 PASS. 이번 계약 연결 후 결과는 새 Actions를 따른다.

## Lighthouse

임계값 하향 없음. 기능 숨김·테스트 skip 없음. Pretendard preload만 제거. 측정용 lhci-prep Turnstile 스텁은 제품에서 위젯을 빼지 않는다.

직전 CI (`cdae756`): 로그인 0.86 / 홈 0.90 / 기회 0.89 / 입금 0.87 / 나 0.88. 이번 푸시 점수는 Actions 전 NOT_RUN.

## 기타

| 항목 | 상태 |
|---|---|
| 성별 서버 저장 | 화면 연결. 실 API BLOCKED_ENV |
| Google complete | 화면 연결. code/state 재전송 없음. 실 API BLOCKED_ENV |
| 원장 display | 화면 연결. 실 API BLOCKED_ENV |
| KYC 한도 | 화면 연결. 실 API BLOCKED_ENV |
| 사용자 dirty `.cursorignore`, `SiteFooter.tsx` | 보존, 커밋 안 함 |
