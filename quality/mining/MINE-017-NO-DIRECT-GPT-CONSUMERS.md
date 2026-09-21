# MINE-017 — No Direct GPT Consumers Closure

Status: **CLOSED**  
Phase: **PHASE17 COMPLETE**  
Date: 2026-09-21

## 1. Objective

Eliminate all consumer-side direct `useGpt()` calls outside the GPT context implementation/facade and lock that architecture with a recursive assertion.

Allowed direct `useGpt()` locations are now limited to:

- `src/lib/gpt/GptContext.tsx`
- `src/lib/gpt/GptScopes.ts`

All other `src/**/*.{ts,tsx}` files must use scoped hooks or their own domain contexts.

This phase changes access boundaries only. It does not move wallet authority, mining authority, backend authority, or financial calculations into GPT scopes.

## 2. Base authority

PHASE17 branches from the PHASE16 closure head:

- PHASE16 closure: `21b9465f08790b60d2ada6025e7c00a419b46603`
- Branch: `phase/mine-no-direct-gpt-consumers-20260921`
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`

The mining contract was not modified.

## 3. Assertion-first architecture guard

Added:

- `quality/mining/phase17_no_direct_gpt_consumers_assertions.mjs`

Initial assertion-first commit:

- `50c07c037e8fd88eb34dbb20241196232777f5a3`

The assertion recursively scans every TypeScript/TSX file under `src` and rejects any `useGpt()` call outside `GptContext.tsx` and `GptScopes.ts`.

It also protects prior authority boundaries:

- required scoped hooks remain present
- wallet money field names are forbidden from `GptScopes`
- `loadMoneyRead` is forbidden from `GptScopes`
- `WalletContext` must retain `loadMoneyRead`
- mining contract version remains canonical

## 4. Assertion correction evidence

The first canonical attempt stopped before the consumer scan because the new assertion referenced `contract.version`. The canonical contract actually exposes `contractVersion`.

This was an assertion defect only; runtime/application code was not implicated.

Correction commit:

- `419b00d40329e9cdc3ff3565b8e26316fb1a19b2`

Correction:

- `contract.version` → `contract.contractVersion`

The next canonical assertion then correctly identified the remaining direct consumers.

## 5. Exhaustive residual detection

After the assertion correction, the recursive scan found exactly three remaining direct `useGpt()` consumers:

- `src/app/auth/oauth/google/callback/page.tsx`
- `src/app/legal/page.tsx`
- `src/lib/gpt/useAppSurface.ts`

The failure was intentional and proved the recursive guard was detecting actual residual consumers rather than relying on a hand-maintained file list.

## 6. Remediation

### Google OAuth callback

Commit:

- `99fdfdc9452a2819400a92cbbb03f3568a57343d`

Changes:

- `markGoogleAuth` now comes from `useGptSession()`
- `showToast` now comes from `useCommonUi()`
- callback API behavior, terms handling, referral handling, profile-completion routing, and errors are unchanged

### Legal root page

Commit:

- `a0abf7b666d9b42cdeee8bbe693860e08bef0012`

Changes:

- `loggedIn` now comes from `useGptSession()`
- legal navigation/back behavior is unchanged

### App surface helper

Commit / verified implementation head:

- `2bd7fc01f595659a2744bf2f25a1fe71f307dd9e`

Changes:

- `loggedIn` now comes from `useGptSession()`
- workspace/nav/footer surface calculations remain behaviorally unchanged

After these changes, the recursive assertion reports zero direct consumer-side `useGpt()` calls.

## 7. Canonical exact-SHA verification

Canonical isolated verifier service:

- Render service: `putduk-mine-phase04-contract-verify`
- Service ID: `srv-dao0do8ae00c73aar74g`
- Workspace ID: `tea-da5qqo3m8hqs73djpvvg`
- Backend verifier branch: `phase/mine-operations-settlement-api-integrated-20260921`
- Successful temporary verifier commit: `74c25ad3b6d088bdcd78d84c688a33e4c64fd471`
- Canonical deploy: `dep-daoj1f6gekts73cfpc50`
- Exact consumer checkout: `2bd7fc01f595659a2744bf2f25a1fe71f307dd9e`

Canonical gate results:

- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE17_VERIFY_HEAD=2bd7fc01f595659a2744bf2f25a1fe71f307dd9e`
- pnpm install PASS
- `PHASE17_NO_DIRECT_GPT_CONSUMERS_ASSERTIONS_PASS`
- Next route type generation PASS
- TypeScript `tsc --noEmit` PASS
- ESLint PASS with **0 errors / 15 pre-existing warnings**
- tests: **21 passed / 0 failed**
- Next.js 16.3.4 production build PASS
- static generation: **36/36**
- `PHASE17_BUILD_PASS`
- `PHASE17_VERIFY_OK`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render build successful
- canonical deploy status: **live**

Toolchain observed in canonical verification:

- Node.js 22.14.0
- pnpm 11.4.0
- Next.js 16.3.4

## 8. Canonical failure history

PHASE17 intentionally records two earlier canonical attempts because they provided useful audit evidence.

### Attempt 1

- consumer candidate: `50c07c037e8fd88eb34dbb20241196232777f5a3`
- temporary verifier commit: `d27c778fdb077209135ddd4e73f36c11638e37f0`
- deploy: `dep-daoivqek1f9s73c95a50`
- result: stopped on assertion defect (`contract.version` instead of `contract.contractVersion`)

### Attempt 2

- consumer candidate: `419b00d40329e9cdc3ff3565b8e26316fb1a19b2`
- temporary verifier commit: `8ee6f2d7491fb45285ae1418b29b21956d432f27`
- deploy: `dep-daoj0fid0e5s738fo2r0`
- result: assertion correctly identified the exact three remaining direct `useGpt()` consumers

No failed candidate was treated as verified or closed.

## 9. Verifier recovery

After successful canonical verification, the backend verifier branch was force-restored exactly to the historical PHASE04 authority:

- historical verifier SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- recovery deploy: `dep-daoj2p3tqb8s73fhr34g`

Recovery evidence:

- checkout commit: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- `VERIFY_HEAD=a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render build successful
- recovery deploy status: **live**

Therefore the verifier branch contains none of the PHASE17 temporary verifier files or commits after recovery.

## 10. Authority invariants

PHASE17 preserves all established authority boundaries:

- Wallet money remains owned by `WalletContext`.
- `WalletContext` remains the consumer authority that calls `loadMoneyRead`.
- `GptScopes` does not expose wallet money fields or `loadMoneyRead`.
- Mining truth remains owned by the mining domain/context and server APIs.
- Scoped GPT hooks expose only their intended session, AI, common UI, and opportunity-flow surfaces.
- No direct Supabase/admin endpoint use was introduced.
- No frontend wallet/mining balance synthesis was introduced.

## 11. Untouched systems

During PHASE17:

- production: **untouched**
- staging: **untouched**
- database: **untouched**
- backend API implementation: **unchanged**
- mining contract: **unchanged**

## 12. Closure

The consumer source tree now has a recursive architectural guard that prevents new direct `useGpt()` consumer calls from being introduced outside the GPT context implementation/facade.

**MINE-017 = CLOSED**  
**PHASE17 = COMPLETE**
