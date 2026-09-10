import { expect, test } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { AUTHORIZE_URL } from "../fixtures/dto.ts";
import { loginThroughForm, openPage, resetRoutes, waitChallenge } from "../helpers/auth.ts";
import { QA_TURNSTILE } from "../helpers/turnstile.ts";

test.describe("인증 1-12", () => {
  test("1. 로그아웃에서 내 기록은 로그인으로 보낸다", async ({ page }) => {
    await openPage(page, { user: "none" });
    await page.goto("/me/records");
    await expect(page).toHaveURL(/\/login/);
  });

  test("2. Google start는 검증된 authorizeUrl로만 옮긴다", async ({ page }) => {
    await openPage(page, { user: "none", googleStart: "ok" });
    await page.route("https://accounts.google.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "google-qa" }),
    );
    await page.goto("/login");
    await page.getByRole("button", { name: "구글로 계속하기" }).click();
    await expect(page).toHaveURL((url) => url.href.startsWith("https://accounts.google.com/"));
    expect(page.url()).toBe(AUTHORIZE_URL);
  });

  test("3. 위험 프로토콜과 잘못된 URL은 거절한다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none", googleStart: "javascript" });
    await page.goto("/login");
    await page.getByRole("button", { name: "구글로 계속하기" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(MSG.googleUrlFail)).toBeVisible();

    await resetRoutes(page);
    await openPage(page, { user: "none", googleStart: "invalid" });
    await page.goto("/login");
    await page.getByRole("button", { name: "구글로 계속하기" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(MSG.googleUrlFail)).toBeVisible();
    expect(mock.captured.callbackCount).toBe(0);
  });

  test("4. Google callback에서 code/state가 없으면 API를 부르지 않는다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none" });
    await page.goto("/auth/oauth/google/callback");
    await expect(page.getByText(MSG.googleCallbackNeed)).toBeVisible();
    expect(mock.captured.callbackCount).toBe(0);
  });

  test("5. callback 중복 호출을 막는다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none", googleCallback: "existing" });
    await page.goto("/auth/oauth/google/callback?code=qa-code&state=qa-state");
    await expect(page).not.toHaveURL(/\/auth\/oauth\/google\/callback/);
    expect(mock.captured.callbackCount).toBe(1);
    expect(mock.captured.callbackBodies[0]).toEqual({ code: "qa-code", state: "qa-state" });
  });

  test("6. 기존 사용자 callback 후 홈", async ({ page }) => {
    await openPage(page, { user: "a", googleCallback: "existing" });
    await page.goto("/auth/oauth/google/callback?code=qa-code&state=qa-state");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /로그인하고 데스크 열기/ })).toHaveCount(0);
  });

  test("7. 신규 사용자 callback 후 약관 대기", async ({ page }) => {
    await openPage(page, { user: "none", googleCallback: "new-terms" });
    await page.goto("/auth/oauth/google/callback?code=qa-code&state=qa-state");
    await expect(page.getByText(MSG.termsNeed)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/oauth\/google\/callback/);
  });

  test("8. 필수정보 입력 후 홈", async ({ page }) => {
    const { mock } = await openPage(page, { user: "a", onboarding: "incomplete" });
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/complete-profile/);
    await page.locator('input[name="email"]').fill("qa-account-a@putduk.test");
    await page.locator('input[name="displayName"]').fill("테스터갑");
    await page.locator('input[name="birthday"]').fill("900101");
    await page.locator('input[name="phone"]').fill("01000000001");
    await page.getByRole("button", { name: "내 데스크 준비하기" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(mock.captured.profileBodies[0]).toMatchObject({
      displayName: "테스터갑",
      phoneE164: "+821000000001",
      birthDate: "1990-01-01",
    });
    expect(JSON.stringify(mock.captured.profileBodies[0])).not.toMatch(/gender/);
  });

  test("9. complete-profile 필수 입력", async ({ page }) => {
    await openPage(page, { user: "a", onboarding: "incomplete" });
    await page.goto("/auth/complete-profile");
    await page.getByRole("button", { name: "내 데스크 준비하기" }).click();
    await expect(page.getByText(MSG.profileNeed)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/complete-profile/);
  });

  test("10. email-resend는 Turnstile 토큰을 포함한다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none" });
    await page.goto("/signup");
    await page.locator('input[name="username"]').fill("qaaccounta");
    await page.locator('input[name="email"]').fill("qa-account-a@putduk.test");
    await page.locator('input[name="password"]').fill("password1");
    await page.locator('input[name="passwordConfirm"]').fill("password1");
    await page.locator('input[name="displayName"]').fill("테스터갑");
    await page.locator('input[name="birthday"]').fill("900101");
    await page.locator('input[name="phone"]').fill("01000000001");
    await page.getByRole("button", { name: /남성/ }).click();
    await page.locator('input[name="requiredTerms"]').check();
    await waitChallenge(page);
    await page.getByRole("button", { name: "회원가입", exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    await waitChallenge(page);
    await page.getByRole("button", { name: "인증 메일 다시 받기" }).click();
    await expect.poll(() => mock.captured.resendBodies.length).toBe(1);
    expect(mock.captured.resendBodies[0]).toMatchObject({
      email: "qa-account-a@putduk.test",
      turnstileToken: QA_TURNSTILE,
    });
  });

  test("11. Turnstile 위젯이 로그인·가입·찾기·재설정에 있다", async ({ page }) => {
    await openPage(page, { user: "none" });
    for (const path of ["/login", "/signup", "/auth/find-id", "/auth/reset-password"]) {
      await page.goto(path);
      await expect(page.locator(".challenge-box")).toHaveCount(1);
    }
  });

  test("12. 로그인 Turnstile 회면과 토큰 전송", async ({ page }) => {
    const { mock } = await openPage(page, { user: "a" });
    await loginThroughForm(page, "a");
    expect(mock.captured.loginBodies[0]).toMatchObject({ turnstileToken: QA_TURNSTILE });
  });
});
