import { expect, test } from "@playwright/test";
import { becomeUser, openPage } from "../helpers/auth.ts";

test.describe("Mine OS customer flow", () => {
  test("로그인 후 광산 목록은 서버 Mine만 표시한다", async ({ page }) => {
    await openPage(page, { user: "a", mining: "default" });
    await becomeUser(page);
    await page.goto("/work");

    await expect(page.locator("#mine-catalog-title")).toHaveText("광산");
    await expect(page.getByText("금 광산")).toBeVisible();
    await expect(page.getByText("운용 가능")).toBeVisible();
    await expect(page.getByText("USDT")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "광산 보기" })).toHaveAttribute("href", "/work/mine-gold-qa");
  });

  test("광산이 없으면 빈 상태를 표시하고 레거시 상품을 만들지 않는다", async ({ page }) => {
    await openPage(page, { user: "a", mining: "empty" });
    await becomeUser(page);
    await page.goto("/work");

    await expect(page.getByText("현재 공개된 광산이 없어요.")).toBeVisible();
    await expect(page.getByText("eBay legacy")).toHaveCount(0);
    await expect(page.getByText("자동 매칭 상품")).toHaveCount(0);
  });

  test("광산 상세는 서버 조건과 내 운용을 표시한다", async ({ page }) => {
    await openPage(page, { user: "a", mining: "default" });
    await becomeUser(page);
    await page.goto("/work/mine-gold-qa");

    await expect(page.locator("#mine-detail-title")).toHaveText("금 광산");
    await expect(page.getByText("현재 일일율 · 서버 값")).toBeVisible();
    await expect(page.getByText("100.000000 USDT")).toBeVisible();
    await expect(page.getByText("운용 중")).toBeVisible();
    await expect(page.getByText("금액 늘리기")).toBeVisible();
    await expect(page.getByText("금액 줄이기")).toBeVisible();
    await expect(page.getByText("운용 종료")).toBeVisible();
  });

  test("채굴 시작은 금액 확인 후 동일 요청 키로 서버에 전송한다", async ({ page }) => {
    await openPage(page, { user: "a", mining: "default" });
    await becomeUser(page);
    await page.goto("/work/mine-gold-qa");

    const amount = page.locator("#mining-start-amount");
    await amount.fill("250");
    await page.getByRole("button", { name: "조건 확인" }).click();

    await expect(page.getByText("채굴 시작 확인")).toBeVisible();
    const request = page.waitForRequest((req) => req.url().endsWith("/api/v1/mining/positions/start"));
    await page.getByRole("button", { name: "채굴 시작" }).click();
    const sent = await request;
    expect(sent.method()).toBe("POST");
    expect(sent.headers()["idempotency-key"]).toBeTruthy();
    expect(sent.postDataJSON()).toMatchObject({
      mineId: "mine-gold-qa",
      principalAmount: "250",
      assetCode: "USDT",
    });
  });

  test("운용 금액 변경은 서버 응답을 기준으로 처리한다", async ({ page }) => {
    await openPage(page, { user: "a", mining: "default" });
    await becomeUser(page);
    await page.goto("/work/mine-gold-qa");

    await page.getByRole("button", { name: "금액 늘리기" }).first().click();
    await page.locator("#mining-change-amount").fill("20");
    await page.getByRole("button", { name: "조건 확인" }).last().click();
    await expect(page.getByText("금액 늘리기 확인")).toBeVisible();

    const request = page.waitForRequest((req) => req.url().endsWith("/increase"));
    await page.locator("[aria-live=\"polite\"]").getByRole("button", { name: "금액 늘리기" }).click();
    const sent = await request;
    expect(sent.headers()["idempotency-key"]).toBeTruthy();
    expect(sent.postDataJSON()).toMatchObject({
      positionId: "position-qa-1",
      principalAmount: "20",
      assetCode: "USDT",
    });
  });

  test("종료는 화면에서 임의로 완료 처리하지 않고 서버 상태를 요청한다", async ({ page }) => {
    await openPage(page, { user: "a", mining: "default" });
    await becomeUser(page);
    await page.goto("/work/mine-gold-qa");

    await page.getByRole("button", { name: "운용 종료" }).first().click();
    await expect(page.getByRole("button", { name: "종료 조건 확인" })).toBeVisible();
    await page.getByRole("button", { name: "종료 조건 확인" }).click();
    await expect(page.getByText("운용 종료 확인")).toBeVisible();

    const request = page.waitForRequest((req) => req.url().endsWith("/end"));
    await page.locator("[aria-live=\"polite\"]").getByRole("button", { name: "운용 종료" }).click();
    const sent = await request;
    expect(sent.headers()["idempotency-key"]).toBeTruthy();
    expect(sent.postDataJSON()).toMatchObject({ positionId: "position-qa-1" });
  });
});
