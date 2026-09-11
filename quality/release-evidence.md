# 실행 증거 (2026-09-11 세션 종료)

작업 전 HEAD `5535bfd506f2c5122b343f720c932fb1d13b7592`.
작업 후 제품 HEAD `dd20d2b8d8c5f20accb9eba33420a3ba1367b00a` (이 문서 커밋 직전).
PR https://github.com/phonarawd/putduk-web/pull/1. MERGED: NO. DEPLOYED: NO.

상태값: PASS / FAIL / NOT_RUN / INTERRUPTED / FIREFOX_ADVISORY / BLOCKED_BACKEND / BLOCKED_ENV.
추측 PASS 금지. 돌리지 않은 브라우저는 NOT_RUN.

stash@{0} (`SiteFooter.tsx` 공백)는 적용·삭제하지 않고 유지.

## 이번 세션에서 한 일

1. git hook이 `.sample` + 선택적 `git config`만 있어 실제로 안 붙던 것을, `prepare`가 `.githooks` → `.git/hooks`로 복사하게 함. `core.hooksPath`는 설정하지 않음. 두 커밋 모두 pre-commit이 실제로 돌았다.
2. Firefox PWA flake 원인: `setOffline` 뒤 Firefox는 `navigator.onLine=true`인 채 세션 fetch가 실패하고, AuthGate가 로그아웃 대기로 처리함. SW는 303 리다이렉트로 두 번째 내비게이션이 흔들림.
3. 제품 수정: `isNetworkFailure` + `sessionUnreachable`이면 게이트 경로에 `OfflineNotice`. 네트워크 실패로 로그인 리다이렉트 하지 않음. SW v3는 document 요청(`mode=navigate` 또는 `destination=document`)에 캐시된 `/offline` HTML을 바로 줌.
4. PWA 검사는 SW activated + `/offline` 캐시 대기, 오프라인 후 unroute, `goto waitUntil commit`, 실패 시 probe 덤프. skip/retry/timeout 패딩 없음.
5. Footer 로그인 vs 홈은 의도된 구조(공개 푸터 vs 로그인 모바일 내비). 재디자인 없음. 320 홈 로그인 overflow/nav 3px는 기존 허용치.
6. 추가 전체 E2E/Lighthouse 루프는 사용자가 중단. Mobile Chrome 2회차는 중도에 끊음(INTERRUPTED, PASS로 기록하지 않음).

커밋(푸시됨, force 아님):

- `a45505f` pre-commit/pre-push를 git config 없이 실제 hook으로 연결한다.
- `dd20d2b` 오프라인 금융은 세션 실패로 위장하지 않고, SW는 캐시 문서를 바로 보여 준다.

## 게이트 (로컬, 제품 변경 이후)

| 검사 | 명령 | 결과 | 비고 |
|---|---|---|---|
| install | `pnpm install --frozen-lockfile` | PASS EXIT 0 | |
| typecheck | `pnpm exec tsc --noEmit` | PASS EXIT 0 | 변경 후 2회 |
| lint | `pnpm lint` | PASS EXIT 0 | 경고 15개(기존 img/exhaustive-deps), 오류 0 |
| unit | `pnpm test` | PASS EXIT 0 | 12 passed (`isNetworkFailure` 추가) |
| production build | `pnpm build` | PASS EXIT 0 | 마지막 소스 변경 이후. 첫 E2E는 재사용 서버 chunk 500으로 실패(제품 버그 아님) |
| pre-push 스모크 | hook: unit + chromium auth+qr | PASS | unit 12, auth+qr 14 passed / 2.1m. 전체 행렬 아님 |

## Playwright — 로컬 Windows, 제품 변경(`dd20d2b`) 이후

첫 Chromium 시도는 `next start`를 리빌드 후 재사용해 JS chunk 500·ReadyNotice hydration. 서버를 죽이고 깨끗이 빌드한 뒤의 숫자만 아래.

