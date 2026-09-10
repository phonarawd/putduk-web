import { expect, test } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { becomeUser, openPage } from "../helpers/auth.ts";

async function clickWithdraw(page: import("@playwright/test").Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.locator('form[data-form="withdraw"]').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });
}

test.describe("금융 20-28", () => {
  test("20-23. 원장은 journalType과 안전한 금액만 보여 준다", async ({ page }) => {
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/wallet/history");
    await expect(page.getByText("deposit_usdt")).toBeVisible();
    await expect(page.getByText("withdraw", { exact: true })).toBeVisible();
    await expect(page.getByText("participate_lock")).toBeVisible();
    await expect(page.getByText("withdraw_refund")).toBeVisible();
    await expect(page.getByText(MSG.ledgerDetailNeed)).toHaveCount(2);
    await expect(page.getByText("10.000000")).toBeVisible();
    await expect(page.getByText("0", { exact: true })).toBeVisible();
  });

  test("24-27. 출금은 금액·주소 변경 시 확인을 버리고 재시도는 같은 키를 쓴다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "a", kyc: "approved", withdrawFailCount: 8 });
    await becomeUser(page);
    await page.goto("/wallet/withdraw");
    await page.locator('input[name="amountUsdt"]').fill("1.25");
    await page.locator('input[name="destination"]').fill("TQaWithdrawDestinationFixture0001");
    await page.getByRole("button", { name: "코드 받기" }).click();
    await page.locator('input[name="stepUpCode"]').fill("123456");
    await page.getByRole("button", { name: "코드 확인" }).click();
    await expect(page.getByText(MSG.withdrawConfirmOk)).toBeVisible();
    await clickWithdraw(page);
    await expect.poll(() => mock.captured.withdrawBodies.length).toBe(1);
    const firstKey = (mock.captured.withdrawBodies[0] as { idempotencyKey: string }).idempotencyKey;
    await clickWithdraw(page);
    await expect.poll(() => mock.captured.withdrawBodies.length).toBe(2);
    expect((mock.captured.withdrawBodies[1] as { idempotencyKey: string }).idempotencyKey).toBe(firstKey);

    await page.locator('input[name="amountUsdt"]').fill("2.00");
    await clickWithdraw(page);
    await expect(page.getByText(MSG.withdrawNeedConfirm)).toBeVisible();
    await page.getByRole("button", { name: "코드 받기" }).click();
    await page.locator('input[name="stepUpCode"]').fill("123456");
    await page.getByRole("button", { name: "코드 확인" }).click();
    await clickWithdraw(page);
    await expect.poll(() => mock.captured.withdrawBodies.length).toBe(3);
    const third = mock.captured.withdrawBodies[2] as { idempotencyKey: string; stepUpToken: string };
    expect(third.idempotencyKey).not.toBe(firstKey);
    expect(third.stepUpToken).toBe("qa-step-up-token");

    await page.locator('input[name="destination"]').fill("TQaWithdrawDestinationFixture0002");
    await clickWithdraw(page);
    await expect(page.getByText(MSG.withdrawNeedConfirm)).toBeVisible();
  });

  test("28. 정책 API 실패 후 다시 시도한다", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "approved", withdrawPolicy: "fail-once" });
    await becomeUser(page);
    await page.goto("/wallet/withdraw");
    await expect(page.getByText(MSG.withdrawPolicyFail)).toBeVisible();
    await page.getByRole("button", { name: MSG.withdrawPolicyRetry }).click();
    await expect(page.getByRole("button", { name: "코드 받기" })).toBeVisible();
  });
});
