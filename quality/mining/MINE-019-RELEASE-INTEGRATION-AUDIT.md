# MINE-019 — RELEASE INTEGRATION AUDIT

Status: **AUDIT COMPLETE — RELEASE BLOCKED**  
Audit date: 2026-09-21  
Scope: consumer/backend/admin/mining contract/database/staging release graph  
Production mutation: **NONE**

## 1. Purpose

MINE-019 does not ship mining to Production. It freezes the exact release inputs, checks branch ancestry and API/contract parity, audits database/staging readiness, and records blockers that must be resolved before a release candidate can exist.

This audit is intentionally audit-first. It does not invent missing APIs, does not change the mining contract, does not migrate Production, and does not treat an isolated verifier or a build-only Render service as a production release.

## 2. Authoritative inputs

### Consumer

- Repository: `phonarawd/putduk-web`
- PHASE18 branch: `phase/mine-gpt-import-boundary-20260921`
- PHASE18 closure/base SHA: `a5aebf994a56a9cc10a816333aa9e23a4b4189e6`
- PHASE19 branch: `phase/mine-release-readiness-20260921`

### Backend / admin / mining engine

Repository: `phonarawd/AI-Profit-OS`

| Role | Branch | Audited tip |
| --- | --- | --- |
| production/main baseline | `main` | `ad395b4fa9f5d82c4dd2ac64d5eafa5c7ee4e8fd` |
| contract lock | `phase/mine-contract-lock-20260920` | `b4c1311dd042c0b5bfde8705971cf8b66df4a552` |
| DB foundation | `phase/mine-db-foundation-20260920` | `50c3316eedbc8acc2c20ad7837ebe90df5a9338f` |
| profit engine | `phase/mine-profit-engine-20260920` | `1d690a8ffdc0f7233f58b5693b8bd6e21da23a23` |
| user API / settlement integration / historical verifier authority | `phase/mine-operations-settlement-api-integrated-20260921` | `a79826aaeb7f97b70fae881f1d423ce0f70a49fe` |
| admin API | `phase/mine-admin-api-20260921` | `d6e279841aaa62b7b75f26a7b33d1768923d551b` |
| E2E runner branch | `phase/phase06-e2e-runner-20260921` | `3b17a54c56d67f35047db37a0624b171eb485d39` |

Historical verifier authority remains:

`a79826aaeb7f97b70fae881f1d423ce0f70a49fe`

## 3. Mining contract lock

Audited contract:

