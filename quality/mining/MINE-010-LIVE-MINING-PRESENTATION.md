# MINE-010 Live Mining Presentation and Server Resync

- 기준일: 2026-09-21
- 상태: **CLOSED**
- Phase: **PHASE10 = COMPLETE**
- Web repo: `phonarawd/putduk-web`
- Web branch: `phase/mine-live-presentation-20260921`
- PHASE10 verified implementation authority: `86cb95082b2852e4a50efe85076e25a880e94d17`
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`
- Production/staging/DB: PHASE10 구현·검증 중 변경하지 않음

## 1. 구현 범위

PHASE10은 PHASE09의 authoritative server mining snapshot 위에 display-only live presentation을 추가했다.

사용자 화면 동작:

- 1초 단위 presentation clock으로 표시값을 갱신
- 마지막 서버 `accruedProfitAmount`를 기준값으로 사용
- 서버 동기화 이후의 짧은 구간만 화면에서 표시용으로 보간
- 30초마다 positions-only silent server resync
- 최대 90초까지만 보간하고 이후 stale 상태로 고정
- `nextSettlementAt`을 넘어서는 보간 금지
- 탭이 hidden 상태이거나 mining mutation 처리 중이면 silent resync 생략
- silent resync 실패 시 마지막 authoritative server snapshot 유지
- 한 건의 active position일 때 채굴 홈의 `오늘 채굴`에 표시용 live presentation 적용
- 두 건 이상 active position이면 기존 규칙대로 `광산별 확인`을 유지하고 frontend 합산 금지
- 광산 상세 및 position card에 `표시용 예상` 여부와 서버 동기화 기준을 명시

## 2. Mining truth boundary

PHASE10의 client-side 계산은 금융 truth가 아니라 시각적 presentation 전용 approximation이다.

- authoritative mining profit: backend `accruedProfitAmount`
- authoritative principal: backend position
- authoritative daily rate: backend position/mine rate
- authoritative settlement: backend settlement engine
- authoritative wallet/withdrawable balance: backend/wallet domain

Frontend presentation은 서버가 이미 계산한 누적 수익을 다시 만들지 않는다. 마지막 서버 snapshot을 기준으로, 다음 server resync까지의 짧은 시간 증분만 표시 효과로 보간한다.

현재 presentation guardrail:

- tick: `1,000ms`
- silent resync: `30,000ms`
- maximum interpolation window: `90,000ms`
- next settlement boundary를 초과하지 않음
- presentation 출력 최대 소수 12자리
- non-active position은 보간하지 않음
- invalid/non-finite input은 서버값으로 fallback
- client approximation은 `MiningContext.positions`, mining summary, wallet, settlements, mutation payload를 변경하지 않음
- display approximation은 mutation 성공 여부나 정산 결과 판단에 사용하지 않음

서버는 rate-version 구간별 정확한 accrued profit을 계산하므로, rate가 resync 사이에 변경되는 경우에도 다음 서버 snapshot이 최종 기준이다. Client 값은 그 사이의 짧은 표시 효과일 뿐이다.

## 3. 구현 파일

- `src/lib/mining/presentation.ts`
  - `MINING_LIVE_TICK_MS = 1_000`
  - `MINING_LIVE_RESYNC_MS = 30_000`
  - `MINING_LIVE_MAX_INTERPOLATION_MS = 90_000`
  - `presentLiveMiningProfit(...)`
  - server value fallback / stale cap / settlement boundary cap
- `src/lib/mining/useMiningPresentationClock.ts`
  - visible-tab 1초 presentation clock
- `src/lib/mining/MiningContext.tsx`
  - positions-only silent resync
  - mutation/visibility guard
  - 실패 시 마지막 server snapshot 보존
- `src/components/mining/MiningHome.tsx`
  - single active position live display
  - multi-position frontend aggregate 금지 유지
- `src/components/mining/MineDetail.tsx`
  - individual position live presentation
  - `표시용 예상` / server authority labeling
- `src/lib/mining-presentation.test.ts`
  - presentation boundary unit coverage
- `quality/mining/phase10_live_mining_presentation_assertions.mjs`
  - PHASE10 architecture/authority assertion

## 4. 금지 경계 유지

PHASE10은 다음을 도입하지 않았다.

- direct browser Supabase mining access
- consumer에서 admin mining API 사용
- frontend authoritative mining profit 계산
- frontend position 수익 aggregate를 financial truth로 사용
- `summary.profitAmount`를 live mining profit으로 사용
- optimistic mining-money state mutation
- presentation value를 wallet/settlement/mutation payload에 반영
- mining contract 변경

`src/lib/mining/api.ts`의 `createLiveProfitSnapshot`은 계속 서버 position 값을 그대로 복사하는 snapshot builder다.

## 5. PHASE10 assertion

검증 파일:

`quality/mining/phase10_live_mining_presentation_assertions.mjs`

검증 범위:

- mining contract version locked
- server snapshot copy semantics 유지
- 1초 tick / 30초 resync / 90초 cap
- settlement boundary cap
- non-finite fallback
- presentation utility의 Supabase/backend direct fetch 금지
- presentation utility의 mining/wallet state mutation 금지
- MiningContext positions-only silent resync
- hidden tab / mutation guard
- silent resync failure가 last server snapshot을 유지
- home single-position presentation
- multi-position aggregate 금지
- `summary.profitAmount` live 수익 사용 금지
- detail presentation labeling
- current TypeScript target과 호환되지 않는 BigInt literal 사용 금지
- presentation unit coverage 존재

Canonical result:

```text
PHASE10_VERIFY_HEAD=86cb95082b2852e4a50efe85076e25a880e94d17
PHASE10_LIVE_MINING_PRESENTATION_ASSERTIONS_PASS
```

## 6. 첫 canonical 시도 — FAIL / 수정 완료

첫 verifier candidate:

- web SHA: `818785943e19ab577539039b752d75d4061a4c79`
- deploy id: `dep-daohe0id0e5s7389pr60`

실제 결과:

- PHASE10 assertion: PASS
- route typegen: PASS
- standalone TypeScript: **FAIL**
- 원인: `presentation.ts`의 BigInt literal이 현재 web TypeScript target보다 높은 ES2020 target을 요구함 (`TS2737`)

이 run은 PHASE10 PASS로 처리하지 않았다.

수정:

- authoritative server amount는 문자열 그대로 유지
- 짧은 presentation 증분만 bounded `Number` approximation으로 변경
- 12자리 표시 제한
- non-finite fallback 추가
- assertion에서 BigInt 사용 금지를 명시적으로 잠금

수정 후 exact SHA를 새로 고정해 canonical gate 전체를 다시 실행했다.

## 7. Canonical fresh-checkout verification — PASS

최종 canonical gate는 retired non-production Render PHASE04 verifier의 isolated build environment에서 수행했다.

- verification service: `putduk-mine-phase04-contract-verify`
- service id: `srv-dao0do8ae00c73aar74g`
- workspace: `tea-da5qqo3m8hqs73djpvvg`
- final PHASE10 canonical deploy id: `dep-daohfaqjnfac739082c0`
- exact web SHA: `86cb95082b2852e4a50efe85076e25a880e94d17`
- Node: `22.14.0`
- pnpm: `11.4.0`
- Next.js: `16.3.4`
- packages installed: `840`

실제 chain:

```text
PHASE04_API_ASSERTIONS_PASS
PHASE10_VERIFY_HEAD=86cb95082b2852e4a50efe85076e25a880e94d17
PHASE10_INSTALL_PASS
PHASE10_LIVE_MINING_PRESENTATION_ASSERTIONS_PASS
PHASE10_TYPEGEN_PASS
PHASE10_TYPECHECK_PASS
PHASE10_LINT_PASS
PHASE10_TEST_PASS
PHASE10_BUILD_PASS
PHASE10_VERIFY_OK
PHASE04_CONTRACT_VERIFY_OK
Build successful
```

### Lint actual result

```text
15 problems (0 errors, 15 warnings)
```

Verdict는 **PASS / 0 errors / 15 warnings**다. PHASE09 baseline과 동일하며 PHASE10 신규 lint warning은 없다. 기존 repository warning을 clean lint라고 표현하지 않는다.

### Unit tests actual result

```text
# tests 21
# pass 21
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

