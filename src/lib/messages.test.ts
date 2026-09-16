import assert from "node:assert/strict";
import { test } from "node:test";
import { MSG, userFacingError } from "./messages.ts";

test("참여 거절 코드는 백엔드 의미와 같은 문구로 보여 준다", () => {
  assert.equal(userFacingError("DAILY_MATCH_CAP"), MSG.dailyMatchCap);
  assert.equal(userFacingError("MATCH_BLOCKED"), MSG.matchBlocked);
  assert.equal(userFacingError("SAFETY_DENY"), MSG.safetyDeny);
  assert.equal(userFacingError("OPPORTUNITY_EXPIRED"), MSG.opportunityExpired);
  assert.equal(userFacingError("PREFLIGHT_REQUIRED"), MSG.preflightRequired);
  assert.equal(userFacingError("PRICE_STALE"), MSG.priceStale);
});

test("백엔드가 한글 거절을 주면 그대로 보여 준다", () => {
  assert.equal(userFacingError("오늘 참여 횟수를 모두 썼어요."), "오늘 참여 횟수를 모두 썼어요.");
  assert.equal(
    userFacingError("지금은 매칭을 진행할 수 없어요. 고객센터에 문의해 주세요"),
    "지금은 매칭을 진행할 수 없어요. 고객센터에 문의해 주세요",
  );
});
