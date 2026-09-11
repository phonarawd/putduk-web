import assert from "node:assert/strict";
import { test } from "node:test";
import { isNetworkFailure } from "./network-error.ts";

test("isNetworkFailure는 연결 실패만 offline으로 보고 401은 로그인 필요로 둔다", () => {
  assert.equal(isNetworkFailure({ code: "NETWORK", status: 0, message: "연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요." }), true);
  assert.equal(isNetworkFailure(new Error("연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.")), true);
  assert.equal(isNetworkFailure({ code: "AUTH_REQUIRED", status: 401, message: "로그인이 필요해요." }), false);
  assert.equal(isNetworkFailure({ status: 500, message: "잠시 문제가 생겼어요. 다시 시도해 주세요." }), false);
  assert.equal(isNetworkFailure(new Error("로그인이 필요해요.")), false);
  assert.equal(isNetworkFailure("연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요."), false);
});