| 프로젝트 | 횟수 | 결과 | 비고 |
|---|---|---|---|
| Chromium 전체 스펙 | 3연속 | PASS | run1 85 / 18.8m EXIT 0; run2 85 / 17.9m EXIT 0; run3 85 / 15.5m EXIT 0 |
| Mobile Chrome | 1회 | PASS | 85 / 17.0m EXIT 0 |
| Mobile Chrome | 2회차 | INTERRUPTED / NOT_RUN | 시작 후 사용자 중단. 10개 근처에서 끊김. PASS로 쓰지 않음 |
| WebKit | — | NOT_RUN | 이번 수정 이후 로컬 없음 |
| Mobile Safari | — | NOT_RUN | 이번 수정 이후 로컬 없음 |
| Firefox | — | NOT_RUN / FIREFOX_ADVISORY | 이번 수정 이후 로컬 없음. 수정이 flake를 겨냥했으나 재증명 없음 |

포함 내용(위 PASS 런에 한함): axe 33화면 + reduced-motion/Tab/tablist, uiux footer viewport 48, QR, PWA(Chromium/Mobile Chrome).

## GitHub Actions

### 수정 후 SHA `dd20d2b` (이번 푸시) — 판정 아직 없음

푸시 직후 in-progress. 완료를 기다리지 않음. job별 결과는 NOT_RUN / in-progress.

- push: https://github.com/phonarawd/putduk-web/actions/runs/34577315623
- pull_request: https://github.com/phonarawd/putduk-web/actions/runs/34577320757
- quality job: pending
- browsers job: pending

이 URL이 SUCCESS가 되기 전에는 수정 후 WebKit/Firefox/Lighthouse를 PASS로 쓰지 않는다.

### 수정 전 SHA `5535bfd` (이번 세션 제품 커밋 이전)

같은 SHA에서 browsers가 갈림(플레이크).

- https://github.com/phonarawd/putduk-web/actions/runs/34561027344 — quality SUCCESS, browsers FAILURE (Firefox)
- https://github.com/phonarawd/putduk-web/actions/runs/34561028962 — quality SUCCESS, browsers SUCCESS

## Lighthouse

**수정 후(`dd20d2b`) 로컬: NOT_RUN.** 임계값 하향 없음. 아래는 수정 전 `5535bfd` quality 아티팩트(5화면 × 3, desktop). 새 SHA 성능으로 쓰지 말 것.

| 화면 | run1 | run2 | run3 | median | SHA/출처 |
|---|---|---|---|---|---|
| `/login` | 0.99 | 0.98 | 0.98 | **0.98** | `5535bfd` CI quality |
| `/` | 0.99 | 0.99 | 0.99 | **0.99** | `5535bfd` CI quality |
| `/work` | 0.98 | 1.00 | 1.00 | **1.00** | `5535bfd` CI quality |
| `/wallet/deposit` | 0.98 | 0.98 | 0.98 | **0.98** | `5535bfd` CI quality |
| `/me` | 1.00 | 1.00 | 1.00 | **1.00** | `5535bfd` CI quality |

## 기타

| 항목 | 상태 |
|---|---|
| Footer viewport | 로컬 Chromium 3회 + Mobile Chrome 1회에서 uiux 48 PASS. 로그인 vs 홈은 공개 푸터/로그인 내비 구조. 재디자인 없음 |
| axe critical/serious | Chromium 85-pass 런에 33화면 + reduced-motion/Tab/tablist 포함. WebKit/Firefox axe는 수정 후 NOT_RUN |
| PWA | Chromium/Mobile Chrome PASS. Firefox는 수정 후 NOT_RUN (FIREFOX_ADVISORY) |
| QR | 위 Chromium 3회 + MC1 PASS. pre-push Chromium qr도 PASS |
| 성별/Google complete/원장/KYC 실 API | BLOCKED_BACKEND |
| 계약 스키마 드리프트 | 이전 세션+로컬 mock. 백엔드 #222 미머지 |
| `pnpm audit` | 8건 (1 low / 3 moderate / 4 high). 분류는 `blockers.md`. 미업그레이드 |
| `SiteFooter.tsx` | stash 보존, 미적용 |