- version: `2026-09-20.mine-v1`
- Git blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`

The exact blob is the same on the audited consumer, PHASE04/user API, admin, and E2E tips. **No contract drift was found.**

PHASE19 must not change this file. Contract incompleteness found below is an implementation/release-graph problem, not permission to silently shrink or rewrite the contract.

## 4. Backend ancestry graph

### 4.1 Confirmed relationships

| Comparison | Result | Release meaning |
| --- | --- | --- |
| contract `b4c131…` → DB `50c331…` | DB ahead by 7, behind 0 | DB line contains the contract line |
| DB `50c331…` ↔ profit `1d690a…` | **diverged**; profit side +9, DB side +1; merge-base `74b80f999527ddb19b480e9ec0c959b4fa472d7d` | cannot assume a linear DB→profit chain |
| profit `1d690a…` → PHASE04 `a79826…` | PHASE04 ahead by 24, behind 0 | PHASE04 contains profit tip |
| PHASE04 `a79826…` → admin `d6e279…` | admin ahead by 29, behind 0 | admin contains PHASE04/user API line |
| admin `d6e279…` ↔ E2E `3b17a…` | **diverged**; E2E side +8, admin side +9; merge-base `8630dbf7c197c37c9888fd66588e5976af56059c` | E2E tip is not a release superset of admin |
| main `ad395b…` → admin `d6e279…` | merge-base is main | admin mining line descends from the current audited main baseline |

### BLOCKER-BE-ANCESTRY-01

**DB foundation and profit engine are not a single linear chain.**

A release integration branch must explicitly reconcile the one DB-side divergent commit against the profit/user/admin line. Do not merge by branch name order alone.

### BLOCKER-BE-ANCESTRY-02

**Admin and E2E tips diverge at `8630dbf7…`.**

The E2E branch cannot be promoted as the backend release candidate. Current admin functionality would be lost if that branch were treated as the final backend tip.

## 5. User API parity

The contract defines **12 user mining endpoints**.

### Implemented by both current consumer and current admin/backend line

1. `GET /api/v1/mines`
2. `GET /api/v1/mines/:mineId`
3. `GET /api/v1/mining/me/summary`
4. `GET /api/v1/mining/me/positions`
5. `GET /api/v1/mining/me/positions/:positionId`
6. `GET /api/v1/mining/me/settlements`
7. `POST /api/v1/mining/positions/start`
8. `POST /api/v1/mining/positions/:positionId/increase`
9. `POST /api/v1/mining/positions/:positionId/decrease`
10. `POST /api/v1/mining/positions/:positionId/end`

The mutation path uses `Idempotency-Key`, `principalAmount`, and `assetCode` consistently with the contract.

### Contract-defined but absent from the audited consumer mining API surface and backend user controller

- `GET /api/v1/mining/trial`
- `POST /api/v1/mining/trial/start`

This is **not** currently a consumer-vs-backend path mismatch; both sides implement the same 10-endpoint subset. It is a contract-completeness gap.

## 6. Admin API parity

The contract defines **26 admin mining endpoints**.

The audited admin branch implements the first 20 lifecycle/rate/position/settlement endpoints through `MiningAdminController`, including mine lifecycle, rate maker/checker flow, position reads, settlement reads, and retry.

The following 6 contract-defined endpoints are absent from the audited admin controller:

- `GET /api/v1/admin/mining/trial-config`
- `PATCH /api/v1/admin/mining/trial-config`
- `GET /api/v1/admin/mining/high-value-reviews`
- `GET /api/v1/admin/mining/high-value-reviews/:reviewId`
- `POST /api/v1/admin/mining/high-value-reviews/:reviewId/approve`
- `POST /api/v1/admin/mining/high-value-reviews/:reviewId/reject`

The PHASE05 assertion at the audited admin SHA explicitly requires `trial-config` and `high-value` not to appear in that phase, proving that PHASE05 was intentionally narrower than the final contract rather than a complete final admin implementation.

### BLOCKER-CONTRACT-COMPLETENESS-01

Before RC freeze, resolve the contract-defined missing scope without weakening `2026-09-20.mine-v1`:

- user trial status/start: 2 endpoints
- admin trial config: 2 endpoints
- high-value review lifecycle: 4 endpoints

If product scope intentionally excludes any of these at first launch, that needs an explicit versioned contract/product-scope decision rather than silently shipping a contract that the release does not implement.

## 7. Database source vs Production

### Source migration identified

DB foundation source includes:

`supabase/migrations/20260920224000_mining_foundation_v1.sql`

Admin controls also reference a later mining migration:

`supabase/migrations/20260921162500_mining_admin_controls_v1.sql`

### Production read-only audit

Production Supabase:

- project: `PUTDUK-DATA-PRODUCTION`
- ref: `gaugwamwceqdnqdqrxqg`
- status: `ACTIVE_HEALTHY`
- development branches currently visible: `0`
- latest audited Production migration version: `20260920205033`
- mining/mine/position/settlement/rate-named application tables returned by the read-only catalog probe: none

The source mining foundation migration version `20260920224000` is newer than the latest Production migration observed and is not applied there.

### BLOCKER-PROD-MIGRATION-01

**Mining DB source exists but Production mining schema is not deployed.**

This is expected under the current safety boundary and confirms that canonical build verification must not be confused with launch readiness. Production migration requires a separate reviewed migration plan, isolated/staging rehearsal, backup/rollback checks, and explicit user approval.

## 8. Staging audit

### Render services found

A Render service named `putduk-mine-api-staging` exists and its current live deploy is the admin SHA:

`d6e279841aaa62b7b75f26a7b33d1768923d551b`

The historical deploy sequence shows an earlier PHASE06 staging self-test that deliberately rejected the Production Supabase ref and only accepted a separate staging project ref:

`mgsytcetsiecllmhcyox`

That temporary staging bootstrap used a dedicated DB user/credential path and was later removed from the admin tip.

### Current Supabase inventory

The currently connected Supabase account exposes only:

`gaugwamwceqdnqdqrxqg` — `PUTDUK-DATA-PRODUCTION`

The earlier staging ref `mgsytcetsiecllmhcyox` is not present in the current project inventory.

### Current E2E runner tip

At `3b17a54…`, `quality/mining/phase06_staging_e2e.mjs` is only a tiny verifier HTTP server returning `PHASE07_GATE_VERIFIER`; it is not a real mine list/start/increase/decrease/end/settlement/admin lifecycle test.

`quality/mining/phase07_build_preload.cjs` also verifies an older consumer SHA (`61fe6a6aa4c5ecc57c18b1937f6738111330c6b4`) rather than the current PHASE18 closure.

### BLOCKER-STAGING-DB-01

**No currently available isolated Supabase staging project/branch was verified.**

The Render staging API service alone is not sufficient evidence of safe staging. Before real mutation E2E, provision or recover an isolated DB target and verify by project ref that it is not Production.

### BLOCKER-STAGING-E2E-01

**The current E2E branch tip is a verifier residue, not a current real-API E2E runner.**

Rebuild E2E against the integrated backend RC and the current consumer SHA, then run it only against an isolated staging DB.

## 9. Existing consumer API gap report

`API_GAP_REPORT.md` still records these non-mining product areas as server-dependent and requiring re-audit before launch:

- ID recovery / real mail flow
- password reset / real mail completion flow
- support ticket submission
- notices
- events
- actual notification delivery
- terminal handling for legacy trades without a server terminal state

MINE-019 does **not** label these definitively unimplemented. Their current backend status must be rechecked during product-completeness work because that report predates the present release audit.

## 10. Release blocker inventory

| ID | Severity | Status | Required next evidence |
| --- | --- | --- | --- |
| `BLOCKER-BE-ANCESTRY-01` | release | OPEN | explicit backend integration branch reconciles DB/profit divergence |
| `BLOCKER-BE-ANCESTRY-02` | release | OPEN | admin + current E2E work rebased/rebuilt on one integrated backend line |
| `BLOCKER-CONTRACT-COMPLETENESS-01` | release/product | OPEN | 2 trial user + 6 admin contract endpoints implemented or explicitly version-scoped |
| `BLOCKER-STAGING-DB-01` | release/safety | OPEN | isolated non-Production DB project/branch exists and is identity-checked |
| `BLOCKER-STAGING-E2E-01` | release/QA | OPEN | real current-SHA mutation E2E passes against isolated staging |
| `BLOCKER-PROD-MIGRATION-01` | launch | OPEN | migrations rehearsed and approved; Production remains untouched until explicit approval |

## 11. What is already safe/green

- consumer PHASE18 authority is fixed at `a5aebf…`
- mining contract version/blob is stable across audited branches
- wallet/mining/GPT authority boundaries from PHASE18 remain untouched by PHASE19
- core 10 user mining API routes are aligned between consumer and backend
- admin PHASE05 routes are contract-aligned for the 20 routes it actually implements
- backend admin mining line descends from audited `main`
- Production Supabase is healthy and has not received mining migrations
- historical verifier authority remains `a79826…`

## 12. Required integration order after this audit

1. Create a dedicated backend release-integration branch; do **not** use the E2E tip as RC.
2. Reconcile `BLOCKER-BE-ANCESTRY-01` using exact commits/diffs, preserving the mining foundation migration and profit/user/admin line.
3. Bring contract-defined trial + trial-config + high-value review scope to a deliberate resolution.
4. Rebuild a current E2E runner on the integrated backend SHA.
5. Provision/recover an isolated staging database. Do not reuse Production as staging.
6. Apply mining migrations only to isolated staging first.
7. Run real API mutation E2E and client QA against staging.
8. Continue DB/security/product/observability/full-client gates before RC freeze.
9. Only after an exact-SHA RC is frozen and all blockers are closed can a Production launch plan be presented for explicit approval.

## 13. PHASE19 assertion

Run:

```bash
node quality/mining/phase19_release_readiness_assertions.mjs
```

The assertion locks:

- contract version and exact Git blob
- contract user API definitions
- contract trial/high-value admin definitions
- current consumer core mining API/idempotency shape
- known consumer trial gap snapshot
- exact audited repository SHAs / merge bases
- required blocker markers
- Production untouched statement

## 14. Canonical verification

Canonical consumer implementation/audit SHA:

`606802f50860a2ce56f7e34bc1bd68b602fa7ea5`

Isolated Render verifier:

- service: `putduk-mine-phase04-contract-verify`
- verification deploy: `dep-daojhrlg1s2s738kb6tg`
- temporary verifier commit: `fbbaa18e708893432b16ae8f50447ad21dab7184`
- Node.js: `22.14.0`
- pnpm: `11.4.0`
- Next.js: `16.3.4`

Canonical result:

```text
PHASE04_API_ASSERTIONS_PASS
PHASE19_VERIFY_HEAD=606802f50860a2ce56f7e34bc1bd68b602fa7ea5
PHASE19_RELEASE_READINESS_ASSERTIONS_PASS
PHASE19_ASSERTIONS_PASS
PHASE19_TYPEGEN_PASS
PHASE19_TYPECHECK_PASS
PHASE19_LINT_PASS
PHASE19_TEST_PASS
PHASE19_BUILD_PASS
PHASE19_VERIFY_OK
PHASE04_CONTRACT_VERIFY_OK
```

Quality evidence:

- tests: `21 passed / 0 failed`
- lint: `0 errors / 15 pre-existing warnings`
- Next production build: `36/36` static pages generated
- Render verification deploy status: `live`

The first wrapper attempt (`dep-daojh2ijnfac7397es30`) failed before PHASE19 assertions because an inner `corepack enable` tried to unlink read-only `/usr/bin/pnpm`. The verifier wrapper was corrected to reuse the already-activated pnpm installation; no product/code assertion failed in that attempt.

### Historical verifier recovery

After verification, the backend verifier branch was force-restored to:

`a79826aaeb7f97b70fae881f1d423ce0f70a49fe`

Recovery deploy:

`dep-daojj63bc2fs73e9f280`

Recovery evidence:

```text
VERIFY_HEAD=a79826aaeb7f97b70fae881f1d423ce0f70a49fe
PHASE04_API_ASSERTIONS_PASS
PHASE04_CONTRACT_VERIFY_OK
Build successful
status=live
```

No temporary verifier wrapper remains on the verifier branch.

## 15. Safety / closure condition

**Production untouched.**

MINE-019 canonical verification is complete. Completion means **release integration audit completed**, not **release ready** and not **Production launched**. The blockers in section 10 remain open and must be resolved on non-Production integration/staging infrastructure before any release candidate freeze or Production launch request.
