# MINE-007 Consumer Mining State Rebase

- 기준일: 2026-09-21
- 상태: **CLOSED**
- Phase: **PHASE07 = COMPLETE**
- Web repo: `phonarawd/putduk-web`
- Web branch: `phase/mine-web-state-rebase-20260921`
- PHASE07 verified implementation authority: `61fe6a6aa4c5ecc57c18b1937f6738111330c6b4`
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`
- Production: PHASE07 검증 중 변경하지 않음

## 1. 구현 범위

PHASE07에서는 consumer web의 상태 ownership을 mining product 중심으로 재배치했다.

- `MiningContext`
  - mines
  - positions
  - server-returned live profit snapshot
  - settlements
  - mining summary
  - mining refresh/error/readiness
- `WalletContext`
  - balance
  - deposit state
  - withdrawable state
  - withdrawal state
  - wallet refresh/error/readiness
- `GptContext` compatibility boundary
  - 기존 화면 호환성을 유지하면서 신규 코드용 scoped access 추가
  - `useGptSession`
  - `usePutdukAi`
  - `useCommonUi`
- `AppProviders`
  - `GptProvider -> WalletProvider -> MiningProvider` provider boundary 설치

PHASE07은 UI 전면 개편 phase가 아니며 PHASE08+ consumer mining UI가 domain context를 직접 소비할 수 있는 기반을 만드는 데 범위를 제한했다.

## 2. Authority / contract 원칙

Mining business truth는 backend authority를 유지한다.

- consumer web mining client는 Nest `/api/v1/*` user API만 호출한다.
- mining admin route를 consumer web에서 호출하지 않는다.
- mining 상태를 위해 Supabase table을 browser에서 직접 읽지 않는다.
- frontend가 profit/rate/settlement business truth를 재계산하지 않는다.
- `createLiveProfitSnapshot`은 backend response의 `accruedProfitAmount`, `currentDailyRate`, `principalAmount`, lifecycle fields를 snapshot으로 옮길 뿐 수익을 계산하지 않는다.

PHASE06 backend authority의 locked mining contract와 PHASE07 web contract를 blob 단위로 대조했고 두 파일 모두 다음 SHA로 동일했다.

`e7e180e1968194c12f2d720476165889877ca8dd`

따라서 PHASE07에서 mining contract drift는 없다.

## 3. PHASE07 정적 assertion

검증 파일:

`quality/mining/phase07_web_state_assertions.mjs`

검증 범위:

- locked mining contract version / user route
- MiningState 필수 field
- mining user API route
- consumer mining admin API 접근 금지
- direct Supabase 접근 금지
- server-authoritative accrued profit field 사용
- MiningContext ownership
- WalletContext ownership
- scoped Gpt hooks
- AppProviders provider boundary

Fresh checkout 결과:

```text
PHASE07_VERIFY_HEAD=61fe6a6aa4c5ecc57c18b1937f6738111330c6b4
PHASE07_WEB_STATE_ASSERTIONS_PASS
```

## 4. Next generated type sequencing 정상화

초기 경량 verifier에서 standalone `tsc --noEmit`를 `next typegen`보다 먼저 실행하면서 다음 계열 오류가 발생했다.

- `PageProps`
- `LayoutProps`
- route query generated type

`tsconfig.json`은 `.next/types/**/*.ts`를 include하므로 source를 수정하지 않고 verification order를 정상화했다.

Canonical order에서:

```text
next typegen
-> tsc --noEmit
```

을 실행했고 다음을 실제 확인했다.

```text
Generating route types...
✓ Types generated successfully
PHASE07_TYPEGEN_PASS
PHASE07_TYPECHECK_PASS
```

따라서 초기 generated type 오류는 PHASE07 feature source 결함이 아니라 verifier sequencing 문제로 확정했다.

## 5. Canonical fresh-checkout verification — PASS

최종 canonical gate는 기존 isolated non-production Render verifier의 build environment를 사용했다.

- verification service: retired PHASE04 contract verifier
- service id: `srv-dao0do8ae00c73aar74g`
- deploy id: `dep-daog28jm8hqs73ehuu00`
- source checkout: public `phonarawd/putduk-web`
- exact web SHA: `61fe6a6aa4c5ecc57c18b1937f6738111330c6b4`
- Node: `22.14.0`
- pnpm: `11.4.0`
- install: original `pnpm-lock.yaml` + `pnpm-workspace.yaml` patchedDependencies + `--frozen-lockfile`
- packages: 840
- `@opennextjs/cloudflare`: `1.20.6`
- `wrangler`: `4.129.1`
- Next.js: `16.3.4`

실제 chain:

```text
PHASE07_VERIFY_HEAD=61fe6a6aa4c5ecc57c18b1937f6738111330c6b4
PHASE07_WEB_STATE_ASSERTIONS_PASS
PHASE07_NODE=v22.14.0
11.4.0
PHASE07_INSTALL_PASS
PHASE07_TYPEGEN_PASS
PHASE07_TYPECHECK_PASS
PHASE07_LINT_PASS
PHASE07_TEST_PASS
PHASE07_BUILD_PASS
PHASE07_VERIFY_OK
```

### Lint actual result

```text
16 problems (0 errors, 16 warnings)
```

정확한 verdict는 **PASS / 0 errors / 16 warnings**다. Warning을 clean lint로 표현하지 않는다.

### Unit tests actual result

```text
# tests 15
# pass 15
# fail 0
```

### Next build actual result

```text
▲ Next.js 16.3.4 (Turbopack)
✓ Compiled successfully in 7.9s
Finished TypeScript in 5.2s
✓ Generating static pages using 36 workers (35/35)
PHASE07_BUILD_PASS
PHASE07_VERIFY_OK
```

Marker 단독으로 PASS 처리하지 않았다. install, assertion, typegen, typecheck, lint, tests, Next build의 preceding command output을 모두 개별 확인했다.

## 6. Runtime-memory false blocker

초기 verification은 retired free web runtime에서 실행했다.

- runtime memory limit 약 512MiB
- typegen/typecheck/lint/tests는 PASS
- `next build` 시 memory가 limit에 접근한 뒤 runtime metrics가 중단

해당 결과를 source failure로 판정하지 않았다.

이후 original lockfile과 project patches를 그대로 사용하는 Render build environment에서 동일 exact SHA를 검증했고 Next build가 정상 완료됐다. 따라서 PHASE07 closure는 canonical build-plan fresh gate 결과를 authority로 사용한다.

## 7. Production / staging boundary

PHASE07 동안 다음은 변경하지 않았다.

- production deploy
- production DB
- staging mining backend source/config
- Supabase schema
- mining rate logic
- locked mining contract

검증은 isolated retired non-production verifier resource에서만 수행했다.

## 8. Closure verdict

PHASE07 closure 조건을 모두 충족했다.

- state architecture implemented: PASS
- mining contract unchanged: PASS
- no direct mining Supabase access: PASS
- no frontend profit calculation authority: PASS
- exact fresh SHA verified: PASS
- PHASE07 assertion: PASS
- TypeScript: PASS
- lint: PASS / 0 errors / 16 warnings
- unit tests: PASS / 15 passed / 0 failed
- Next build: PASS
- `PHASE07_VERIFY_OK`: confirmed
- evidence documented: PASS
- production untouched: confirmed

**MINE-007 = CLOSED**

**PHASE07 = COMPLETE**

PHASE08은 별도 roadmap/phase SSOT를 다시 확인한 뒤 시작한다.
