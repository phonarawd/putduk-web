# MINE-020 — TRIAL CLIENT INTEGRATION

Status: **VERIFIED — CLIENT CONTRACT WIRED / RELEASE STILL BLOCKED BY STAGING DB + MUTATION E2E**  
Base consumer SHA: `52a146e32c8312e39a7629ca77e4086ff2dd4aed`  
Canonical verified consumer SHA: `5163be4946a8c495b974e2cf845602f539eb9b17`  
Canonical verified backend SHA: `72bb62e59f9d472229a7160f8ac5565175d939da`  
Branch: `phase/mine-trial-integration-20260922`  
Safety: **Production untouched.**

## Integrated user contract

The consumer now wires the locked mining contract routes:

- `GET /api/v1/mining/trial`
- `POST /api/v1/mining/trial/start`

`src/lib/mining/api.ts` exposes authoritative server reads and an idempotent start mutation. The start body sends only `mineId`; trial amount, grant, FX, participation limits, timing, and profit authority remain server-owned.

## Client state

`src/lib/mining/types.ts` now models:

- `NOT_STARTED`
- `ACTIVE`
- `COMPLETED`
- `EXPIRED`
- trial session identity
- mine identity
- trial principal
- accrued trial profit
- completion timing
- welcome-grant metadata
- participation limits and remaining count

`MiningState` includes the authoritative trial snapshot.

`MiningContext` now:

1. loads trial status only for authenticated sessions;
2. clears trial state on logout;
3. includes trial status in the normal authoritative mining refresh;
4. exposes `startTrial` using the shared mining mutation lock;
5. sends an explicit Idempotency-Key;
6. stores the server response immediately;
7. re-syncs mining and wallet state after the mutation.

No client-side trial balance or profit authority was introduced.

## Static gate

`quality/mining/phase20_trial_client_assertions.mjs` requires:

- locked contract version `2026-09-20.mine-v1`
- exact trial GET/POST paths
- client API route/function wiring
- Idempotency-Key on trial start
- exact `mineId` request body
- complete trial status vocabulary
- trial snapshot in `MiningState`
- authenticated refresh wiring
- logout clearing
- shared mutation lock
- mining + wallet resync after trial start

## Canonical verification

Exact consumer SHA:

`5163be4946a8c495b974e2cf845602f539eb9b17`

Observed verifier markers:

- `PHASE20_CONSUMER_VERIFY_HEAD=5163be4946a8c495b974e2cf845602f539eb9b17`
- `PHASE20_TRIAL_CLIENT_ASSERTIONS_PASS`
- `PHASE20_CONSUMER_ASSERTIONS_PASS`
- `PHASE20_CONSUMER_TYPEGEN_PASS`
- `PHASE20_CONSUMER_TYPECHECK_PASS`
- `PHASE20_CONSUMER_LINT_PASS`
- `PHASE20_CONSUMER_TEST_PASS`
- `PHASE20_CONSUMER_BUILD_PASS`
- `PHASE20_CONSUMER_VERIFY_OK`

Quality results:

- ESLint: 0 errors; 15 pre-existing warnings
- tests: 21 pass / 0 fail
- Next.js production build: compile + TypeScript PASS
- static pages: 36 / 36

Verifier service:

- `putduk-mine-phase04-contract-verify`
- service id `srv-dao0do8ae00c73aar74g`
- verification deploy `dep-daolihbm8hqs73flma70`

The verifier branch was restored after the run to historical SHA:

`a79826aaeb7f97b70fae881f1d423ce0f70a49fe`

## Remaining release blockers

This client integration does not make the release production-ready. Still required:

1. rebuild real mutation E2E from the verified backend + consumer line;
2. recover/provision an isolated non-Production Supabase staging target;
3. rehearse the historical ledger + mining migration chain;
4. resolve `BLOCKER-DB-BASELINE-COMPAT-01` against the current Production lineage;
5. only then freeze an RC and request separate Production approval.

**Production untouched.**
