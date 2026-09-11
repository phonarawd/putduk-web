import { expect, test } from "@playwright/test";
import { USER_A, USER_B } from "../fixtures/dto.ts";
import { loginSeeded, openPage, resetRoutes } from "../helpers/auth.ts";

test.describe("계정 격리 13-19", () => {
  test("13-19. 계정 A/B 전환 후 이전 사람 정보가 남지 않는다", async ({ page }) => {
    // 성별 PATCH가 { gender } 하나만 보내는지는 브라우저 타이밍과 무관한 auth.spec.ts 13번(순수 함수
    // 검증)에서 이미 확인한다 - 여기서는 계정 격리 흐름 13~19단계 자체에만 집중해 그대로 둔다.
    await test.step("13. 계정 A 로그인", async () => {
      await openPage(page, { user: "a" });
      await loginSeeded(page, "a", "갑만 아는 대화");
    });
    await test.step("14. A의 이름·성별·대화 fixture", async () => {
      await page.goto("/me");
      await expect(page.locator("#profileDisplayName")).toHaveText(USER_A.declaredName);
      await page.getByRole("button", { name: /남성/ }).click();
      await expect(page.getByRole("button", { name: /남성/ })).toHaveAttribute("aria-pressed", "true");
      await page.goto("/ai");
      await expect(page.getByRole("button", { name: "갑만 아는 대화 이어가기" })).toBeVisible();
    });
    await test.step("15. 로그아웃", async () => {
      await page.goto("/me");
      await page.locator("#logoutButton").click();
      await expect(page).toHaveURL(/\/login|\/$/);
    });
    await test.step("16. 계정 B 로그인", async () => {
      await resetRoutes(page);
      await openPage(page, { user: "b" });
      await loginSeeded(page, "b", "을만 아는 대화");
    });
    await test.step("17. B 화면에 A 정보가 없다", async () => {
      await page.goto("/me");
      await expect(page.locator("#profileDisplayName")).toHaveText(USER_B.declaredName);
      await expect(page.locator("#profileDisplayName")).not.toHaveText(USER_A.declaredName);
      await expect(page.getByRole("button", { name: /남성/ })).toHaveAttribute("aria-pressed", "false");
      await page.goto("/ai");
      await expect(page.getByRole("button", { name: "갑만 아는 대화 이어가기" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "을만 아는 대화 이어가기" })).toBeVisible();
    });
    await test.step("18. 새로고침 격리", async () => {
      await page.reload();
      await expect(page.getByRole("button", { name: "갑만 아는 대화 이어가기" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "을만 아는 대화 이어가기" })).toBeVisible();
    });
    await test.step("19. B 로그아웃 후 계정 저장이 비어 있다", async () => {
      await page.goto("/me");
      await page.locator("#logoutButton").click();
      const leftover = await page.evaluate(() =>
        Object.keys(window.localStorage).filter((key) => key.startsWith("putduk-web-account-v1:")),
      );
      expect(leftover).toEqual([]);
    });
  });
});