PHASE09의 15개 테스트에 PHASE10 presentation test 6개가 추가되었고 모두 PASS했다.

PHASE10 test coverage:

- 마지막 server snapshot 이후 짧은 구간 보간
- 90초 stale cap
- next settlement boundary cap
- inactive position server amount 유지
- invalid rate/sync server fallback
- non-finite input server fallback

### Next production build actual result

```text
▲ Next.js 16.3.4 (Turbopack)
✓ Compiled successfully in 7.8s
Finished TypeScript in 5.6s
✓ Generating static pages using 37 workers (35/35) in 835ms
├ ○ /work
└ ƒ /work/[mineId]
PHASE10_BUILD_PASS
PHASE10_VERIFY_OK
```

Marker 문자열만으로 PASS 처리하지 않았다. exact SHA checkout, assertion preceding output, generated route types, standalone typecheck, lint actual counts, unit test totals, production build, 35/35 static generation, `/work`와 `/work/[mineId]` route output을 직접 확인했다.

## 8. Verification branch recovery

Canonical gate를 위해 retired verifier historical branch에 temporary base assertion/wrapper를 사용했다.

검증 직후 branch ref를 historical original로 복구했다.

- backend repo: `phonarawd/AI-Profit-OS`
- branch: `phase/mine-operations-settlement-api-integrated-20260921`
- restored SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- recovery deploy id: `dep-daohgaek1f9s73c3qvb0`
- recovery status: `live`
- recovery verification:
  - exact checkout `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
  - `VERIFY_HEAD=a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
  - `PHASE04_API_ASSERTIONS_PASS`
  - `PHASE04_CONTRACT_VERIFY_OK`
  - `Build successful`
  - service live

