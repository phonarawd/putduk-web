# MINE-014 — GPT Scoped Consumer Boundary

- Date: 2026-09-21
- State: CLOSED
- Phase: PHASE14 COMPLETE
- Branch: `phase/mine-gpt-scoped-consumers-20260921`
- Base closure SHA: `b07da305c3ae14ba564942d66fe116c01dbe98bd` (PHASE13)
- Verified implementation SHA: `0753f951978b8e102abed196305920da3a772db4`
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`

## Scope closed

PHASE14 narrows direct consumer access to the legacy GPT context without creating a second source of truth and without moving wallet or mining authority into GPT scopes.

Implemented:

- added `useOpportunityFlow()` as the scoped opportunity/trial/execution consumer surface;
- expanded `usePutdukAi()` to expose conversation list and active conversation ID needed by the AI screen;
- `AppShell` now uses `useGptSession()`, `useCommonUi()`, and `useOpportunityFlow()` instead of full `useGpt()` access;
- `SiteHeader` now consumes only session fields through `useGptSession()`;
- `Toast` now consumes only common UI feedback through `useCommonUi()`;
- `AmbassadorVisual`, `OpportunitySection`, `PreflightModal`, and `ExecutionModal` now consume opportunity/trial/execution state through `useOpportunityFlow()`;
- `PeotteokAiView` now consumes conversation state/actions through `usePutdukAi()`;
- the selected opportunity, server-derived trial state, opportunity feed, and execution state retain their existing semantics;
- no wallet money fields were added to `GptScopes`.

## Authority boundary

Wallet authority remains separate.

- `WalletContext` remains the consumer wallet-money authority through `loadMoneyRead()`;
- `GptScopes` does not expose principal, locked, profit, practice, or wallet money read functions;
- opportunity scoped consumers do not derive wallet truth.

Opportunity / execution authority remains server-derived.

- `OpportunitySection` uses scoped `trial`, `selectedId`, `selected`, and `opportunities`;
- eligibility retains `canStartOpportunity(selected, trial)` and `canStartOpportunity(item, trial)`;
- `ExecutionModal` looks up presentation metadata with `opportunityById(activeExecution.opportunityId, feed)`;
- preflight/participation/execution server mutation logic remains in `GptContext` and was not duplicated into consumers.

PUTDUK AI authority remains conversation-only.

- `usePutdukAi()` exposes conversations, active conversation ID, current conversation, typing state, and AI conversation actions;
- the AI screen no longer reaches into `state.conversations` or `state.activeConversationId` through full GPT context access;
- the AI scoped surface does not own mining or wallet money.

## Changed surfaces

- `src/lib/gpt/GptScopes.ts`
- `src/components/gpt/AppShell.tsx`
- `src/components/gpt/SiteHeader.tsx`
- `src/components/gpt/Toast.tsx`
- `src/components/gpt/AmbassadorVisual.tsx`
- `src/components/gpt/OpportunitySection.tsx`
- `src/components/gpt/PreflightModal.tsx`
- `src/components/gpt/ExecutionModal.tsx`
- `src/components/gpt/PeotteokAiView.tsx`
- added `quality/mining/phase14_gpt_scoped_consumers_assertions.mjs`

## PHASE14 assertion

`quality/mining/phase14_gpt_scoped_consumers_assertions.mjs` locks:

- mining contract version stability;
- existence of session, common UI, AI, and opportunity scoped hooks;
- absence of wallet-money authority from `GptScopes`;
- removal of direct `GptContext` imports and `useGpt()` calls from the eight core consumers;
- AI conversation consumption through `usePutdukAi()`;
- opportunity eligibility through scoped server-derived trial state;
- execution opportunity lookup through scoped server feed;
- continued `WalletContext` money-read authority.

## Canonical verification

Isolated non-production verifier service:

- service: `putduk-mine-phase04-contract-verify`
- service ID: `srv-dao0do8ae00c73aar74g`
- workspace: `tea-da5qqo3m8hqs73djpvvg`
- canonical deploy: `dep-daoih4h42hec73a0hha0`
- verifier commit: `eeaf214c1dae5819d264bc1f3755bec1520ee363`
- exact web SHA: `0753f951978b8e102abed196305920da3a772db4`

Canonical results:

- `VERIFY_HEAD=eeaf214c1dae5819d264bc1f3755bec1520ee363`
- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE14_VERIFY_HEAD=0753f951978b8e102abed196305920da3a772db4`
- `PHASE14_INSTALL_PASS`
- `PHASE14_GPT_SCOPED_CONSUMERS_ASSERTIONS_PASS`
- `PHASE14_TYPEGEN_PASS`
- `PHASE14_TYPECHECK_PASS`
- lint: `0 errors / 15 warnings` (existing repository warning baseline)
- tests: `21 passed / 0 failed`
- `PHASE14_TEST_PASS`
- Next.js `16.3.4`
- production build: `36/36` static pages generated
- `PHASE14_BUILD_PASS`
- `PHASE14_VERIFY_OK`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render: `Build successful`
- canonical deploy reached `live`, then was deactivated when the verifier recovery deploy replaced it.

Runtime/toolchain observed:

- Node.js `22.14.0`
- pnpm `11.4.0`
- packages installed: `+840`

## Verifier recovery

After canonical verification, the verifier branch was force-restored to its historical authority commit.

- historical SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- recovery deploy: `dep-daoii3id0e5s738e12r0`
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

`MINE-014 = CLOSED`

`PHASE14 = COMPLETE`
