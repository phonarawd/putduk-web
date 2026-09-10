import { expect, test } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { becomeUser, openPage } from "../helpers/auth.ts";

test.describe("KYC 29-37", () => {
  test("29. loading", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "slow" });
    await becomeUser(page);
    const pending = page.goto("/me/kyc");
    await expect(page.getByText("상태를 확인하고 있어요")).toBeVisible();
    await pending;
  });

  test("30. none은 제출 폼을 연다", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "none" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await expect(page.locator('form[data-form="kyc"]')).toBeVisible();
  });

  test("31. pending", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "pending" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await expect(page.getByText(MSG.kycPending)).toBeVisible();
    await expect(page.locator('form[data-form="kyc"]')).toHaveCount(0);
  });

  test("32. approved", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "approved" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await expect(page.getByText("확인이 끝났어요")).toBeVisible();
    await expect(page.locator('form[data-form="kyc"]')).toHaveCount(0);
  });

  test("33. rejected 후 다시 제출", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "rejected" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await expect(page.getByText(MSG.kycRejected)).toBeVisible();
    await expect(page.getByText("서류가 흐려요")).toBeVisible();
    await page.getByRole("button", { name: "다시 제출하기" }).click();
    await expect(page.locator('form[data-form="kyc"]')).toBeVisible();
  });

  test("34. error 상태에서는 제출 폼을 열지 않는다", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "error" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await expect(page.getByText(MSG.kycLoadFail)).toBeVisible();
    await expect(page.locator('form[data-form="kyc"]')).toHaveCount(0);
  });

  test("35-36. 파일 첨부·이름·미리보기", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "none" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await page.locator('input[name="idDoc"]').setInputFiles({
      name: "qa-doc.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await page.locator('input[name="selfie"]').setInputFiles({
      name: "qa-face.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await expect(page.getByText(/qa-doc\.png/)).toBeVisible();
    await expect(page.locator('form[data-form="kyc"] img')).toHaveCount(2);
  });

  test("과대 파일은 제출하지 않는다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "a", kyc: "none" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await page.locator('input[name="idDoc"]').setInputFiles({
      name: "too-big.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5_242_881, 1),
    });
    await expect(page.getByText(MSG.kycFileTooLarge)).toBeVisible();
    expect(mock.captured.kycSubmits).toBe(0);
  });

  test("409는 성공으로 보지 않는다", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "none", kycSubmit: "conflict-pending" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await page.locator('input[name="legalName"]').fill("테스터갑");
    await page.locator('input[name="phone"]').fill("01000000001");
    await page.locator('input[name="birthDate"]').fill("1990-01-01");
    await page.locator('input[name="idDoc"]').setInputFiles({
      name: "qa-doc.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await page.locator('input[name="selfie"]').setInputFiles({
      name: "qa-face.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await page.getByRole("button", { name: "본인확인 요청" }).click();
    await expect(page.getByText(MSG.kycPending)).toBeVisible();
    await expect(page.getByText(MSG.kycOk)).toHaveCount(0);
    await expect(page.locator('form[data-form="kyc"]')).toHaveCount(0);
  });

  test("37. 새로고침 후 서버 상태를 우선한다", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "pending" });
    await becomeUser(page);
    await page.goto("/me/kyc");
    await expect(page.getByText(MSG.kycPending)).toBeVisible();
    await page.reload();
    await expect(page.getByText(MSG.kycPending)).toBeVisible();
    await expect(page.locator('form[data-form="kyc"]')).toHaveCount(0);
  });
});
