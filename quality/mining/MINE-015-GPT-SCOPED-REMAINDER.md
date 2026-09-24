# MINE-015 — GPT Scoped Consumer Remainder

- Date: 2026-09-21
- State: CLOSED
- Phase: PHASE15 COMPLETE
- Branch: `phase/mine-gpt-scoped-remainder-20260921`
- Base closure SHA: `9e5b5739a8ef2fd66fe54d5165e7773d902f41ea` (PHASE14)
- Verified implementation SHA: `fe4c83afc43a4bbe5ab7ac16f251115b93d4c2aa`
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`

## Scope closed

PHASE15 removes the remaining direct full-GPT-context access from the audited session, feedback, preference, authentication, referral, legal, and record consumers while preserving existing backend/API behavior.

Implemented:

- `useGptSession()` now exposes the existing session/profile fields needed by onboarding screens: birthday and phone in addition to the already scoped identity fields/actions.
- `useCommonUi()` now exposes existing device-local preference values alongside their existing toggles.
- `useOpportunityFlow()` now exposes existing trade record state: trades, records error state, and desk readiness.
- `GoogleContinueButton` uses `useCommonUi()` only for toast feedback.
- `RouteTop` and `RecognitionView` use `useGptSession()` only for login-aware behavior.
- login, signup, complete-profile, find-id, reset-password, and verify-email screens use the session/common-UI scopes instead of full `useGpt()` access.
- invite uses `useCommonUi()` only for share/copy feedback.
- inbox and settings use scoped device-local preference state/actions.
- settings resets PUTDUK AI conversation state through `usePutdukAi().resetConversation`.
- records reads trades/feed/record status through `useOpportunityFlow()`.

## Authority boundary

Wallet and mining authority remain unchanged.

- `WalletContext` remains the consumer wallet money authority through `loadMoneyRead()`.
- no principal, locked, profit, practice, or wallet money reader is exposed through `GptScopes`.
- mining summary, positions, settlements, and mining mutations remain owned by `MiningContext`.

Session/profile scope:

- onboarding/profile screens consume only session/profile fields and session actions from `useGptSession()`.
- authentication API calls, Turnstile behavior, profile validation, and routing behavior remain unchanged.

Common UI scope:

- toast feedback and device-local preferences are exposed through `useCommonUi()`.
- these preferences remain device-local presentation settings; they do not become server money truth.

Opportunity/record scope:

- `MeRecordsPage` consumes server-derived trade records and opportunity feed through `useOpportunityFlow()`.
- record display retains `opportunityById(trade.opportunityId, feed)` and does not synthesize wallet truth.

PUTDUK AI scope:

- conversation reset is invoked through `usePutdukAi()` rather than the full GPT context.

## Changed surfaces

- `src/lib/gpt/GptScopes.ts`
- `src/components/gpt/GoogleContinueButton.tsx`
- `src/components/gpt/RouteTop.tsx`
- `src/components/gpt/RecognitionView.tsx`
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/auth/complete-profile/page.tsx`
- `src/app/auth/find-id/page.tsx`
- `src/app/auth/reset-password/page.tsx`
- `src/app/auth/verify-email/page.tsx`
- `src/app/invite/page.tsx`
- `src/app/me/inbox/page.tsx`
- `src/app/me/settings/page.tsx`
- `src/app/me/records/page.tsx`
- added `quality/mining/phase15_gpt_scoped_remainder_assertions.mjs`

## PHASE15 assertion

`quality/mining/phase15_gpt_scoped_remainder_assertions.mjs` locks:

- mining contract version stability;
- required profile/preference/trade fields on scoped hooks;
- continued prohibition of wallet money authority in `GptScopes`;
- removal of direct `GptContext` imports and `useGpt()` calls from all PHASE15 audited consumers;
- session-aware RouteTop fallback behavior;
- complete-profile use of scoped profile fields;
- inbox/settings use of scoped device preferences;
- AI conversation reset through `usePutdukAi()`;
- records use of scoped trades/feed/record state;
- continued `WalletContext` money-read authority.

## Canonical verification

Isolated non-production verifier service:

- service: `putduk-mine-phase04-contract-verify`
- service ID: `srv-dao0do8ae00c73aar74g`
- workspace: `tea-da5qqo3m8hqs73djpvvg`
- canonical deploy: `dep-daoinkdg1s2s738hb1dg`
- verifier commit: `f69263d2144c68dcf4230cf58b013be1d848518e`
- exact web SHA: `fe4c83afc43a4bbe5ab7ac16f251115b93d4c2aa`

Canonical results:

- `VERIFY_HEAD=f69263d2144c68dcf4230cf58b013be1d848518e`
- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE15_VERIFY_HEAD=fe4c83afc43a4bbe5ab7ac16f251115b93d4c2aa`
- `PHASE15_INSTALL_PASS`
- `PHASE15_GPT_SCOPED_REMAINDER_ASSERTIONS_PASS`
- `PHASE15_TYPEGEN_PASS`
- `PHASE15_TYPECHECK_PASS`
- lint: `0 errors / 15 warnings` (existing repository warning baseline)
- tests: `21 passed / 0 failed`
- `PHASE15_TEST_PASS`
- Next.js `16.3.4`
- production build: `36/36` static pages generated
- route output includes auth, invite, legal/recognition, me/inbox, me/records, me/settings, wallet, work, and mining activity routes
- `PHASE15_BUILD_PASS`
- `PHASE15_VERIFY_OK`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render: `Build successful`
- canonical deploy reached `live` before verifier recovery replaced it.

Runtime/toolchain observed:

- Node.js `22.14.0`
- pnpm `11.4.0`
- packages installed: `+840`

## Verifier recovery

After canonical verification, the verifier branch was force-restored to its historical authority commit.

- historical SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- recovery deploy: `dep-daoiojgae00c73cmes90`
- `VERIFY_HEAD=a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render: `Build successful`
- recovery deploy state: `live`

## Environment impact

- Production: untouched
- Staging: untouched
- Database: untouched
- Backend API: unchanged
- Mining contract: unchanged
- Canonical verification used only the isolated Render verifier service.

## Closure

`MINE-015 = CLOSED`

`PHASE15 = COMPLETE`