Recovery log 조회 중 Render log backend에서 일시적인 `503 / 502 Bad Gateway` 응답이 한 차례 있었으나 재조회에서 실제 recovery build 로그와 live 상태를 확인했다. Source/deploy failure는 아니었다.

따라서 temporary PHASE10 verifier artifacts는 historical verifier branch에 남지 않는다.

## 9. Production / staging / DB boundary

PHASE10 동안 다음은 변경하지 않았다.

- production deploy
- production service configuration
- staging backend source/config
- production/staging DB schema
- Supabase migration
- mining data mutation for verification
- backend mining contract
- backend mining profit/rate/settlement engine

PHASE10은 consumer web의 display-only live mining presentation과 silent server resync 범위다.

## 10. Closure verdict

PHASE10 closure 조건을 충족했다.

- 1-second live presentation tick: PASS
- 30-second silent position resync: PASS
- 90-second maximum interpolation: PASS
- next settlement boundary cap: PASS
- server snapshot base: PASS
- invalid/non-finite server fallback: PASS
- hidden tab / mutation resync guard: PASS
- silent failure preserves server snapshot: PASS
- single active home live presentation: PASS
- multiple active positions remain `광산별 확인`: PASS
- individual position live display: PASS
- display-only labeling: PASS
- no authoritative frontend mining truth: PASS
- no direct mining Supabase access: PASS
- no admin mining API use: PASS
- no optimistic mining-money mutation: PASS
- mining contract unchanged: PASS
- first failed candidate not misreported as PASS: confirmed
- corrected exact fresh SHA verified: PASS
- PHASE10 assertion: PASS
- TypeScript: PASS
- lint: PASS / 0 errors / 15 warnings
- unit tests: PASS / 21 passed / 0 failed
- Next production build: PASS / 35 pages generated
- `/work` and `/work/[mineId]`: build output confirmed
- verifier recovery: PASS / historical service live
- production/staging/DB untouched: confirmed

**MINE-010 = CLOSED**

**PHASE10 = COMPLETE**
